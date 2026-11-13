import { Op, fn, col, literal } from "sequelize";
import { Sale, SaleItem, Product, InventoryTransaction, User } from "../models/index.js";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";

const money = (v) => parseFloat(v || 0).toFixed(2);

const parseDayBounds = (dateStr) => {
  if (!dateStr) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, dateStr: now.toISOString().split("T")[0] };
  }
  const parts = dateStr.split("-").map(Number);
  const start = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  return { start, end, dateStr };
};

const buildStatusCondition = (status) => {
  if (status === "approved") return { [Op.in]: ["approved", "completed"] };
  if (status === "pending") return "pending";
  if (status === "completed") return "completed";
  if (status && status !== "all") return status;
  return { [Op.ne]: "rejected" };
};

const computeTotals = (sales) =>
  sales.reduce(
    (acc, s) => ({
      subtotal: acc.subtotal + parseFloat(s.subtotal || 0),
      discountAmount: acc.discountAmount + parseFloat(s.discountAmount || 0),
      taxableAmount: acc.taxableAmount + parseFloat(s.taxableAmount || 0),
      vatAmount: acc.vatAmount + parseFloat(s.vatAmount || 0),
      totalAmount: acc.totalAmount + parseFloat(s.totalAmount || 0),
    }),
    { subtotal: 0, discountAmount: 0, taxableAmount: 0, vatAmount: 0, totalAmount: 0 }
  );

