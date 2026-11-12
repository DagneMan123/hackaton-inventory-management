import { Op } from "sequelize"
import { Product, InventoryTransaction, SaleItem } from "../models/index.js"
import db from "../config/db.js"

export const getProducts = async (req, res) => {
  try {
    const { search, category, isActive, page = 1, limit = 100 } = req.query
    const where = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ]
    }

    if (category && category !== "all") where.category = category

    if (isActive === "all") {
    } else if (isActive === "false") {
      where.isActive = false
    } else {
      where.isActive = true
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    })

    res.json({ success: true, products: rows, total: count })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getProduct = async (req, res) => {
  try {
    const prod = await Product.findByPk(req.params.id)
    if (!prod) return res.status(404).json({ success: false, message: "product not found" })
    res.json({ success: true, product: prod })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, category, sku, description, costPrice, sellingPrice, initialStock } = req.body

    if (!name || !category || !sku || costPrice == null || sellingPrice == null) {
      return res.status(400).json({ success: false, message: "name, category, sku, costPrice and sellingPrice are required" })
    }

    const existing = await Product.findOne({ where: { sku } })
    if (existing) {
      return res.status(400).json({ success: false, message: "sku already exists" })
    }

    const qty = parseInt(initialStock) || 0
    const prod = await Product.create({
      name, category, sku, description,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      initialStock: qty,
      currentStock: qty,
    })

    if (qty > 0) {
      await InventoryTransaction.create({
        productId: prod.id,
        transactionType: "stock_in",
        quantity: qty,
        previousStock: 0,
        currentStock: qty,
        notes: "initial stock",
        createdById: req.user?.id || null,
      })
    }

    res.status(201).json({ success: true, product: prod })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const prod = await Product.findByPk(req.params.id)
    if (!prod) return res.status(404).json({ success: false, message: "product not found" })

    const { name, category, sku, description, costPrice, sellingPrice, isActive } = req.body

    if (sku && sku !== prod.sku) {
      const taken = await Product.findOne({ where: { sku } })
      if (taken) return res.status(400).json({ success: false, message: "sku already exists" })
    }

    await prod.update({
      name: name ?? prod.name,
      category: category ?? prod.category,
      sku: sku ?? prod.sku,
      description: description ?? prod.description,
      costPrice: costPrice != null ? parseFloat(costPrice) : prod.costPrice,
      sellingPrice: sellingPrice != null ? parseFloat(sellingPrice) : prod.sellingPrice,
      isActive: isActive != null ? isActive : prod.isActive,
    })

    res.json({ success: true, product: prod })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}


export const deleteProduct = async (req, res) => {
  const t = await db.transaction()
  try {
    const prod = await Product.findByPk(req.params.id, { transaction: t })
    if (!prod) {
      await t.rollback()
      return res.status(404).json({ success: false, message: "product not found" })
    }

    await SaleItem.destroy({ where: { productId: prod.id }, transaction: t })
    await InventoryTransaction.destroy({ where: { productId: prod.id }, transaction: t })
    await prod.destroy({ transaction: t })

    await t.commit()
    res.json({ success: true, message: "product deleted" })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ success: false, message: err.message })
  }
}

export const stockIn = async (req, res) => {
  const t = await db.transaction()
  try {
    const { quantity, notes } = req.body
    const qty = parseInt(quantity)

    if (!qty || qty <= 0) {
      await t.rollback()
      return res.status(400).json({ success: false, message: "quantity must be positive" })
    }

    const prod = await Product.findByPk(req.params.id, { transaction: t, lock: true })
    if (!prod) {
      await t.rollback()
      return res.status(404).json({ success: false, message: "product not found" })
    }

    const prev = prod.currentStock
    const newQty = prev + qty

    await prod.update({ currentStock: newQty }, { transaction: t })

    const txn = await InventoryTransaction.create({
      productId: prod.id,
      transactionType: "stock_in",
      quantity: qty,
      previousStock: prev,
      currentStock: newQty,
      notes: notes || "manual stock-in",
      createdById: req.user?.id || null,
    }, { transaction: t })

    await t.commit()
    res.json({ success: true, product: prod, transaction: txn })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getStockHistory = async (req, res) => {
  try {
    const history = await InventoryTransaction.findAll({
      where: { productId: req.params.id },
      order: [["createdAt", "DESC"]],
    })
    res.json({ success: true, transactions: history })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const toggleActive = async (req, res) => {
  try {
    const prod = await Product.findByPk(req.params.id)
    if (!prod) return res.status(404).json({ success: false, message: "product not found" })
    await prod.update({ isActive: !prod.isActive })
    res.json({
      success: true,
      message: prod.isActive ? "product activated" : "product deactivated",
      product: prod,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getCategories = async (req, res) => {
  try {
    const rows = await Product.findAll({ attributes: ["category"], group: ["category"] })
    const cats = rows.map(r => r.category)
    res.json({ success: true, categories: cats })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
