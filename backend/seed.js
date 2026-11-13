import dotenv from "dotenv";
dotenv.config();

import db from "./config/db.js";
import { User, Product, Sale, SaleItem } from "./models/index.js";

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await db.authenticate();
    console.log("Database connected successfully.");

    await db.sync({ alter: true });
    console.log("Database tables synchronized.");

    // 1. Ensure Admin User exists and has correct credentials
    const adminEmail = "aydenfudagne@gmail.com";
    const adminPassword = "MYlove8%";

    let admin = await User.findOne({ where: { email: adminEmail } });

    if (!admin) {
      admin = await User.create({
        name: "Admin User",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isActive: true,
      });
      console.log(`Created admin user: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      admin.role = "admin";
      admin.isActive = true;
      await admin.save();
      console.log(`Updated admin user password for: ${adminEmail}`);
    }

    // Also ensure a manager user exists for approvals
    const managerEmail = "manager@hulustack.com";
    let manager = await User.findOne({ where: { email: managerEmail } });
    if (!manager) {
      manager = await User.create({
        name: "Store Manager",
        email: managerEmail,
        password: "password123",
        role: "manager",
        isActive: true,
      });
      console.log(`Created manager user: ${managerEmail}`);
    }

    // 2. Ensure Sample Products exist
    const productCount = await Product.count();
    let sampleProducts = [];

    if (productCount === 0) {
      console.log("Seeding sample products...");
      sampleProducts = await Product.bulkCreate([
        {
          name: "Dell XPS 15 Laptop",
          category: "Computers",
          sku: "DELL-XPS-15",
          description: "High performance Intel Core i7 16GB RAM laptop",
          costPrice: 65000.0,
          sellingPrice: 85000.0,
          initialStock: 15,
          currentStock: 12,
          isActive: true,
        },
        {
          name: "Logitech MX Master 3S",
          category: "Accessories",
          sku: "LOGI-MX-3S",
          description: "Ergonomic wireless mouse with quiet clicks",
          costPrice: 4500.0,
          sellingPrice: 7200.0,
          initialStock: 40,
          currentStock: 35,
          isActive: true,
        },
        {
          name: "LG UltraFine 27-inch 4K",
          category: "Displays",
          sku: "LG-27-4K",
          description: "IPS 4K UHD color-accurate monitor",
          costPrice: 28000.0,
          sellingPrice: 38500.0,
          initialStock: 20,
          currentStock: 16,
          isActive: true,
        },
        {
          name: "Keychron K2 Mechanical Keyboard",
          category: "Accessories",
          sku: "KEY-K2-V2",
          description: "Wireless mechanical keyboard with Gateron switches",
          costPrice: 5000.0,
          sellingPrice: 7800.0,
          initialStock: 25,
          currentStock: 20,
          isActive: true,
        },
        {
          name: "Ergonomic Office Chair Pro",
          category: "Furniture",
          sku: "CHAIR-ERGO-01",
          description: "Mesh breathable back support office chair",
          costPrice: 12000.0,
          sellingPrice: 18500.0,
          initialStock: 10,
          currentStock: 8,
          isActive: true,
        },
      ]);
      console.log(`Seeded ${sampleProducts.length} products.`);
    } else {
      sampleProducts = await Product.findAll({ limit: 5 });
    }

    // 3. Ensure Sample Sales exist so Reports and Orders have data
    const salesCount = await Sale.count();

    if (salesCount === 0 && sampleProducts.length > 0) {
      console.log("Seeding initial sales records for reports...");

      const p1 = sampleProducts[0];
      const p2 = sampleProducts[1];

      // Sale 1: Approved sale
      const s1Subtotal = parseFloat(p1.sellingPrice) * 1 + parseFloat(p2.sellingPrice) * 2;
      const s1Discount = 1000.0;
      const s1Taxable = s1Subtotal - s1Discount;
      const s1Vat = s1Taxable * 0.15;
      const s1Total = s1Taxable + s1Vat;

      const sale1 = await Sale.create({
        saleNumber: "HULU202611-0001",
        customerName: "Abebe Kebede",
        customerEmail: "abebe@gmail.com",
        customerPhone: "0911223344",
        subtotal: s1Subtotal,
        discountAmount: s1Discount,
        taxableAmount: s1Taxable,
        vatRate: 15,
        vatAmount: s1Vat,
        totalAmount: s1Total,
        status: "approved",
        notes: "Corporate workstation equipment",
        preparedById: admin.id,
        approvedById: manager.id,
        approvedAt: new Date(),
      });

      await SaleItem.bulkCreate([
        {
          saleId: sale1.id,
          productId: p1.id,
          productName: p1.name,
          productSku: p1.sku,
          quantity: 1,
          unitPrice: p1.sellingPrice,
          discountPercent: 0,
          subtotal: parseFloat(p1.sellingPrice),
          discountAmount: 0,
          taxableAmount: parseFloat(p1.sellingPrice),
          vatAmount: parseFloat(p1.sellingPrice) * 0.15,
          lineTotal: parseFloat(p1.sellingPrice) * 1.15,
        },
        {
          saleId: sale1.id,
          productId: p2.id,
          productName: p2.name,
          productSku: p2.sku,
          quantity: 2,
          unitPrice: p2.sellingPrice,
          discountPercent: 5,
          subtotal: parseFloat(p2.sellingPrice) * 2,
          discountAmount: 1000,
          taxableAmount: parseFloat(p2.sellingPrice) * 2 - 1000,
          vatAmount: (parseFloat(p2.sellingPrice) * 2 - 1000) * 0.15,
          lineTotal: (parseFloat(p2.sellingPrice) * 2 - 1000) * 1.15,
        },
      ]);

      // Sale 2: Completed sale
      const s2Subtotal = parseFloat(p2.sellingPrice) * 1;
      const s2Taxable = s2Subtotal;
      const s2Vat = s2Taxable * 0.15;
      const s2Total = s2Taxable + s2Vat;

      const sale2 = await Sale.create({
        saleNumber: "HULU202611-0002",
        customerName: "Sara Tesfaye",
        customerEmail: "sara@gmail.com",
        customerPhone: "0922334455",
        subtotal: s2Subtotal,
        discountAmount: 0,
        taxableAmount: s2Taxable,
        vatRate: 15,
        vatAmount: s2Vat,
        totalAmount: s2Total,
        status: "completed",
        notes: "Walk-in retail customer",
        preparedById: admin.id,
        approvedById: admin.id,
        approvedAt: new Date(),
      });

      await SaleItem.create({
        saleId: sale2.id,
        productId: p2.id,
        productName: p2.name,
        productSku: p2.sku,
        quantity: 1,
        unitPrice: p2.sellingPrice,
        discountPercent: 0,
        subtotal: s2Subtotal,
        discountAmount: 0,
        taxableAmount: s2Taxable,
        vatAmount: s2Vat,
        lineTotal: s2Total,
      });

      console.log("Seeded 2 sample sales with line items.");
    }

    console.log("\n==========================================");
    console.log("DATABASE SEEDING SUCCESSFUL!");
    console.log("==========================================");
    console.log("Admin Credentials:");
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log("------------------------------------------");
    console.log("Manager Credentials:");
    console.log(`  Email:    ${managerEmail}`);
    console.log(`  Password: password123`);
    console.log("==========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDatabase();
