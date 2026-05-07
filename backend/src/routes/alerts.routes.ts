import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as alertsService from "../services/alerts.service";

export const alertsRouter = Router();

alertsRouter.use(authenticate);

// GET /api/alerts
alertsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const onlyUnread = req.query.unread === "true";
  const data = await alertsService.listAlerts(onlyUnread);
  res.json(data);
});

// GET /api/alerts/unread-count
alertsRouter.get("/unread-count", async (_req: AuthRequest, res: Response) => {
  const count = await alertsService.countUnread();
  res.json({ count });
});

// POST /api/alerts/generate
alertsRouter.post("/generate", async (_req: AuthRequest, res: Response) => {
  const result = await alertsService.generateAlerts();
  res.json(result);
});

// PATCH /api/alerts/read-all
alertsRouter.patch("/read-all", async (_req: AuthRequest, res: Response) => {
  await alertsService.markAllRead();
  res.json({ ok: true });
});

// PATCH /api/alerts/:id/read
alertsRouter.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  const data = await alertsService.markRead(req.params.id);
  res.json(data);
});
