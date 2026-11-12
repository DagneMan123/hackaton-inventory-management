import { Op } from "sequelize"
import db from "../config/db.js"
import { Sale, SaleItem, Product, InventoryTransaction, User } from "../models/index.js"

const approve_limit = 50000

const calcTotals = (items) => {
  let subtotal = 0
  let totalDiscount = 0
  let vat = 15

  const processed = items.map(item => {
    const qty = parseInt(item.quantity)
    const price = parseFloat(item.unitPrice)
    const disc = parseFloat(item.discountPercent || 0)

    if (disc < 0 || disc > 100) {
      throw new Error(`discount must be 0-100 for product ${item.productId}`)
    }

    const sub = qty * price
    const discAmt = sub * (disc / 100)
    const taxable = sub - discAmt
    const vatAmt = taxable * (vat / 100)
    const total = taxable + vatAmt

    subtotal += sub
    totalDiscount += discAmt

    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      discountPercent: disc,
      subtotal: parseFloat(sub),
      discountAmount: parseFloat(discAmt),
      taxableAmount: parseFloat(taxable),
      vatAmount: parseFloat(vatAmt),
      lineTotal: parseFloat(total),
    }
  })

  const taxable_total = subtotal - totalDiscount
  const vat_total = taxable_total * (vat / 100)
  const grand_total = taxable_total + vat_total

  return {
    processed,
    subtotal: parseFloat(subtotal),
    discountAmount: parseFloat(totalDiscount),
    taxableAmount: parseFloat(taxable_total),
    vatAmount: parseFloat(vat_total),
    totalAmount: parseFloat(grand_total),
  }
}

