import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as snapshotsService from "../services/snapshots.service";

export const snapshotsRouter = Router();

snapshotsRouter.use(authenticate);

// GET /api/snapshots
snapshotsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 30), 90);
  const data = await snapshotsService.listSnapshots(limit);
  res.json(data);
});

// POST /api/snapshots
snapshotsRouter.post("/", async (_req: AuthRequest, res: Response) => {
  const data = await snapshotsService.createSnapshot();
  res.status(201).json(data);
});
