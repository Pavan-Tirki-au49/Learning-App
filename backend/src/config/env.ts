import { config } from "dotenv";
config();

export const env = {
  PORT: process.env.PORT || 4000,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_NAME: process.env.DB_NAME || "learning_app",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  JWT_SECRET: process.env.JWT_SECRET || "supersecret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "superrefreshsecret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
};