const makeSaleNumber = async () => {
  const n = await Sale.count()
  const d = new Date()
  const prefix = `HULU${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
  return `${prefix}-${String(n + 1).padStart(4, "0")}`
}

export const getSales = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query

    const page = 1 
    const limit = 50
    const where = {}

    if (status && status !== "all") where.status = status
    if (search) {
      where[Op.or] = [
        { saleNumber: { [Op.iLike]: `%${search}%` } },
        { customerName: { [Op.iLike]: `%${search}%` } },
      ]
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt[Op.gte] = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt[Op.lte] = end
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name", "email"] },
        { model: User, as: "approvedBy", attributes: ["id", "name", "email"] },
        {
          model: SaleItem, as: "items",
          include: [{ model: Product, as: "product", attributes: ["id", "name", "sku"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    })

    res.json({ success: true, sales: rows, total: count })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name", "email"] },
        { model: User, as: "approvedBy", attributes: ["id", "name", "email"] },
        {
          model: SaleItem, as: "items",
          include: [{ model: Product, as: "product", attributes: ["id", "name", "sku", "currentStock"] }],
        },
      ],
    })
    if (!sale) return res.status(404).json({ success: false, message: "sale not found" })
    res.json({ success: true, sale })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const createSale = async (req, res) => {
  const t = await db.transaction()
  try {
    const { customerName, customerEmail, customerPhone, items, vatRate = 15, notes } = req.body

    if (!items || items.length === 0) {
      await t.rollback()
      return res.status(400).json({ success: false, message: "at least one item required" })
    }

    const ids = items.map(i => i.productId)
    const prods = await Product.findAll({
      where: { id: { [Op.in]: ids }, isActive: true },
      transaction: t,
      lock: true,
    })

    const prodMap = new Map(prods.map(p => [p.id, p]))

    for (const item of items) {
      const p = prodMap.get(item.productId)
      if (!p) {
        await t.rollback()
        return res.status(400).json({ success: false, message: `product ${item.productId} not found` })
      }
      if (p.currentStock < parseInt(item.quantity)) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: `not enough stock`,
        })
      }
    }

    const enriched = items.map(item => {
      const p = prodMap.get(item.productId)
      return {
        ...item,
        productName: p.name,
        productSku: p.sku,
        unitPrice: item.unitPrice ?? parseFloat(p.sellingPrice),
      }
    })

    const { processed, subtotal, discountAmount, taxableAmount, vatAmount, totalAmount } =
      calcTotals(enriched, parseFloat(vatRate))

    const needs_approval = totalAmount > approve_limit
    const status = needs_approval ? "pending" : "approved"
    const saleNumber = await makeSaleNumber()

    const sale = await Sale.create({
      saleNumber,
      customerName,
      customerEmail,
      customerPhone,
      subtotal,
      discountAmount,
      taxableAmount,
      vatRate: parseFloat(vatRate),
      vatAmount,
      totalAmount,
      status,
      notes,
      preparedById: req.user?.id || null,
    }, { transaction: t })

    await SaleItem.bulkCreate(
      processed.map(item => ({
        saleId: sale.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        subtotal: item.subtotal,
        discountAmount: item.discountAmount,
        taxableAmount: item.taxableAmount,
        vatAmount: item.vatAmount,
        lineTotal: item.lineTotal,
      })),
      { transaction: t }
    )

    if (status === "approved") {
      for (const item of processed) {
        const p = prodMap.get(item.productId)
        const prev = p.currentStock
        const newStock = prev - item.quantity

        await p.update({ currentStock: newStock }, { transaction: t })
        await InventoryTransaction.create({
          productId: p.id,
          transactionType: "stock_out",
          quantity: item.quantity,
          previousStock: prev,
          currentStock: newStock,
          saleId: sale.id,
          notes: ` ${saleNumber}`,
          createdById: req.user?.id || null,
        }, { transaction: t })
      }
    }

    await t.commit()

    const full = await Sale.findByPk(sale.id, {
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name", "email"] },
        { model: SaleItem, as: "items" },
      ],
    })

    res.status(201).json({
      success: true,
      sale: full,
      requiresApproval: needs_approval,
      message: needs_approval
        ? `sale created, needs manager approval (total > ${approve_limit} birr)`
        : "sale processed",
    })
  } catch (err) {
    await t.rollback()
    console.log(err);
    
    res.status(500).json({ success: false, message: err.message })
  }
}

export const approveSale = async (req, res) => {
  const t = await db.transaction()
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: "items" }],
      transaction: t,
    })

    if (!sale) {
      await t.rollback()
      return res.status(404).json({ success: false, message: "sale not found" })
    }
    if (sale.status !== "pending") {
      await t.rollback()
      return res.status(400).json({ success: false, message: `sale is already ${sale.status}` })
    }

    const items = sale.items || []

    for (const item of items) {
      if (!item.productId) continue

      const p = await Product.findByPk(item.productId, { transaction: t })
      if (!p) continue

      if (p.currentStock < item.quantity) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: `not enough stock for "${p.name}". have ${p.currentStock}, need ${item.quantity}`,
        })
      }

      const prev = p.currentStock
      const newStock = prev - item.quantity

      await p.update({ currentStock: newStock }, { transaction: t })
      await InventoryTransaction.create({
        productId: p.id,
        transactionType: "stock_out",
        quantity: item.quantity,
        previousStock: prev,
        currentStock: newStock,
        saleId: sale.id,
        notes: `sale ${sale.saleNumber} approved`,
        createdById: req.user?.id || null,
      }, { transaction: t })
    }

    await sale.update({
      status: "approved",
      approvedById: req.user?.id || null,
      approvedAt: new Date(),
    }, { transaction: t })

    await t.commit()
    res.json({ success: true, message: "sale approved" })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ success: false, message: err.message })
  }
}

export const rejectSale = async (req, res) => {
  try {
    const { reason } = req.body
    const sale = await Sale.findByPk(req.params.id)

    if (!sale) return res.status(404).json({ success: false, message: "sale not found" })
    if (sale.status !== "pending") {
      return res.status(400).json({ success: false, message: `sale is already ${sale.status}` })
    }

    await sale.update({
      status: "rejected",
      rejectionReason: reason || "rejected by manager",
      approvedById: req.user?.id || null,
      approvedAt: new Date(),
    })

    res.json({ success: true, message: "sale rejected", sale })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const resubmitSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id)
    if (!sale) return res.status(404).json({ success: false, message: "sale not found" })
    if (sale.status !== "rejected") {
      return res.status(400).json({ success: false, message: "only rejected sales can be resubmitted" })
    }
    await sale.update({
      status: "pending",
      rejectionReason: null,
      approvedById: null,
      approvedAt: null,
    })
    res.json({ success: true, message: "sale resubmitted for approval", sale })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const undoSale = async (req, res) => {
  const t = await db.transaction()
  try {
    const sale = await Sale.findByPk(req.params.id, { transaction: t })
    if (!sale) {
      await t.rollback()
      return res.status(404).json({ success: false, message: "sale not found" })
    }
    if (sale.status !== "pending") {
      await t.rollback()
      return res.status(400).json({ success: false, message: "only pending sales can be undone" })
    }
    await SaleItem.destroy({ where: { saleId: sale.id }, transaction: t })
    await sale.destroy({ transaction: t })
    await t.commit()
    res.json({ success: true, message: "sale removed" })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getSalesStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tmrw = new Date(today)
    tmrw.setDate(tmrw.getDate() + 1)

    const month_start = new Date(today.getFullYear(), today.getMonth(), 1)
    const month_end = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const [totalSales, todayRev, monthRev, pending, totalProds, lowStock] = await Promise.all([
      Sale.count({ where: { status: { [Op.in]: ["approved", "completed"] } } }),
      Sale.sum("totalAmount", {
        where: { status: { [Op.in]: ["approved", "completed"] }, createdAt: { [Op.gte]: today, [Op.lt]: tmrw } },
      }),
      Sale.sum("totalAmount", {
        where: { status: { [Op.in]: ["approved", "completed"] }, createdAt: { [Op.gte]: month_start, [Op.lt]: month_end } },
      }),
      Sale.count({ where: { status: "pending" } }),
      Product.count({ where: { isActive: true } }),
      Product.count({ where: { isActive: true, currentStock: { [Op.lte]: 10 } } }),
    ])

    res.json({
      success: true,
      stats: {
        totalSales,
        todayRevenue: todayRev || 0,
        monthRevenue: monthRev || 0,
        pendingSales: pending,
        totalProducts: totalProds,
        lowStockProducts: lowStock,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
