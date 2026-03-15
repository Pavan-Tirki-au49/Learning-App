import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { pool } from "../config/db";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role?: string };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token) as { id: number };
    
    // Fetch user role
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [payload.id]);
    const role = users.length > 0 ? users[0].role : "student";

    req.user = { id: payload.id, role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient role permissions" });
      return;
    }
    next();
  };
};
