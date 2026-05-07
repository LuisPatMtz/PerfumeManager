import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.post("/logout", (_req, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Sesión cerrada" });
});
