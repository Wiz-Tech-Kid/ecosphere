import { Router, type IRouter } from "express";
import {
  ListNodesResponse,
  GetNodeResponse,
  CreateNodeBody,
  GetNodeTelemetryQueryParams,
  SimulateDigitalTwinBody,
  SimulateDigitalTwinResponse,
  GetNodeTelemetryResponse,
} from "@workspace/api-zod";
import {
  getNodes,
  getNodeById,
  createNode,
  getNodeTelemetry,
  simulateDigitalTwin,
} from "../lib/mockPowamov";

const router: IRouter = Router();

router.get("/nodes", async (_req, res): Promise<void> => {
  const nodes = getNodes();
  res.json(ListNodesResponse.parse(nodes));
});

router.post("/nodes", async (req, res): Promise<void> => {
  const parsed = CreateNodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const node = createNode(parsed.data);
  res.status(201).json(GetNodeResponse.parse(node));
});

router.get("/nodes/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const node = getNodeById(rawId);
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.json(GetNodeResponse.parse(node));
});

router.get("/nodes/:id/telemetry", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const query = GetNodeTelemetryQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const readings = getNodeTelemetry(rawId, limit);
  res.json(GetNodeTelemetryResponse.parse(readings));
});

router.post("/digital-twin/:nodeId/simulate", async (req, res): Promise<void> => {
  const rawNodeId = Array.isArray(req.params.nodeId) ? req.params.nodeId[0] : req.params.nodeId;
  const parsed = SimulateDigitalTwinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = simulateDigitalTwin(rawNodeId, parsed.data);
  res.json(SimulateDigitalTwinResponse.parse(result));
});

export default router;
