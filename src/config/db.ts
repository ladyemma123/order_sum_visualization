import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath, URL } from "node:url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({ path: envPath });

const dbConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "yingdao_gy",
  table: process.env.MYSQL_TABLE || "gy_workorder_summary",
};

const isCloudDatabase = dbConfig.host.includes(".sql.tencentcdb.com") || 
                        dbConfig.host.includes(".rds.aliyuncs.com") ||
                        dbConfig.host.includes(".polardb.polardb") ||
                        dbConfig.host.includes(".mysql.database.azure.com") ||
                        !/^\d+\.\d+\.\d+\.\d+$/.test(dbConfig.host);

export const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 10,
  waitForConnections: true,
  charset: "utf8mb4",
  ...(isCloudDatabase ? {
    ssl: {
      rejectUnauthorized: false,
    },
    connectTimeout: 10000,
    acquireTimeout: 10000,
  } : {}),
});

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`✅ 数据库连接成功 [${dbConfig.host}:${dbConfig.port}/${dbConfig.database}]`);
    return true;
  } catch (error: any) {
    console.error(`❌ 数据库连接失败: ${error.message}`);
    return false;
  }
}

export { dbConfig };
