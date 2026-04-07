function uuidv4(): string {
  return crypto.randomUUID();
}

export interface MockNode {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: "online" | "offline" | "maintenance" | "warning";
  installDate: string;
  degradationPercent: number;
  totalEnergyKwh: number;
  lastMaintenanceDate: string | null;
  vehiclePassesToday: number;
  compressionCycles: number;
}

export interface TelemetryReading {
  id: string;
  nodeId: string;
  timestamp: string;
  compressionForceN: number;
  energyGeneratedWh: number;
  vehicleSpeed: number;
  vehicleWeight: number;
  temperature: number;
  vibration: number;
}

const nodes: MockNode[] = [
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
    latitude: 37.7510,
    longitude: -122.4050,
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
    latitude: 37.7680,
    longitude: -122.3880,
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
    latitude: 37.7820,
    longitude: -122.3740,
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
    latitude: 37.7600,
    longitude: -122.4290,
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
    latitude: 37.8050,
    longitude: -122.4100,
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
    latitude: 37.7790,
    longitude: -122.4180,
    status: "online",
    installDate: "2024-05-14",
    degradationPercent: 9.8,
    totalEnergyKwh: 5680.9,
    lastMaintenanceDate: "2025-12-18",
    vehiclePassesToday: 3050,
    compressionCycles: 1240000,
  },
];

const telemetryHistory: Map<string, TelemetryReading[]> = new Map();

function generateTelemetryReading(node: MockNode): TelemetryReading {
  const baseForce = 8500 + Math.random() * 3000;
  const vehicleWeight = 1200 + Math.random() * 15000;
  const vehicleSpeed = 15 + Math.random() * 60;
  const efficiency = 1 - node.degradationPercent / 100;
  const energyWh = (baseForce * 0.05 * efficiency) + Math.random() * 20;

  return {
    id: uuidv4(),
    nodeId: node.id,
    timestamp: new Date().toISOString(),
    compressionForceN: Math.round(baseForce * 10) / 10,
    energyGeneratedWh: Math.round(energyWh * 100) / 100,
    vehicleSpeed: Math.round(vehicleSpeed * 10) / 10,
    vehicleWeight: Math.round(vehicleWeight),
    temperature: 18 + Math.random() * 25,
    vibration: 0.1 + Math.random() * 2.5,
  };
}

function seedHistoricalTelemetry(): void {
  for (const node of nodes) {
    const readings: TelemetryReading[] = [];
    const now = Date.now();
    const hoursBack = 48;

    for (let h = hoursBack; h >= 0; h--) {
      const passesInHour = node.status === "online" || node.status === "warning"
        ? Math.floor(80 + Math.random() * 200)
        : 0;

      for (let p = 0; p < Math.min(passesInHour, 20); p++) {
        const timestamp = new Date(now - h * 3600000 - Math.random() * 3600000);
        const reading = generateTelemetryReading(node);
        reading.timestamp = timestamp.toISOString();
        readings.push(reading);
      }
    }

    telemetryHistory.set(node.id, readings);
  }
}

seedHistoricalTelemetry();

setInterval(() => {
  for (const node of nodes) {
    if (node.status === "online" || node.status === "warning") {
      const reading = generateTelemetryReading(node);
      const existing = telemetryHistory.get(node.id) ?? [];
      existing.push(reading);
      if (existing.length > 500) existing.splice(0, existing.length - 500);
      telemetryHistory.set(node.id, existing);

      node.vehiclePassesToday += Math.random() < 0.4 ? 1 : 0;
      node.totalEnergyKwh += reading.energyGeneratedWh / 1000;
      node.compressionCycles += 1;
    }
  }
}, 3000);

export function getNodes(): MockNode[] {
  return nodes.map(n => ({ ...n }));
}

export function getNodeById(id: string): MockNode | undefined {
  return nodes.find(n => n.id === id);
}

