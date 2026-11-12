import { DataTypes } from "sequelize"
import db from "../config/db.js"

const InventoryTransaction = db.define("InventoryTransaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.ENUM("stock_in", "stock_out"),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  saleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: "InventoryTransactions",
  timestamps: true,
})

export default InventoryTransaction
