import { useEffect } from "react";
import { create } from "zustand";
import {
  buildDeploymentSimulation,
  type CorridorSimulation,
  type DeploymentHealth,
  type DeploymentSimulation,
  type SimulationNode,
} from "@/services/deploymentSimulation";
import {
  createStripHealthProfile,
  getNodeHealthBand,
  type NodeHealthBand,
} from "@/services/nodeHealthModel";

export interface PowamovStripRuntime {
  id: number;
  health: number;
  efficiency: number;
  usage: number;
  degradation: number;
  compression: number;
  forceKn: number;
  energyWh: number;
}

export interface PowamovNodeRuntime {
  nodeId: string;
  corridorId: string;
  stripStates: PowamovStripRuntime[];
  nodeHealth: number;
  stripHealthAverage: number;
  degradedStrips: number;
  maintenanceRisk: number;
  status: NodeHealthBand;
  liveEnergyWh: number;
  recentPassEnergyWh: number;
  liveVehiclePasses: number;
  liveCompressionEvents: number;
  liveCo2OffsetKg: number;
  lastVehicleType: string | null;
  lastSpeedKmh: number | null;
  lastWeightKg: number | null;
  lastAxleCount: number | null;
  lastUpdatedAt: number | null;
}

export interface PowamovVehicle {
  id: string;
  label: string;
  corridorId: string;
  nodeId: string;
  weightKg: number;
  speedKmh: number;
  axleCount: number;
  color: string;
  stripIndex: number;
  stageStartedAt: number;
  stageDurationMs: number;
}

export interface PowamovCorridorRuntime {
  corridorId: string;
  activeNodeId: string | null;
  activeVehicle: PowamovVehicle | null;
  nextVehicleDueAt: number;
  lastVehicleAt: number | null;
  vehiclesGenerated: number;
}

export interface PowamovHistoryPoint {
  t: string;
  energyKwh: number;
  carbonOffsetKg: number;
  vehiclePasses: number;
  efficiency: number;
}

interface PowamovSimulationState {
  simulation: DeploymentSimulation | null;
  loading: boolean;
  error: string | null;
  loadedToken: string | null;
  engineRunning: boolean;
  selectedCorridorId: string | null;
  selectedNodeId: string | null;
  nodeRuntimeById: Record<string, PowamovNodeRuntime>;
  corridorRuntimeById: Record<string, PowamovCorridorRuntime>;
  history: PowamovHistoryPoint[];
  livePowerKw: number;
  initialize: (mapboxToken?: string) => Promise<void>;
  startEngine: () => void;
  stopEngine: () => void;
  setSelectedCorridor: (corridorId: string) => void;
  selectNode: (nodeId: string) => void;
  resetCorridor: (corridorId?: string) => void;
}

const CO2_OFFSET_KG_PER_KWH = 0.68;
const ENGINE_TICK_MS = 140;
const HISTORY_SAMPLE_MS = 2000;
const MAX_HISTORY_POINTS = 36;
const STRIP_PASS_FACTORS = [1.08, 1.04, 1, 0.97, 0.94, 0.91];

const VEHICLE_TEMPLATES = [
  {
    key: "passenger-car",
    label: "Passenger car",
    baseWeightKg: 1200,
    axleCount: 2,
    color: "#4a90b8",
    urbanWeight: 0.32,
    highwayWeight: 0.28,
  },
  {
    key: "suv",
    label: "SUV",
    baseWeightKg: 1800,
    axleCount: 2,
    color: "#3d8a5e",
    urbanWeight: 0.28,
    highwayWeight: 0.22,
  },
  {
    key: "light-truck",
    label: "Light truck",
    baseWeightKg: 2500,
    axleCount: 2,
    color: "#c07a16",
    urbanWeight: 0.18,
    highwayWeight: 0.18,
  },
  {
    key: "heavy-truck",
    label: "Heavy truck",
    baseWeightKg: 6000,
    axleCount: 3,
    color: "#7c6db5",
    urbanWeight: 0.1,
    highwayWeight: 0.2,
  },
  {
    key: "bus",
    label: "Bus",
    baseWeightKg: 15000,
    axleCount: 4,
    color: "#b84a4a",
    urbanWeight: 0.12,
    highwayWeight: 0.12,
  },
] as const;