export function createNode(data: {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}): MockNode {
  const node: MockNode = {
    id: `node-${String(nodes.length + 1).padStart(3, "0")}`,
    name: data.name,
    location: data.location,
    latitude: data.latitude,
    longitude: data.longitude,
    status: "online",
    installDate: new Date().toISOString().split("T")[0],
    degradationPercent: 0,
    totalEnergyKwh: 0,
    lastMaintenanceDate: null,
    vehiclePassesToday: 0,
    compressionCycles: 0,
  };
  nodes.push(node);
  telemetryHistory.set(node.id, []);
  return node;
}

export function getNodeTelemetry(nodeId: string, limit: number = 50): TelemetryReading[] {
  const readings = telemetryHistory.get(nodeId) ?? [];
  return readings.slice(-limit);
}

export function getLiveTelemetry() {
  const onlineNodes = nodes.filter(n => n.status === "online" || n.status === "warning");
  const totalNodesOnline = nodes.filter(n => n.status === "online").length;
  const totalNodesOffline = nodes.filter(n => n.status === "offline").length;
  const totalNodesWarning = nodes.filter(n => n.status === "warning").length;

  const nodeLiveStatuses = nodes.map(node => {
    const recentReadings = (telemetryHistory.get(node.id) ?? []).slice(-5);
    const avgForce = recentReadings.length > 0
      ? recentReadings.reduce((s, r) => s + r.compressionForceN, 0) / recentReadings.length
      : 0;
    const powerW = recentReadings.length > 0
      ? (recentReadings.reduce((s, r) => s + r.energyGeneratedWh, 0) / recentReadings.length) * 12
      : 0;

    return {
      nodeId: node.id,
      powerOutputW: Math.round(powerW * 10) / 10,
      recentPasses: recentReadings.length,
      compressionForceN: Math.round(avgForce * 10) / 10,
      status: node.status,
    };
  });

  const totalPower = nodeLiveStatuses.reduce((s, n) => s + n.powerOutputW, 0);
  const avgForce = nodeLiveStatuses.reduce((s, n) => s + n.compressionForceN, 0) / nodeLiveStatuses.length;

  return {
    timestamp: new Date().toISOString(),
    totalNodesOnline,
    totalNodesOffline,
    totalNodesWarning,
    currentPowerOutputW: Math.round(totalPower * 10) / 10,
    todayEnergyKwh: Math.round(onlineNodes.reduce((s, n) => s + n.totalEnergyKwh * 0.01, 0) * 100) / 100,
    todayVehiclePasses: nodes.reduce((s, n) => s + n.vehiclePassesToday, 0),
    avgCompressionForceN: Math.round(avgForce * 10) / 10,
    nodes: nodeLiveStatuses,
  };
}

export function getTelemetryHistory(hours: number = 24) {
  const now = Date.now();
  const buckets: Map<number, { power: number[]; energy: number; passes: number; efficiency: number[] }> = new Map();

  for (let h = hours - 1; h >= 0; h--) {
    buckets.set(h, { power: [], energy: 0, passes: 0, efficiency: [] });
  }

  for (const [, readings] of telemetryHistory) {
    for (const reading of readings) {
      const age = (now - new Date(reading.timestamp).getTime()) / 3600000;
      const bucket = Math.floor(age);
      if (bucket >= 0 && bucket < hours) {
        const b = buckets.get(bucket)!;
        b.power.push(reading.energyGeneratedWh * 12);
        b.energy += reading.energyGeneratedWh / 1000;
        b.passes += 1;
        b.efficiency.push(Math.max(0, 100 - (Math.random() * 10)));
      }
    }
  }

  const result = [];
  for (let h = hours - 1; h >= 0; h--) {
    const ts = new Date(now - h * 3600000).toISOString();
    const b = buckets.get(h)!;
    result.push({
      timestamp: ts,
      avgPowerW: b.power.length > 0 ? b.power.reduce((s, v) => s + v, 0) / b.power.length : 0,
      totalEnergyKwh: Math.round(b.energy * 1000) / 1000,
      totalPasses: b.passes,
      avgEfficiencyPercent: b.efficiency.length > 0
        ? b.efficiency.reduce((s, v) => s + v, 0) / b.efficiency.length
        : 0,
    });
  }
  return result;
}

