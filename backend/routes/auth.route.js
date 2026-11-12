import express from "express"
import { protect, authorize } from "../middleware/auth.js"
import { login, getMe, register, updateProfile, changePassword, getUsers, toggleUserActive, deleteUser } from "../controller/auth.controller.js"

const router = express.Router()

router.post("/login", login)
router.get("/me", protect, getMe)
router.put("/profile", protect, updateProfile)
router.put("/change-password", protect, changePassword)
router.post("/register", protect, authorize("admin", "manager"), register)
router.get("/users", protect, authorize("admin", "manager"), getUsers)
router.patch("/users/:id/toggle", protect, authorize("admin", "manager"), toggleUserActive)
router.delete("/users/:id", protect, authorize("admin"), deleteUser)

export default router
