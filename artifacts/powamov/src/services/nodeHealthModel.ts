import type { SimulationNode } from "@/services/deploymentSimulation";

export type NodeHealthBand = "healthy" | "warning" | "critical";

export interface NodeHealthSummary {
  stripHealths: number[];
  nodeHealth: number;
  stripHealthAggregate: number;
  degradedStrips: number;
  maintenanceRisk: number;
  status: NodeHealthBand;
  maintenanceRequired: boolean;
}

interface DegradationInput {
  weightKg: number;
  speedKmh: number;
  compressionWeights?: number[];
}

const DEGRADED_STRIP_THRESHOLD = 60;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function deterministicNoise(seed: string, index: number) {
  const total = Array.from(seed).reduce(
    (sum, char, charIndex) => sum + char.charCodeAt(0) * (charIndex + 1),
    0,
  );
  const raw = Math.sin((total + 1) * (index + 1) * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

export function getNodeHealthBand(nodeHealth: number, degradedStrips: number): NodeHealthBand {
  if (nodeHealth < 50 || degradedStrips >= 4) {
    return "critical";
  }

  if (nodeHealth < 70 || degradedStrips >= 3) {
    return "warning";
  }

  return "healthy";
}

export function summarizeStripHealths(stripHealths: number[]): NodeHealthSummary {
  const nodeHealth = stripHealths.reduce((sum, health) => sum + health, 0) / stripHealths.length;
  const degradedStrips = stripHealths.filter((health) => health < DEGRADED_STRIP_THRESHOLD).length;
  const status = getNodeHealthBand(nodeHealth, degradedStrips);
  const maintenanceRisk = clamp(
    round((100 - nodeHealth) * 1.08 + degradedStrips * 13.5),
    0,
    100,
  );

  return {
    stripHealths,
    nodeHealth: round(nodeHealth),
    stripHealthAggregate: round(nodeHealth),
    degradedStrips,
    maintenanceRisk,
    status,
    maintenanceRequired: status !== "healthy",
  };
}

export function createStripHealthProfile(
  nodeId: string,
  baseHealth: number,
  stripCount = 6,
): number[] {
  const offsets = [11, 6, 2, -4, -10, -16];

  return Array.from({ length: stripCount }, (_, index) => {
    const noise = (deterministicNoise(nodeId, index) - 0.5) * 9;
    return round(clamp(baseHealth + offsets[index % offsets.length] + noise, 18, 100));
  });
}

export function createNodeHealthSummary(node: SimulationNode): NodeHealthSummary {
  return summarizeStripHealths(createStripHealthProfile(node.id, node.healthScore, node.stripCount));
}

export function degradeStripHealths(
  stripHealths: number[],
  { weightKg, speedKmh, compressionWeights }: DegradationInput,
): number[] {
  const normalizedCompression = compressionWeights?.length === stripHealths.length
    ? compressionWeights
    : Array.from({ length: stripHealths.length }, () => 1);

  const weightFactor =
    weightKg <= 2500 ? 0.18 :
    weightKg <= 6000 ? 0.29 :
    0.42;
  const speedFactor =
    speedKmh >= 120 ? 1.22 :
    speedKmh >= 90 ? 1.11 :
    speedKmh >= 70 ? 1 :
    0.92;

  return stripHealths.map((health, index) => {
    const compressionFactor = clamp(normalizedCompression[index] || 0.82, 0.65, 1.3);
    const wear = weightFactor * speedFactor * compressionFactor * (0.96 + index * 0.035);
    return round(clamp(health - wear, 0, 100));
  });
}
