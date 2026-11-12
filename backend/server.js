import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import db from "./config/db.js"
import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import salesRoutes from "./routes/sales.route.js"
import reportRoutes from "./routes/report.route.js"

const app = express()

app.use(cors({ origin: "*" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/reports", reportRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "somthing went wrong",
  })
})

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await db.authenticate()
    console.log("db connected")
    await db.sync({ alter: true })
    console.log("tables synced")
    app.listen(PORT, () => {
      console.log(`server runing on port ${PORT}`)
    })
  } catch (err) {
    console.error("cant start server:", err)
    process.exit(1)
  }
}

startServer()