export function getMaintenanceForecasts() {
  return nodes.map(node => {
    const degradationRate = node.degradationPercent / (
      (Date.now() - new Date(node.installDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const remainingCapacity = 80 - node.degradationPercent;
    const estimatedLifeRemainingDays = Math.max(0, Math.round(remainingCapacity / degradationRate));

    let urgency: "low" | "medium" | "high" | "critical";
    let recommendedAction: string;

    if (node.degradationPercent > 40 || estimatedLifeRemainingDays < 30) {
      urgency = "critical";
      recommendedAction = "Immediate replacement required — schedule within 72 hours";
    } else if (node.degradationPercent > 25 || estimatedLifeRemainingDays < 90) {
      urgency = "high";
      recommendedAction = "Schedule maintenance within 2 weeks — piezo element inspection";
    } else if (node.degradationPercent > 15 || estimatedLifeRemainingDays < 180) {
      urgency = "medium";
      recommendedAction = "Preventive maintenance recommended — inspect seals and connectors";
    } else {
      urgency = "low";
      recommendedAction = "Continue monitoring — next scheduled check in 6 months";
    }

    const forecastDate = new Date(Date.now() + estimatedLifeRemainingDays * 86400000).toISOString().split("T")[0];
    const estimatedCost = urgency === "critical" ? 4800 : urgency === "high" ? 2200 : urgency === "medium" ? 850 : 320;

    return {
      nodeId: node.id,
      nodeName: node.name,
      forecastDate,
      urgency,
      degradationRate: Math.round(degradationRate * 100) / 100,
      estimatedLifeRemainingDays,
      recommendedAction,
      estimatedCost,
    };
  }).sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

export function getMaintenanceAlerts() {
  const alerts = [];
  for (const node of nodes) {
    if (node.status === "offline") {
      alerts.push({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.name,
        alertType: "NODE_OFFLINE",
        severity: "critical" as const,
        message: `Node ${node.name} is offline — power generation halted. Investigate connection issues.`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        acknowledged: false,
      });
    }
    if (node.degradationPercent > 35) {
      alerts.push({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.name,
        alertType: "HIGH_DEGRADATION",
        severity: "critical" as const,
        message: `Node ${node.name} degradation at ${node.degradationPercent.toFixed(1)}% — approaching replacement threshold.`,
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        acknowledged: false,
      });
    } else if (node.degradationPercent > 20) {
      alerts.push({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.name,
        alertType: "DEGRADATION_WARNING",
        severity: "warning" as const,
        message: `Node ${node.name} showing elevated degradation at ${node.degradationPercent.toFixed(1)}%. Monitor closely.`,
        timestamp: new Date(Date.now() - Math.random() * 14400000).toISOString(),
        acknowledged: false,
      });
    }
    if (node.status === "warning") {
      alerts.push({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.name,
        alertType: "PERFORMANCE_WARNING",
        severity: "warning" as const,
        message: `Node ${node.name} generating reduced output — efficiency below optimal threshold.`,
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        acknowledged: false,
      });
    }
    if (node.lastMaintenanceDate === null && node.compressionCycles > 500000) {
      alerts.push({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.name,
        alertType: "MAINTENANCE_DUE",
        severity: "info" as const,
        message: `Node ${node.name} has never received maintenance and has ${node.compressionCycles.toLocaleString()} cycles.`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        acknowledged: true,
      });
    }
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getAnalyticsSummary() {
  const totalEnergyKwh = nodes.reduce((s, n) => s + n.totalEnergyKwh, 0);
  const carbonOffsetKg = totalEnergyKwh * 0.233;
  const activeNodes = nodes.filter(n => n.status === "online").length;
  const totalPasses = nodes.reduce((s, n) => s + n.vehiclePassesToday * 365, 0);
  const avgDegradation = nodes.reduce((s, n) => s + n.degradationPercent, 0) / nodes.length;

  return {
    totalEnergyHarvestedKwh: Math.round(totalEnergyKwh * 100) / 100,
    carbonOffsetKg: Math.round(carbonOffsetKg * 100) / 100,
    gridDisplacementPercent: Math.round((totalEnergyKwh / 850000) * 10000) / 100,
    totalVehiclePasses: nodes.reduce((s, n) => s + n.vehiclePassesToday, 0),
    avgEfficiencyPercent: Math.round((100 - avgDegradation) * 10) / 10,
    activeNodes,
    totalNodes: nodes.length,
    revenueUsd: Math.round(totalEnergyKwh * 0.12 * 100) / 100,
    co2SavedTons: Math.round(carbonOffsetKg / 1000 * 100) / 100,
    treesEquivalent: Math.round(carbonOffsetKg / 21.77),
  };
}

export function getEnergyHistory(days: number = 30) {
  const result = [];
  const now = Date.now();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now - d * 86400000).toISOString().split("T")[0];
    const baseEnergy = 180 + Math.random() * 120;
    const weekday = new Date(now - d * 86400000).getDay();
    const multiplier = weekday === 0 || weekday === 6 ? 0.6 : 1.0;

    result.push({
      date,
      energyKwh: Math.round(baseEnergy * multiplier * 100) / 100,
      vehiclePasses: Math.round((8000 + Math.random() * 4000) * multiplier),
      carbonOffsetKg: Math.round(baseEnergy * multiplier * 0.233 * 100) / 100,
      efficiencyPercent: Math.round((85 + Math.random() * 10) * 10) / 10,
    });
  }
  return result;
}

export function simulateDigitalTwin(nodeId: string, params: {
  vehicleWeightKg: number;
  vehicleSpeedKmh: number;
  vehiclesPerHour: number;
  simulationHours: number;
}) {
  const node = nodes.find(n => n.id === nodeId);
  const efficiency = node ? (1 - node.degradationPercent / 100) : 0.9;

  const dataPoints = [];
  let totalEnergy = 0;
  let peakPower = 0;

  for (let h = 0; h < params.simulationHours; h++) {
    const passesThisHour = params.vehiclesPerHour + Math.floor((Math.random() - 0.5) * params.vehiclesPerHour * 0.3);
    const forcePerVehicle = params.vehicleWeightKg * 9.81 * (params.vehicleSpeedKmh / 30);
    const avgForce = forcePerVehicle * (0.85 + Math.random() * 0.3);
    const energyPerPass = (avgForce * 0.05 * efficiency) / 1000;
    const hourEnergy = energyPerPass * passesThisHour;
    const power = hourEnergy * 1000;

    totalEnergy += hourEnergy;
    peakPower = Math.max(peakPower, power);

    dataPoints.push({
      hour: h + 1,
      energyKwh: Math.round(hourEnergy * 1000) / 1000,
      powerW: Math.round(power * 10) / 10,
      passes: passesThisHour,
      compressionForceN: Math.round(avgForce * 10) / 10,
    });
  }

  const totalPasses = dataPoints.reduce((s, d) => s + d.passes, 0);
  const avgForce = dataPoints.reduce((s, d) => s + d.compressionForceN, 0) / dataPoints.length;
  const degradationAdded = (totalPasses / 1000000) * 0.5;

  return {
    nodeId,
    totalEnergyKwh: Math.round(totalEnergy * 1000) / 1000,
    peakPowerW: Math.round(peakPower * 10) / 10,
    avgCompressionForceN: Math.round(avgForce * 10) / 10,
    totalPasses,
    efficiencyPercent: Math.round(efficiency * 100 * 10) / 10,
    degradationAdded: Math.round(degradationAdded * 10000) / 10000,
    dataPoints,
  };
}
