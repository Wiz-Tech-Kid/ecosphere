export interface Node {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: "online" | "offline" | "warning" | "maintenance";
  installDate: string;
  degradationPercent: number;
  totalEnergyKwh: number;
  lastMaintenanceDate: string | null;
  vehiclePassesToday: number;
  compressionCycles: number;
}

export interface LiveTelemetrySnapshot {
  timestamp: string;
  totalNodesOnline: number;
  totalNodesOffline: number;
  totalNodesWarning: number;
  currentPowerOutputW: number;
  todayEnergyKwh: number;
  todayVehiclePasses: number;
  avgCompressionForceN: number;
  nodes: Array<{
    nodeId: string;
    powerOutputW: number;
    recentPasses: number;
    compressionForceN: number;
    status: Node["status"];
  }>;
}

export interface TelemetryAggregate {
  timestamp: string;
  avgPowerW: number;
  totalEnergyKwh: number;
  totalPasses: number;
  avgEfficiencyPercent: number;
}

export interface MaintenanceForecast {
  nodeId: string;
  nodeName: string;
  forecastDate: string;
  urgency: "low" | "medium" | "high" | "critical";
  degradationRate: number;
  estimatedLifeRemainingDays: number;
  recommendedAction: string;
  estimatedCost: number;
}

export interface MaintenanceAlert {
  id: string;
  nodeId: string;
  nodeName: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AnalyticsSummary {
  totalEnergyHarvestedKwh: number;
  carbonOffsetKg: number;
  gridDisplacementPercent: number;
  totalVehiclePasses: number;
  avgEfficiencyPercent: number;
  activeNodes: number;
  totalNodes: number;
  revenueUsd: number;
  co2SavedTons: number;
  treesEquivalent: number;
}

export interface EnergyHistoryPoint {
  date: string;
  energyKwh: number;
  vehiclePasses: number;
  carbonOffsetKg: number;
  efficiencyPercent: number;
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

const now = Date.now();

export const demoNodes: Node[] = [
  {
    id: "node-001",
    name: "Main St & 1st Ave",
    location: "Downtown District",
    latitude: 37.7749,
    longitude: -122.4194,
    status: "online",
    installDate: "2024-03-15",
    degradationPercent: 12.4,
    totalEnergyKwh: 8420.5,
    lastMaintenanceDate: "2025-11-20",
    vehiclePassesToday: 3240,
    compressionCycles: 1842000,
  },
  {
    id: "node-002",
    name: "Market St Bridge",
    location: "Financial District",
    latitude: 37.7935,
    longitude: -122.3964,
    status: "online",
    installDate: "2024-04-10",
    degradationPercent: 8.7,
    totalEnergyKwh: 6950.2,
    lastMaintenanceDate: "2025-12-05",
    vehiclePassesToday: 2890,
    compressionCycles: 1520400,
  },
  {
    id: "node-003",
    name: "Industrial Blvd Gate",
    location: "Industrial Zone",
    latitude: 37.751,
    longitude: -122.405,
    status: "warning",
    installDate: "2024-01-22",
    degradationPercent: 31.2,
    totalEnergyKwh: 12180.8,
    lastMaintenanceDate: "2025-09-14",
    vehiclePassesToday: 4100,
    compressionCycles: 2670000,
  },
  {
    id: "node-004",
    name: "Tech Campus Entry",
    location: "South Bay",
    latitude: 37.768,
    longitude: -122.388,
    status: "online",
    installDate: "2024-06-01",
    degradationPercent: 5.1,
    totalEnergyKwh: 4320.7,
    lastMaintenanceDate: "2026-01-10",
    vehiclePassesToday: 1680,
    compressionCycles: 945600,
  },
  {
    id: "node-005",
    name: "Harbor Freight Terminal",
    location: "Port Area",
    latitude: 37.782,
    longitude: -122.374,
    status: "offline",
    installDate: "2023-11-15",
    degradationPercent: 45.8,
    totalEnergyKwh: 18940.3,
    lastMaintenanceDate: "2025-08-02",
    vehiclePassesToday: 0,
    compressionCycles: 4120000,
  },
  {
    id: "node-006",
    name: "University Ave",
    location: "Academic Quarter",
    latitude: 37.76,
    longitude: -122.429,
    status: "online",
    installDate: "2024-08-20",
    degradationPercent: 3.2,
    totalEnergyKwh: 2840.1,
    lastMaintenanceDate: null,
    vehiclePassesToday: 2150,
    compressionCycles: 620000,
  },
  {
    id: "node-007",
    name: "Highway 101 Ramp",
    location: "North Corridor",
    latitude: 37.805,
    longitude: -122.41,
    status: "maintenance",
    installDate: "2024-02-28",
    degradationPercent: 22.6,
    totalEnergyKwh: 9750.4,
    lastMaintenanceDate: "2025-10-30",
    vehiclePassesToday: 0,
    compressionCycles: 2130000,
  },
  {
    id: "node-008",
    name: "Civic Center Plaza",
    location: "Government District",
    latitude: 37.779,
    longitude: -122.418,
    status: "online",
    installDate: "2024-05-14",
    degradationPercent: 9.8,
    totalEnergyKwh: 5680.9,
    lastMaintenanceDate: "2025-12-18",
    vehiclePassesToday: 3050,
    compressionCycles: 1240000,
  },
];

export const demoLiveTelemetry: LiveTelemetrySnapshot = {
  timestamp: new Date(now).toISOString(),
  totalNodesOnline: 5,
  totalNodesOffline: 1,
  totalNodesWarning: 1,
  currentPowerOutputW: 18420.6,
  todayEnergyKwh: 603.9,
  todayVehiclePasses: 17110,
  avgCompressionForceN: 9875.3,
  nodes: demoNodes.map((node) => ({
    nodeId: node.id,
    powerOutputW:
      node.status === "offline"
        ? 0
        : round(1800 + (100 - node.degradationPercent) * 32, 1),
    recentPasses:
      node.status === "offline" || node.status === "maintenance"
        ? 0
        : Math.max(3, Math.round(node.vehiclePassesToday / 180)),
    compressionForceN: round(8600 + node.degradationPercent * 31, 1),
    status: node.status,
  })),
};

export const demoTelemetryHistory: TelemetryAggregate[] = Array.from(
  { length: 24 },
  (_, index) => {
    const hourOffset = 23 - index;
    const wave = Math.sin(index / 3) * 0.5 + 0.5;
    const power = 6200 + wave * 9600 + index * 85;
    const passes = 120 + Math.round(wave * 75) + index * 2;
    return {
      timestamp: new Date(now - hourOffset * 60 * 60 * 1000).toISOString(),
      avgPowerW: round(power, 1),
      totalEnergyKwh: round(power / 1000 / 3.2, 3),
      totalPasses: passes,
      avgEfficiencyPercent: round(86 + wave * 9, 1),
    };
  },
);

export const demoMaintenanceForecasts: MaintenanceForecast[] = [
  {
    nodeId: "node-005",
    nodeName: "Harbor Freight Terminal",
    forecastDate: "2026-04-19",
    urgency: "critical",
    degradationRate: 2.14,
    estimatedLifeRemainingDays: 14,
    recommendedAction:
      "Immediate replacement required - schedule within 72 hours",
    estimatedCost: 4800,
  },
  {
    nodeId: "node-003",
    nodeName: "Industrial Blvd Gate",
    forecastDate: "2026-06-08",
    urgency: "high",
    degradationRate: 1.27,
    estimatedLifeRemainingDays: 64,
    recommendedAction:
      "Schedule maintenance within 2 weeks - piezo element inspection",
    estimatedCost: 2200,
  },
  {
    nodeId: "node-007",
    nodeName: "Highway 101 Ramp",
    forecastDate: "2026-08-21",
    urgency: "medium",
    degradationRate: 0.91,
    estimatedLifeRemainingDays: 138,
    recommendedAction:
      "Preventive maintenance recommended - inspect seals and connectors",
    estimatedCost: 850,
  },
  {
    nodeId: "node-001",
    nodeName: "Main St & 1st Ave",
    forecastDate: "2026-11-14",
    urgency: "low",
    degradationRate: 0.43,
    estimatedLifeRemainingDays: 223,
    recommendedAction:
      "Continue monitoring - next scheduled check in 6 months",
    estimatedCost: 320,
  },
];

export const demoMaintenanceAlerts: MaintenanceAlert[] = [
  {
    id: "alert-001",
    nodeId: "node-005",
    nodeName: "Harbor Freight Terminal",
    alertType: "NODE_OFFLINE",
    severity: "critical",
    message:
      "Node Harbor Freight Terminal is offline - power generation halted.",
    timestamp: new Date(now - 35 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-002",
    nodeId: "node-005",
    nodeName: "Harbor Freight Terminal",
    alertType: "HIGH_DEGRADATION",
    severity: "critical",
    message:
      "Node Harbor Freight Terminal degradation is above replacement threshold.",
    timestamp: new Date(now - 80 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-003",
    nodeId: "node-003",
    nodeName: "Industrial Blvd Gate",
    alertType: "PERFORMANCE_WARNING",
    severity: "warning",
    message:
      "Node Industrial Blvd Gate is generating reduced output below target.",
    timestamp: new Date(now - 125 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-004",
    nodeId: "node-006",
    nodeName: "University Ave",
    alertType: "MAINTENANCE_DUE",
    severity: "info",
    message:
      "Node University Ave has never received maintenance and is due for inspection.",
    timestamp: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
];

export const demoAnalyticsSummary: AnalyticsSummary = {
  totalEnergyHarvestedKwh: 69083.9,
  carbonOffsetKg: 16096.55,
  gridDisplacementPercent: 8.13,
  totalVehiclePasses: 17110,
  avgEfficiencyPercent: 82.8,
  activeNodes: 5,
  totalNodes: 8,
  revenueUsd: 8290.07,
  co2SavedTons: 16.1,
  treesEquivalent: 739,
};

export const demoEnergyHistory: EnergyHistoryPoint[] = Array.from(
  { length: 30 },
  (_, index) => {
    const dayOffset = 29 - index;
    const wave = Math.sin(index / 4) * 0.5 + 0.5;
    const energy = 170 + wave * 105 + (index % 5) * 6;
    return {
      date: new Date(now - dayOffset * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      energyKwh: round(energy, 2),
      vehiclePasses: Math.round(7800 + wave * 2600 + index * 48),
      carbonOffsetKg: round(energy * 0.233, 2),
      efficiencyPercent: round(84 + wave * 10, 1),
    };
  },
);

export function arrayOrFallback<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function objectOrFallback<T extends object>(
  value: unknown,
  fallback: T,
): T {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : fallback;
}
