import { DataTypes } from "sequelize"
import db from "../config/db.js"

const SaleItem = db.define("SaleItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  saleId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productId: {
    type: DataTypes.UUID,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productSku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  discountPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  taxableAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  vatAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  lineTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: "SaleItems",
  timestamps: true,
})

export default SaleItem
