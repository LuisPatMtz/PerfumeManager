import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/auth.routes";
import { perfumesRouter } from "./routes/perfumes.routes";
import { bottlesRouter } from "./routes/bottles.routes";
import { salesRouter } from "./routes/sales.routes";
import { creditsRouter } from "./routes/credits.routes";
import { customersRouter } from "./routes/customers.routes";
import { suppliesRouter } from "./routes/supplies.routes";
import { movementsRouter } from "./routes/movements.routes";
import { cashRouter } from "./routes/cash.routes";
import { profitabilityRouter } from "./routes/profitability.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { alertsRouter } from "./routes/alerts.routes";
import { snapshotsRouter } from "./routes/snapshots.routes";
import { goalsRouter } from "./routes/goals.routes";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/perfumes", perfumesRouter);
app.use("/api/bottles", bottlesRouter);
app.use("/api/sales", salesRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/supplies", suppliesRouter);
app.use("/api/perfume-movements", movementsRouter);
app.use("/api/cash", cashRouter);
app.use("/api/profitability", profitabilityRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/snapshots", snapshotsRouter);
app.use("/api/goals", goalsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Perfume Manager API running on http://localhost:${PORT}`);
});

export default app;
