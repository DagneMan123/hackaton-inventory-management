import express from "express"
import { protect } from "../middleware/auth.js"
import { getDailyReport, getMonthlyReport, getStockReport, exportReport } from "../controller/report.controller.js"

const router = express.Router()

router.get("/daily", protect, getDailyReport)
router.get("/monthly", protect, getMonthlyReport)
router.get("/stock", protect, getStockReport)
router.get("/export", protect, exportReport)

export default router
