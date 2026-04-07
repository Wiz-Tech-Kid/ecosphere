import { Router, type IRouter } from "express";
import {
  GetLiveTelemetryResponse,
  GetTelemetryHistoryResponse,
  GetTelemetryHistoryQueryParams,
} from "@workspace/api-zod";
import { getLiveTelemetry, getTelemetryHistory } from "../lib/mockPowamov";

const router: IRouter = Router();

router.get("/telemetry/live", async (_req, res): Promise<void> => {
  const snapshot = getLiveTelemetry();
  res.json(GetLiveTelemetryResponse.parse(snapshot));
});

router.get("/telemetry/history", async (req, res): Promise<void> => {
  const query = GetTelemetryHistoryQueryParams.safeParse(req.query);
  const hours = query.success ? (query.data.hours ?? 24) : 24;
  const history = getTelemetryHistory(hours);
  res.json(GetTelemetryHistoryResponse.parse(history));
});

export default router;
