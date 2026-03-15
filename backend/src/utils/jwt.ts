import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateAccessToken = (userId: number): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
