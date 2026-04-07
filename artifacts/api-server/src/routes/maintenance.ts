import { Router, type IRouter } from "express";
import {
  GetMaintenanceForecastsResponse,
  GetMaintenanceAlertsResponse,
} from "@workspace/api-zod";
import { getMaintenanceForecasts, getMaintenanceAlerts } from "../lib/mockPowamov";

const router: IRouter = Router();

router.get("/maintenance/forecasts", async (_req, res): Promise<void> => {
  const forecasts = getMaintenanceForecasts();
  res.json(GetMaintenanceForecastsResponse.parse(forecasts));
});

router.get("/maintenance/alerts", async (_req, res): Promise<void> => {
  const alerts = getMaintenanceAlerts();
  res.json(GetMaintenanceAlertsResponse.parse(alerts));
});

export default router;
