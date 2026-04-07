import { Router, type IRouter } from "express";
import {
  GetAnalyticsSummaryResponse,
  GetEnergyHistoryResponse,
  GetEnergyHistoryQueryParams,
} from "@workspace/api-zod";
import { getAnalyticsSummary, getEnergyHistory } from "../lib/mockPowamov";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const summary = getAnalyticsSummary();
  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

router.get("/analytics/energy-history", async (req, res): Promise<void> => {
  const query = GetEnergyHistoryQueryParams.safeParse(req.query);
  const days = query.success ? (query.data.days ?? 30) : 30;
  const history = getEnergyHistory(days);
  res.json(GetEnergyHistoryResponse.parse(history));
});

export default router;
