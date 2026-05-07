import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export interface AuthRequest extends Request {
  userId?: string;
  params: Record<string, string>;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