let engineTimer: number | null = null;
let initializationPromise: Promise<void> | null = null;
let lastSampleAt = 0;
let lastSampleEnergyWh = 0;
let vehicleCounter = 0;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum);
}

function randomWhole(minimum: number, maximum: number) {
  return Math.round(randomBetween(minimum, maximum));
}

function nextVehicleDelayMs() {
  return randomWhole(1000, 3000);
}

function sampleNowLabel() {
  return new Date().toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function computeStripEfficiency(health: number, usage: number) {
  const usagePenalty = Math.min(usage * 0.08, 10);
  return round(clamp(health - usagePenalty * 0.35, 18, 100));
}

function summarizeRuntimeStrips(stripStates: PowamovStripRuntime[]) {
  const stripHealths = stripStates.map((strip) => strip.health);
  const nodeHealth = stripHealths.reduce((sum, health) => sum + health, 0) / Math.max(stripHealths.length, 1);
  const degradedStrips = stripHealths.filter((health) => health < 60).length;
  const status = getNodeHealthBand(nodeHealth, degradedStrips);
  const maintenanceRisk = clamp(
    round((100 - nodeHealth) * 1.1 + degradedStrips * 13.5),
    0,
    100,
  );

  return {
    nodeHealth: round(nodeHealth),
    stripHealthAverage: round(nodeHealth),
    degradedStrips,
    maintenanceRisk,
    status,
  };
}

function createStripRuntime(healths: number[]): PowamovStripRuntime[] {
  return healths.map((health, index) => ({
    id: index + 1,
    health,
    efficiency: computeStripEfficiency(health, 0),
    usage: 0,
    degradation: round(100 - health),
    compression: 0,
    forceKn: 0,
    energyWh: 0,
  }));
}

function createNodeRuntime(node: SimulationNode): PowamovNodeRuntime {
  const stripStates = createStripRuntime(createStripHealthProfile(node.id, node.healthScore, node.stripCount));
  const summary = summarizeRuntimeStrips(stripStates);

  return {
    nodeId: node.id,
    corridorId: node.corridorId,
    stripStates,
    nodeHealth: summary.nodeHealth,
    stripHealthAverage: summary.stripHealthAverage,
    degradedStrips: summary.degradedStrips,
    maintenanceRisk: summary.maintenanceRisk,
    status: summary.status,
    liveEnergyWh: 0,
    recentPassEnergyWh: 0,
    liveVehiclePasses: 0,
    liveCompressionEvents: 0,
    liveCo2OffsetKg: 0,
    lastVehicleType: null,
    lastSpeedKmh: null,
    lastWeightKg: null,
    lastAxleCount: null,
    lastUpdatedAt: null,
  };
}

function createCorridorRuntime(corridor: CorridorSimulation): PowamovCorridorRuntime {
  return {
    corridorId: corridor.id,
    activeNodeId: corridor.nodes[0]?.id ?? null,
    activeVehicle: null,
    nextVehicleDueAt: Date.now() + nextVehicleDelayMs(),
    lastVehicleAt: null,
    vehiclesGenerated: 0,
  };
}

function buildRuntimeState(simulation: DeploymentSimulation) {
  return {
    nodeRuntimeById: Object.fromEntries(
      simulation.nodes.map((node) => [node.id, createNodeRuntime(node)]),
    ),
    corridorRuntimeById: Object.fromEntries(
      simulation.corridors.map((corridor) => [corridor.id, createCorridorRuntime(corridor)]),
    ),
  };
}

function pickVehicleTemplate(zoneType: SimulationNode["zoneType"]) {
  const key = zoneType === "highway" ? "highwayWeight" : "urbanWeight";
  const totalWeight = VEHICLE_TEMPLATES.reduce((sum, template) => sum + template[key], 0);
  let cursor = Math.random() * totalWeight;

  for (const template of VEHICLE_TEMPLATES) {
    cursor -= template[key];
    if (cursor <= 0) {
      return template;
    }
  }

  return VEHICLE_TEMPLATES[0];
}

function vehicleStageDurationMs(speedKmh: number) {
  return clamp(Math.round(300 - speedKmh * 1.5), 110, 210);
}

function sampleVehicle(node: SimulationNode): PowamovVehicle {
  const template = pickVehicleTemplate(node.zoneType);
  const weightVariance = template.baseWeightKg * (template.key === "bus" ? 0.12 : 0.16);
  const weightKg = clamp(
    randomWhole(template.baseWeightKg - weightVariance, template.baseWeightKg + weightVariance),
    1200,
    15000,
  );
  const speedKmh = clamp(
    randomWhole(node.averageSpeedKmh - 12, node.averageSpeedKmh + 10),
    60,
    120,
  );

  vehicleCounter += 1;

  return {
    id: `veh-${vehicleCounter}`,
    label: template.label,
    corridorId: node.corridorId,
    nodeId: node.id,
    weightKg,
    speedKmh,
    axleCount: template.axleCount,
    color: template.color,
    stripIndex: 0,
    stageStartedAt: Date.now(),
    stageDurationMs: vehicleStageDurationMs(speedKmh),
  };
}

function weightedNodePick(
  corridor: CorridorSimulation,
  selectedCorridorId: string | null,
  selectedNodeId: string | null,
) {
  if (corridor.id === selectedCorridorId && selectedNodeId) {
    const selectedNode = corridor.nodes.find((node) => node.id === selectedNodeId);
    if (selectedNode) {
      return selectedNode;
    }
  }

  const totalWeight = corridor.nodes.reduce((sum, node) => sum + Math.max(node.trafficCount, 1), 0);
  let cursor = Math.random() * totalWeight;

  for (const node of corridor.nodes) {
    cursor -= Math.max(node.trafficCount, 1);
    if (cursor <= 0) {
      return node;
    }
  }

  return corridor.nodes[0] ?? null;
}

function currentStripPassEnergyWh(
  node: SimulationNode,
  strip: PowamovStripRuntime,
  vehicle: PowamovVehicle,
  stripIndex: number,
) {
  const speedFactor = 0.74 + vehicle.speedKmh / 160;
  const axleFactor = 0.9 + vehicle.axleCount * 0.08;
  const healthFactor = 0.55 + (strip.health / 100) * 0.45;
  const zoneFactor = node.zoneType === "highway" ? 1.06 : 0.96;

  return round(
    vehicle.weightKg * 1.22e-5 * speedFactor * axleFactor * healthFactor * zoneFactor * STRIP_PASS_FACTORS[stripIndex],
    5,
  );
}

function currentStripWear(node: SimulationNode, vehicle: PowamovVehicle, stripIndex: number) {
  const weightFactor =
    vehicle.weightKg <= 1800 ? 0.12 :
    vehicle.weightKg <= 3000 ? 0.18 :
    vehicle.weightKg <= 8000 ? 0.28 :
    0.42;
  const speedFactor =
    vehicle.speedKmh >= 105 ? 1.16 :
    vehicle.speedKmh >= 85 ? 1.06 :
    0.96;
  const axleFactor = 0.94 + vehicle.axleCount * 0.07;
  const zoneFactor = node.zoneType === "highway" ? 1.05 : 0.97;

  return round(weightFactor * speedFactor * axleFactor * zoneFactor * STRIP_PASS_FACTORS[stripIndex], 3);
}

function visualForceKn(strip: PowamovStripRuntime, vehicle: PowamovVehicle, progress: number) {
  const compression = Math.sin(progress * Math.PI);
  const axleLoadKn = (vehicle.weightKg * 0.00981) / Math.max(vehicle.axleCount, 1);
  const healthFactor = 0.55 + (strip.health / 100) * 0.45;

  return round(axleLoadKn * healthFactor * (0.8 + compression * 0.25) * compression, 2);
}

function withClearedStripVisuals(runtime: PowamovNodeRuntime) {
  return {
    ...runtime,
    stripStates: runtime.stripStates.map((strip) => ({
      ...strip,
      compression: 0,
      forceKn: 0,
      energyWh: 0,
    })),
  };
}

function setRuntimeStripVisual(
  runtime: PowamovNodeRuntime,
  node: SimulationNode,
  vehicle: PowamovVehicle,
  progress: number,
) {
  const nextRuntime = withClearedStripVisuals(runtime);
  const currentStrip = nextRuntime.stripStates[vehicle.stripIndex];

  if (!currentStrip) {
    return nextRuntime;
  }

  const compression = round(Math.sin(progress * Math.PI), 3);
  currentStrip.compression = compression;
  currentStrip.forceKn = visualForceKn(currentStrip, vehicle, progress);
  currentStrip.energyWh = round(
    currentStripPassEnergyWh(node, currentStrip, vehicle, vehicle.stripIndex) * compression,
    5,
  );

  return nextRuntime;
}

function applyStripCompression(
  runtime: PowamovNodeRuntime,
  node: SimulationNode,
  vehicle: PowamovVehicle,
) {
  const nextRuntime = withClearedStripVisuals(runtime);
  const strip = nextRuntime.stripStates[vehicle.stripIndex];

  if (!strip) {
    return nextRuntime;
  }

  const passEnergyWh = currentStripPassEnergyWh(node, strip, vehicle, vehicle.stripIndex);
  const wear = currentStripWear(node, vehicle, vehicle.stripIndex);
  const nextHealth = round(clamp(strip.health - wear, 0, 100));
  const nextUsage = strip.usage + 1;

  strip.health = nextHealth;
  strip.efficiency = computeStripEfficiency(nextHealth, nextUsage);
  strip.usage = nextUsage;
  strip.degradation = round(100 - nextHealth);
  strip.compression = 0;
  strip.forceKn = 0;
  strip.energyWh = 0;

  const summary = summarizeRuntimeStrips(nextRuntime.stripStates);

  return {
    ...nextRuntime,
    nodeHealth: summary.nodeHealth,
    stripHealthAverage: summary.stripHealthAverage,
    degradedStrips: summary.degradedStrips,
    maintenanceRisk: summary.maintenanceRisk,
    status: summary.status,
    liveEnergyWh: round(nextRuntime.liveEnergyWh + passEnergyWh, 5),
    recentPassEnergyWh: round(nextRuntime.recentPassEnergyWh + passEnergyWh, 5),
    liveCompressionEvents: nextRuntime.liveCompressionEvents + 1,
    liveCo2OffsetKg: round(nextRuntime.liveCo2OffsetKg + (passEnergyWh / 1000) * CO2_OFFSET_KG_PER_KWH, 5),
    lastVehicleType: vehicle.label,
    lastSpeedKmh: vehicle.speedKmh,
    lastWeightKg: vehicle.weightKg,
    lastAxleCount: vehicle.axleCount,
    lastUpdatedAt: Date.now(),
  };
}

export function bandToDeploymentHealth(status: NodeHealthBand): DeploymentHealth {
  return status === "critical" ? "maintenance" : status;
}

export function bandToDeploymentLabel(status: NodeHealthBand) {
  if (status === "critical") {
    return "Maintenance";
  }

  if (status === "warning") {
    return "Warning";
  }

  return "Healthy";
}

export function hydrateNodeWithRuntime(
  node: SimulationNode,
  runtime: PowamovNodeRuntime | undefined,
): SimulationNode {
  if (!runtime) {
    return node;
  }

  const currentOutputWh = runtime.stripStates.reduce((sum, strip) => sum + strip.energyWh, 0);
  const healthStatus = bandToDeploymentHealth(runtime.status);

  return {
    ...node,
    healthScore: runtime.nodeHealth,
    healthStatus,
    healthLabel: bandToDeploymentLabel(runtime.status),
    energyOutputKwh: round(node.energyOutputKwh + runtime.liveEnergyWh / 1000, 3),
    trafficCount: node.trafficCount + runtime.liveVehiclePasses,
    compressionEvents: node.compressionEvents + runtime.liveCompressionEvents,
    co2OffsetKg: round(node.co2OffsetKg + runtime.liveCo2OffsetKg, 3),
    trafficDensity:
      node.trafficCount + runtime.liveVehiclePasses >= 20000
        ? "High"
        : node.trafficCount + runtime.liveVehiclePasses >= 12000
          ? "Medium"
          : "Low",
    averageSpeedKmh: runtime.lastSpeedKmh ?? node.averageSpeedKmh,
    positionKm: node.positionKm,
    widthMeters: node.widthMeters,
    stripCount: node.stripCount,
    latitude: node.latitude,
    longitude: node.longitude,
    coordinates: node.coordinates,
    corridorId: node.corridorId,
    corridorName: node.corridorName,
    zoneType: node.zoneType,
    id: node.id,
    currentOutputWh,
  } as SimulationNode;
}

function totalLiveEnergyWh(nodeRuntimeById: Record<string, PowamovNodeRuntime>) {
  return Object.values(nodeRuntimeById).reduce((sum, runtime) => sum + runtime.liveEnergyWh, 0);
}

function totalLiveVehiclePasses(nodeRuntimeById: Record<string, PowamovNodeRuntime>) {
  return Object.values(nodeRuntimeById).reduce((sum, runtime) => sum + runtime.liveVehiclePasses, 0);
}

function totalLiveCo2Offset(nodeRuntimeById: Record<string, PowamovNodeRuntime>) {
  return Object.values(nodeRuntimeById).reduce((sum, runtime) => sum + runtime.liveCo2OffsetKg, 0);
}

function averageNetworkEfficiency(nodeRuntimeById: Record<string, PowamovNodeRuntime>) {
  const strips = Object.values(nodeRuntimeById).flatMap((runtime) => runtime.stripStates);
  const total = strips.reduce((sum, strip) => sum + strip.efficiency, 0);
  return strips.length ? round(total / strips.length) : 0;
}

function sampleHistory(
  set: (
    partial:
      | Partial<PowamovSimulationState>
      | ((state: PowamovSimulationState) => Partial<PowamovSimulationState>),
  ) => void,
  get: () => PowamovSimulationState,
) {
  const state = get();
  const now = Date.now();
  const liveEnergyWh = totalLiveEnergyWh(state.nodeRuntimeById);
  const elapsedMs = Math.max(now - lastSampleAt, HISTORY_SAMPLE_MS);
  const deltaWh = Math.max(0, liveEnergyWh - lastSampleEnergyWh);
  const livePowerKw = round((deltaWh * 3600) / elapsedMs, 3);

  lastSampleAt = now;
  lastSampleEnergyWh = liveEnergyWh;

  set((current) => ({
    livePowerKw,
    history: [
      ...current.history.slice(-(MAX_HISTORY_POINTS - 1)),
      {
        t: sampleNowLabel(),
        energyKwh: round(liveEnergyWh / 1000, 3),
        carbonOffsetKg: round(totalLiveCo2Offset(current.nodeRuntimeById), 3),
        vehiclePasses: totalLiveVehiclePasses(current.nodeRuntimeById),
        efficiency: averageNetworkEfficiency(current.nodeRuntimeById),
      },
    ],
  }));
}

function startEngineLoop(
  set: (
    partial:
      | Partial<PowamovSimulationState>
      | ((state: PowamovSimulationState) => Partial<PowamovSimulationState>),
  ) => void,
  get: () => PowamovSimulationState,
) {
  if (engineTimer !== null || typeof window === "undefined") {
    return;
  }

  lastSampleAt = Date.now();
  lastSampleEnergyWh = totalLiveEnergyWh(get().nodeRuntimeById);

  engineTimer = window.setInterval(() => {
    const state = get();
    const simulation = state.simulation;

    if (!simulation) {
      return;
    }

    const now = Date.now();
    let nodeRuntimeById = state.nodeRuntimeById;
    let corridorRuntimeById = state.corridorRuntimeById;
    let nodeChanged = false;
    let corridorChanged = false;

    const touchNodeRuntime = (nodeId: string) => {
      const current = nodeRuntimeById[nodeId];
      if (!current) {
        return null;
      }

      if (nodeRuntimeById === state.nodeRuntimeById) {
        nodeRuntimeById = { ...state.nodeRuntimeById };
      }

      if (nodeRuntimeById[nodeId] === current) {
        nodeRuntimeById[nodeId] = {
          ...current,
          stripStates: current.stripStates.map((strip) => ({ ...strip })),
        };
      }

      nodeChanged = true;
      return nodeRuntimeById[nodeId];
    };

    const touchCorridorRuntime = (corridorId: string) => {
      const current = corridorRuntimeById[corridorId];
      if (!current) {
        return null;
      }

      if (corridorRuntimeById === state.corridorRuntimeById) {
        corridorRuntimeById = { ...state.corridorRuntimeById };
      }

      if (corridorRuntimeById[corridorId] === current) {
        corridorRuntimeById[corridorId] = { ...current };
      }

      corridorChanged = true;
      return corridorRuntimeById[corridorId];
    };

    for (const corridor of simulation.corridors) {
      const currentCorridorRuntime = corridorRuntimeById[corridor.id];
      if (!currentCorridorRuntime) {
        continue;
      }

      if (!currentCorridorRuntime.activeVehicle) {
        if (now < currentCorridorRuntime.nextVehicleDueAt) {
          continue;
        }

        const targetNode = weightedNodePick(
          corridor,
          state.selectedCorridorId,
          state.selectedNodeId,
        );

        if (!targetNode) {
          continue;
        }

        const vehicle = sampleVehicle(targetNode);
        const nextCorridorRuntime = touchCorridorRuntime(corridor.id);
        const nextNodeRuntime = touchNodeRuntime(targetNode.id);

        if (!nextCorridorRuntime || !nextNodeRuntime) {
          continue;
        }

        nextCorridorRuntime.activeNodeId = targetNode.id;
        nextCorridorRuntime.activeVehicle = vehicle;
        nextCorridorRuntime.nextVehicleDueAt = Number.POSITIVE_INFINITY;

        nodeRuntimeById[targetNode.id] = setRuntimeStripVisual(nextNodeRuntime, targetNode, vehicle, 0.18);
        continue;
      }

      const activeVehicle = currentCorridorRuntime.activeVehicle;
      const baseNode = corridor.nodes.find((node) => node.id === activeVehicle.nodeId);
      if (!baseNode) {
        const nextCorridorRuntime = touchCorridorRuntime(corridor.id);
        if (nextCorridorRuntime) {
          nextCorridorRuntime.activeVehicle = null;
          nextCorridorRuntime.nextVehicleDueAt = now + nextVehicleDelayMs();
        }
        continue;
      }

      const nextNodeRuntime = touchNodeRuntime(activeVehicle.nodeId);
      const nextCorridorRuntime = touchCorridorRuntime(corridor.id);

      if (!nextNodeRuntime || !nextCorridorRuntime) {
        continue;
      }

      const progress = clamp(
        (now - activeVehicle.stageStartedAt) / Math.max(activeVehicle.stageDurationMs, 1),
        0,
        1,
      );

      nodeRuntimeById[activeVehicle.nodeId] = setRuntimeStripVisual(
        nextNodeRuntime,
        baseNode,
        activeVehicle,
        progress,
      );

      if (progress < 1) {
        continue;
      }

      let updatedRuntime = applyStripCompression(
        nodeRuntimeById[activeVehicle.nodeId],
        baseNode,
        activeVehicle,
      );

      if (activeVehicle.stripIndex >= updatedRuntime.stripStates.length - 1) {
        updatedRuntime = {
          ...withClearedStripVisuals(updatedRuntime),
          liveVehiclePasses: updatedRuntime.liveVehiclePasses + 1,
          lastUpdatedAt: now,
        };

        nodeRuntimeById[activeVehicle.nodeId] = updatedRuntime;
        nextCorridorRuntime.activeVehicle = null;
        nextCorridorRuntime.lastVehicleAt = now;
        nextCorridorRuntime.nextVehicleDueAt = now + nextVehicleDelayMs();
        nextCorridorRuntime.vehiclesGenerated += 1;
      } else {
        const nextVehicle: PowamovVehicle = {
          ...activeVehicle,
          stripIndex: activeVehicle.stripIndex + 1,
          stageStartedAt: now,
          stageDurationMs: vehicleStageDurationMs(activeVehicle.speedKmh),
        };

        nodeRuntimeById[activeVehicle.nodeId] = updatedRuntime;
        nextCorridorRuntime.activeVehicle = nextVehicle;
      }
    }

    if (nodeChanged || corridorChanged) {
      set({
        nodeRuntimeById,
        corridorRuntimeById,
      });
    }

    if (now - lastSampleAt >= HISTORY_SAMPLE_MS) {
      sampleHistory(set, get);
    }
  }, ENGINE_TICK_MS);

  set({ engineRunning: true });
}

function stopEngineLoop(
  set: (
    partial:
      | Partial<PowamovSimulationState>
      | ((state: PowamovSimulationState) => Partial<PowamovSimulationState>),
  ) => void,
) {
  if (engineTimer !== null && typeof window !== "undefined") {
    window.clearInterval(engineTimer);
    engineTimer = null;
  }

  set({ engineRunning: false });
}

export const usePowamovSimulationStore = create<PowamovSimulationState>((set, get) => ({
  simulation: null,
  loading: false,
  error: null,
  loadedToken: null,
  engineRunning: false,
  selectedCorridorId: null,
  selectedNodeId: null,
  nodeRuntimeById: {},
  corridorRuntimeById: {},
  history: [],
  livePowerKw: 0,
  initialize: async (mapboxToken) => {
    const normalizedToken = mapboxToken?.trim() || null;
    const currentState = get();

    if (
      currentState.simulation &&
      currentState.loadedToken === normalizedToken &&
      !currentState.error
    ) {
      startEngineLoop(set, get);
      return;
    }

    if (currentState.loading && initializationPromise) {
      return initializationPromise;
    }

    set({ loading: true, error: null });

    initializationPromise = buildDeploymentSimulation({
      mapboxToken: normalizedToken ?? undefined,
    })
      .then((simulation) => {
        const runtime = buildRuntimeState(simulation);
        const firstCorridorId = simulation.corridors[0]?.id ?? null;
        const firstNodeId = simulation.corridors[0]?.nodes[0]?.id ?? null;

        lastSampleAt = Date.now();
        lastSampleEnergyWh = 0;

        set({
          simulation,
          loading: false,
          error: null,
          loadedToken: normalizedToken,
          selectedCorridorId: firstCorridorId,
          selectedNodeId: firstNodeId,
          nodeRuntimeById: runtime.nodeRuntimeById,
          corridorRuntimeById: runtime.corridorRuntimeById,
          history: [],
          livePowerKw: 0,
        });

        startEngineLoop(set, get);
      })
      .catch((caughtError: unknown) => {
        set({
          loading: false,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to initialize the POWAMOV node-strip simulation.",
        });
      })
      .finally(() => {
        initializationPromise = null;
      });

    return initializationPromise;
  },
  startEngine: () => {
    startEngineLoop(set, get);
  },
  stopEngine: () => {
    stopEngineLoop(set);
  },
  setSelectedCorridor: (corridorId) => {
    set((state) => {
      const corridor = state.simulation?.corridors.find((entry) => entry.id === corridorId);
      if (!corridor) {
        return {};
      }

      const selectedNodeInCorridor = state.selectedNodeId
        ? corridor.nodes.find((node) => node.id === state.selectedNodeId)
        : null;
      const fallbackNodeId =
        selectedNodeInCorridor?.id ??
        state.corridorRuntimeById[corridorId]?.activeNodeId ??
        corridor.nodes[0]?.id ??
        null;

      return {
        selectedCorridorId: corridorId,
        selectedNodeId: fallbackNodeId,
      };
    });
  },
  selectNode: (nodeId) => {
    set((state) => {
      const targetNode = state.simulation?.nodes.find((node) => node.id === nodeId);
      if (!targetNode) {
        return {};
      }

      return {
        selectedNodeId: nodeId,
        selectedCorridorId: targetNode.corridorId,
      };
    });
  },
  resetCorridor: (corridorId) => {
    set((state) => {
      if (!state.simulation) {
        return {};
      }

      const targetCorridorId = corridorId ?? state.selectedCorridorId;
      if (!targetCorridorId) {
        return {};
      }

      const corridor = state.simulation.corridors.find((entry) => entry.id === targetCorridorId);
      if (!corridor) {
        return {};
      }

      const nextNodeRuntimeById = { ...state.nodeRuntimeById };
      for (const node of corridor.nodes) {
        nextNodeRuntimeById[node.id] = createNodeRuntime(node);
      }

      return {
        nodeRuntimeById: nextNodeRuntimeById,
        corridorRuntimeById: {
          ...state.corridorRuntimeById,
          [targetCorridorId]: createCorridorRuntime(corridor),
        },
      };
    });
  },
}));

export function usePowamovSimulationBootstrap(mapboxToken?: string) {
  const initialize = usePowamovSimulationStore((state) => state.initialize);

  useEffect(() => {
    void initialize(mapboxToken);
  }, [initialize, mapboxToken]);
}
