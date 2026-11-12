import User from "./user.model.js"
import Product from "./product.model.js"
import Sale from "./sales.model.js"
import SaleItem from "./sales_item.model.js"
import InventoryTransaction from "./inventory_transactions.model.js"

Sale.belongsTo(User, { as: "preparedBy", foreignKey: "preparedById" })
Sale.belongsTo(User, { as: "approvedBy", foreignKey: "approvedById" })

Sale.hasMany(SaleItem, { as: "items", foreignKey: "saleId", onDelete: "CASCADE", hooks: true })
SaleItem.belongsTo(Sale, { foreignKey: "saleId" })

Product.hasMany(SaleItem, { foreignKey: "productId", onDelete: "SET NULL", hooks: true })
SaleItem.belongsTo(Product, { as: "product", foreignKey: "productId", constraints: true })

Product.hasMany(InventoryTransaction, { foreignKey: "productId", onDelete: "CASCADE", hooks: true })
InventoryTransaction.belongsTo(Product, { as: "product", foreignKey: "productId" })
InventoryTransaction.belongsTo(Sale, { as: "sale", foreignKey: "saleId" })
InventoryTransaction.belongsTo(User, { as: "createdBy", foreignKey: "createdById" })

export { User, Product, Sale, SaleItem, InventoryTransaction }
