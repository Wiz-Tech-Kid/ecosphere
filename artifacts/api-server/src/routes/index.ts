import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nodesRouter from "./nodes";
import telemetryRouter from "./telemetry";
import maintenanceRouter from "./maintenance";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nodesRouter);
router.use(telemetryRouter);
router.use(maintenanceRouter);
router.use(analyticsRouter);

export default router;
