import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();


const sequelize = new Sequelize(
    process.env.DB_NAME || "inventory_management_db",
    process.env.DB_USER || "postgres",
    process.env.DB_PASS ?? process.env.DB_PASSWORD ?? "",
    {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        logging: false
    }
);

export default sequelize;