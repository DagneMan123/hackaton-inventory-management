import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const role_redirects = {
  admin: "/admin",
  manager: "/admin",
  sales_officer: "/admin",
}

const makeToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password required" })
    }

    const user = await User.findOne({ where: { email } })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "invalid credentials" })
    }

    if (!user.isActive) {
       return res.status(401).json({ success: false, message: "User is Not Active" })
    }

    const token = makeToken(user.id)

    res.json({
      success: true,
      token,
      role: user.role,
      redirectTo: role_redirects[user.role] || "/admin",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "isActive", "createdAt"],
    })
    if (!user) return res.status(404).json({ success: false, message: "user not found" })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" })
    }

    const requested_role = role || "sales_officer"

    if (req.user.role === "manager" && requested_role === "admin") {
      return res.status(403).json({ success: false, message: "managers cannot create admin users" })
    }

    const already = await User.findOne({ where: { email } })
    if (already) {
      return res.status(400).json({ success: false, message: "email already registerd" })
    }

    const user = await User.create({ name, email, password, role: requested_role })

    res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body

    if (!name && !email) {
      return res.status(400).json({ success: false, message: "provide name or email" })
    }

    if (email && email !== req.user.email) {
      const taken = await User.findOne({ where: { email } })
      if (taken) {
        return res.status(400).json({ success: false, message: "email already in use" })
      }
    }

    await req.user.update({
      name: name ?? req.user.name,
      email: email ?? req.user.email,
    })

    res.json({
      success: true,
      message: "profile updated",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "both passwords required" })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "password min 6 chars" })
    }

    const user = await User.findByPk(req.user.id)
    const ok = await user.comparePassword(currentPassword)
    if (!ok) {
      return res.status(401).json({ success: false, message: "current password is wrong" })
    }

    await user.update({ password: newPassword })
    res.json({ success: true, message: "password changed" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "isActive", "createdAt"],
      order: [["createdAt", "DESC"]],
    })
    res.json({ success: true, users })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const toggleUserActive = async (req, res) => {
  try {
    const target = await User.findByPk(req.params.id)
    if (!target) return res.status(404).json({ success: false, message: "user not found" })
    if (target.id === req.user.id) {
      return res.status(400).json({ success: false, message: "you cant deactivate yourself" })
    }
    await target.update({ isActive: !target.isActive })
    res.json({
      success: true,
      message: target.isActive ? "user activated" : "user deactivated",
      user: target,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    const target = await User.findByPk(req.params.id)
    if (!target) return res.status(404).json({ success: false, message: "user not found" })
    if (target.id === req.user.id) {
      return res.status(400).json({ success: false, message: "you cant delete yourself" })
    }
    await target.destroy()
    res.json({ success: true, message: "user deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export { login, getMe, register, updateProfile, changePassword, getUsers, toggleUserActive, deleteUser }
