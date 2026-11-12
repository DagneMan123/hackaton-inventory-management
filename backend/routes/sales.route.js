import express from "express"
import { protect, authorize } from "../middleware/auth.js"
import {
  getSales, getSale, createSale, approveSale,
  rejectSale, resubmitSale, undoSale, getSalesStats,
} from "../controller/sales.controller.js"

const router = express.Router()

router.get("/stats", protect, getSalesStats)
router.get("/", protect, getSales)
router.get("/:id", protect, getSale)
router.post("/", protect, authorize("admin", "sales_officer", "manager"), createSale)
router.put("/:id/approve", protect, authorize("admin", "manager"), approveSale)
router.put("/:id/reject", protect, authorize("admin", "manager"), rejectSale)
router.put("/:id/resubmit", protect, resubmitSale)
router.delete("/:id/undo", protect, undoSale)

export default router