export const getAllSalesReport = async (req, res) => {
  try {
    const { status = "all", startDate, endDate } = req.query;
    const where = { status: buildStatusCondition(status) };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const parts = startDate.split("-").map(Number);
        where.createdAt[Op.gte] = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      }
      if (endDate) {
        const parts = endDate.split("-").map(Number);
        where.createdAt[Op.lte] = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
      }
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name"] },
        { model: User, as: "approvedBy", attributes: ["id", "name"] },
        { model: SaleItem, as: "items" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, sales, totals: computeTotals(sales) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyReport = async (req, res) => {
  try {
    const { start, end, dateStr } = parseDayBounds(req.query.date);
    const status = req.query.status || "all";

    const sales = await Sale.findAll({
      where: {
        status: buildStatusCondition(status),
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name"] },
        { model: User, as: "approvedBy", attributes: ["id", "name"] },
        { model: SaleItem, as: "items" },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({ success: true, date: dateStr, sales, totals: computeTotals(sales) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const status = req.query.status || "all";

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: {
        status: buildStatusCondition(status),
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        { model: User, as: "preparedBy", attributes: ["id", "name"] },
        { model: User, as: "approvedBy", attributes: ["id", "name"] },
        { model: SaleItem, as: "items" },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({ success: true, year, month, sales, totals: computeTotals(sales) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockReport = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });

    const lowStock = products.filter((p) => p.currentStock <= 10);
    const outOfStock = products.filter((p) => p.currentStock === 0);

    res.json({ success: true, products, lowStock, outOfStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { type = "daily", format = "xlsx", date, year, month, status = "all" } = req.query;

    let data = {};
    let title = "";

    if (type === "all") {
      const sales = await Sale.findAll({
        where: { status: buildStatusCondition(status) },
        include: [
          { model: User, as: "preparedBy", attributes: ["id", "name"] },
          { model: User, as: "approvedBy", attributes: ["id", "name"] },
          { model: SaleItem, as: "items" },
        ],
        order: [["createdAt", "DESC"]],
      });
      data = { sales };
      title = "All Sales Report";
    } else if (type === "daily") {
      const { start, end, dateStr } = parseDayBounds(date);
      const sales = await Sale.findAll({
        where: {
          status: buildStatusCondition(status),
          createdAt: { [Op.between]: [start, end] },
        },
        include: [
          { model: User, as: "preparedBy", attributes: ["id", "name"] },
          { model: User, as: "approvedBy", attributes: ["id", "name"] },
          { model: SaleItem, as: "items" },
        ],
        order: [["createdAt", "ASC"]],
      });

      data = { sales, date: dateStr };
      title = `Daily Sales Report - ${dateStr}`;
    } else if (type === "monthly") {
      const y = parseInt(year) || new Date().getFullYear();
      const m = parseInt(month) || new Date().getMonth() + 1;
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999);

      const sales = await Sale.findAll({
        where: {
          status: buildStatusCondition(status),
          createdAt: { [Op.between]: [start, end] },
        },
        include: [
          { model: User, as: "preparedBy", attributes: ["id", "name"] },
          { model: User, as: "approvedBy", attributes: ["id", "name"] },
          { model: SaleItem, as: "items" },
        ],
        order: [["createdAt", "ASC"]],
      });

      const monthName = new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
      data = { sales, year: y, month: m, monthName };
      title = `Monthly Sales Report - ${monthName} ${y}`;
    } else if (type === "stock") {
      const products = await Product.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]],
      });
      data = { products };
      title = "Stock Report";
    }

    if (format === "xlsx") {
      const buffer = generateExcelReport(type, data, title);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/ /g, "_")}.xlsx"`);
      return res.send(buffer);
    } else if (format === "pdf") {
      const buffer = await generatePdfReport(type, data, title);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/ /g, "_")}.pdf"`);
      return res.send(buffer);
    }

    res.status(400).json({ success: false, message: "Invalid format. Use xlsx or pdf" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


function generateExcelReport(type, data, title) {
  const wb = XLSX.utils.book_new();

  if (type === "stock") {
    const headers = ["No.", "Product Name", "SKU", "Category", "Cost Price", "Selling Price", "Initial Stock", "Current Stock", "Status"];
    const rows = data.products.map((p, i) => [
      i + 1,
      p.name,
      p.sku,
      p.category,
      parseFloat(p.costPrice),
      parseFloat(p.sellingPrice),
      p.initialStock,
      p.currentStock,
      p.currentStock === 0 ? "Out of Stock" : p.currentStock <= 10 ? "Low Stock" : "In Stock",
    ]);

    const sheetData = [
      ["QELEM MEDA TECHNOLOGIES PLC"],
      [title],
      [],
      headers,
      ...rows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = headers.map((_, i) => ({ wch: i === 1 ? 30 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
  } else {

    const headers = [
      "No.", "Sale #", "Date", "Customer", "Subtotal", "Discount", "Taxable Amount", "VAT (15%)", "Total", "Status", "Prepared By", "Approved By",
    ];

    const rows = data.sales.map((s, i) => [
      i + 1,
      s.saleNumber,
      new Date(s.createdAt).toLocaleDateString("en-ET"),
      s.customerName || "Walk-in",
      parseFloat(s.subtotal),
      parseFloat(s.discountAmount),
      parseFloat(s.taxableAmount),
      parseFloat(s.vatAmount),
      parseFloat(s.totalAmount),
      s.status || "—",
      s.preparedBy?.name || "",
      s.approvedBy?.name || "",
    ]);

    const totals = data.sales.reduce(
      (acc, s) => {
        acc[4] += parseFloat(s.subtotal || 0);
        acc[5] += parseFloat(s.discountAmount || 0);
        acc[6] += parseFloat(s.taxableAmount || 0);
        acc[7] += parseFloat(s.vatAmount || 0);
        acc[8] += parseFloat(s.totalAmount || 0);
        return acc;
      },
      ["", "TOTAL", "", "", 0, 0, 0, 0, 0, "", "", ""]
    );

    const sheetData = [
      ["QELEM MEDA TECHNOLOGIES PLC"],
      [title],
      [],
      headers,
      ...rows,
      [],
      totals,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = headers.map((_, i) => ({ wch: i === 3 ? 25 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}


function generatePdfReport(type, data, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: type === "stock" ? "portrait" : "landscape" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.fontSize(14).font("Helvetica-Bold").text("QELEM MEDA TECHNOLOGIES PLC", { align: "center" });
    doc.fontSize(11).font("Helvetica").text(title, { align: "center" });
    doc.moveDown();

    if (type === "stock") {
      const headers = ["No.", "Product Name", "SKU", "Category", "Cost Price", "Selling Price", "Stock", "Status"];
      const colWidths = [30, 130, 80, 90, 70, 75, 50, 70];
      let y = doc.y;
      const startX = 30;

     
      doc.fontSize(8).font("Helvetica-Bold");
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).fill("#1a3a5c");
      let x = startX;
      headers.forEach((h, i) => {
        doc.fillColor("white").text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: "center" });
        x += colWidths[i];
      });
      y += 18;

      doc.font("Helvetica").fontSize(7).fillColor("black");
      data.products.forEach((p, idx) => {
        const status = p.currentStock === 0 ? "Out of Stock" : p.currentStock <= 10 ? "Low Stock" : "In Stock";
        const row = [idx + 1, p.name, p.sku, p.category, money(p.costPrice), money(p.sellingPrice), p.currentStock, status];

        if (idx % 2 === 0) doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 15).fill("#f5f5f5");
        doc.fillColor("black");
        x = startX;
        row.forEach((val, i) => {
          doc.text(String(val), x + 2, y + 4, { width: colWidths[i] - 4, align: i > 3 ? "right" : "left" });
          x += colWidths[i];
        });
        y += 15;
      });
    } else {
      const headers = ["No.", "Sale #", "Date", "Customer", "Subtotal", "Discount", "Taxable", "VAT", "Total", "Prepared By"];
      const colWidths = [25, 90, 65, 100, 65, 60, 65, 55, 70, 90];
      let y = doc.y;
      const startX = 30;

      doc.fontSize(8).font("Helvetica-Bold");
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).fill("#1a3a5c");
      let x = startX;
      headers.forEach((h, i) => {
        doc.fillColor("white").text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: "center" });
        x += colWidths[i];
      });
      y += 18;

      doc.font("Helvetica").fontSize(7).fillColor("black");
      data.sales.forEach((s, idx) => {
        const row = [
          idx + 1,
          s.saleNumber,
          new Date(s.createdAt).toLocaleDateString("en-ET"),
          s.customerName || "Walk-in",
          money(s.subtotal),
          money(s.discountAmount),
          money(s.taxableAmount),
          money(s.vatAmount),
          money(s.totalAmount),
          s.preparedBy?.name || "",
        ];

        if (idx % 2 === 0) doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 15).fill("#f5f5f5");
        doc.fillColor("black");
        x = startX;
        row.forEach((val, i) => {
          doc.text(String(val), x + 2, y + 4, { width: colWidths[i] - 4, align: i > 3 ? "right" : "left" });
          x += colWidths[i];
        });
        y += 15;
      });



      const totalRow = [
        "", "TOTAL", "", "",
        money(data.sales.reduce((s, r) => s + parseFloat(r.subtotal), 0)),
        money(data.sales.reduce((s, r) => s + parseFloat(r.discountAmount), 0)),
        money(data.sales.reduce((s, r) => s + parseFloat(r.taxableAmount), 0)),
        money(data.sales.reduce((s, r) => s + parseFloat(r.vatAmount), 0)),
        money(data.sales.reduce((s, r) => s + parseFloat(r.totalAmount), 0)),
        "",
      ];
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).fill("#1a3a5c");
      doc.fillColor("white").font("Helvetica-Bold");
      x = startX;
      totalRow.forEach((val, i) => {
        doc.text(String(val), x + 2, y + 5, { width: colWidths[i] - 4, align: i > 3 ? "right" : "left" });
        x += colWidths[i];
      });

     
      y += 40;
      doc.fillColor("black").font("Helvetica").fontSize(9);
      doc.text("Prepared By:", startX, y);
      doc.text("Name: ____________________", startX, y + 15);
      doc.text("Signature: ________________", startX, y + 30);
      doc.text("Date: _____________________", startX, y + 45);

      doc.text("Approved By:", 400, y);
      doc.text("Name: ____________________", 400, y + 15);
      doc.text("Signature: ________________", 400, y + 30);
      doc.text("Date: _____________________", 400, y + 45);
    }

    doc.end();
  });
}
