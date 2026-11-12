import dotenv from "dotenv"
dotenv.config()

import db from "./config/db.js"
import User from "./models/user.model.js"

const seedDatabase = async () => {
  try {
    await db.authenticate()
    console.log("Database connected")

    await db.sync({ alter: true })
    console.log("Tables synced")

    // Check if admin user exists
    const existingAdmin = await User.findOne({ where: { email: "aydenfudange@gamil.com" } })

    if (!existingAdmin) {
      const admin = await User.create({
        name: "Admin User",
        email: "aydenfudagne@gmail.com",
        password: "MYlove8%",
        role: "admin",
        isActive: true,
      })
      console.log("✓ Admin user created: aydenfudange@gmail.com / MYlove8%")
    } else {
      console.log("✓ Admin user already exists")
    }

    console.log("\nDatabase seeding complete!")
    process.exit(0)
  } catch (err) {
    console.error("Seeding error:", err.message)
    process.exit(1)
  }
}

seedDatabase()
