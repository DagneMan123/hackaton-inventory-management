import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export const protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "role", "isActive"],
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "user not found or inactive" })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: "invalid token" })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `role '${req.user.role}' not allowed`,
      })
    }
    next()
  }
}

