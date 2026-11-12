import { DataTypes } from "sequelize"
import db from "../config/db.js"

const Sale = db.define("Sale", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  saleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  taxableAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  vatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 15,
  },
  vatAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
 
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
    defaultValue: "pending",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  preparedById: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approvedById: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "Sales",
  timestamps: true,
})

export default Sale
