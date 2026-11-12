import express from "express"
import { protect, authorize } from "../middleware/auth.js"
import {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, toggleActive, stockIn, getStockHistory, getCategories,
} from "../controller/product.controller.js"

const router = express.Router()

router.get("/categories", protect, getCategories)
router.get("/", protect, getProducts)
router.get("/:id", protect, getProduct)
router.post("/", protect, authorize("admin", "manager"), createProduct)
router.put("/:id", protect, authorize("admin", "manager"), updateProduct)
router.patch("/:id/toggle-active", protect, authorize("admin", "manager"), toggleActive)
router.delete("/:id", protect, authorize("admin", "manager"), deleteProduct)
router.post("/:id/stock-in", protect, authorize("admin", "manager"), stockIn)
router.get("/:id/history", protect, getStockHistory)

export default router
