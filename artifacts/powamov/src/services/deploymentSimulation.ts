import type { LngLatTuple } from "@/lib/mapbox-loader";

export type DeploymentHealth = "healthy" | "warning" | "maintenance";
export type DeploymentZone = "highway" | "urban";
export type GeometrySource = "mapbox-directions" | "fallback";

export interface BoundaryAnchor {
  label: string;
  coordinates: LngLatTuple;
}

export interface CorridorWaypoint {
  label: string;
  coordinates: LngLatTuple;
}

export interface SimulationNode {
  id: string;
  corridorId: string;
  corridorName: string;
  coordinates: LngLatTuple;
  latitude: number;
  longitude: number;
  stripCount: number;
  widthMeters: number;
  healthStatus: DeploymentHealth;
  healthLabel: string;
  healthScore: number;
  energyOutputKwh: number;
  trafficCount: number;
  trafficDensity: "Low" | "Medium" | "High";
  compressionEvents: number;
  co2OffsetKg: number;
  averageSpeedKmh: number;
  zoneType: DeploymentZone;
  positionKm: number;
}

export interface CorridorSimulation {
  id: string;
  name: string;
  shortLabel: string;
  origin: string;
  destination: string;
  color: string;
  geometrySource: GeometrySource;
  waypoints: CorridorWaypoint[];
  path: LngLatTuple[];
  nodeCount: number;
  distanceKm: number;
  avgTrafficCount: number;
  avgEnergyKwh: number;
  healthyCount: number;
  warningCount: number;
  maintenanceCount: number;
  nodes: SimulationNode[];
}

export interface DeploymentSimulation {
  phaseLabel: string;
  bounds: [LngLatTuple, LngLatTuple];
  center: LngLatTuple;
  boundaryAnchors: BoundaryAnchor[];
  spacingMeters: number;
  stripCount: number;
  nodeWidthMeters: number;
  hasMapboxToken: boolean;
  usedDirections: boolean;
  corridors: CorridorSimulation[];
  nodes: SimulationNode[];
  totals: {
    nodeCount: number;
    corridorCount: number;
    networkDistanceKm: number;
    dailyTrafficCount: number;
    dailyEnergyKwh: number;
    dailyCo2OffsetKg: number;
    compressionEvents: number;
    healthyCount: number;
    warningCount: number;
    maintenanceCount: number;
  };
}

interface CorridorDefinition {
  id: string;
  name: string;
  shortLabel: string;
  nodeCode: string;
  origin: string;
  destination: string;
  color: string;
  heavyVehicleShare: number;
  baseTrafficCount: number;
  stressIndex: number;
  urbanEntryRatio: number;
  highwaySpeedRange: [number, number];
  urbanSpeedRange: [number, number];
  waypoints: CorridorWaypoint[];
}

const STRIP_COUNT = 6;
const NODE_WIDTH_METERS = 2;
const NODE_SPACING_METERS = 350;
const CO2_DISPLACEMENT_KG_PER_KWH = 0.68;

const PHASE_LABEL = "POWAMOV Operational Region — Phase 1";

const MOLEPOLOLE_BOUNDARY: LngLatTuple = [25.4950, -24.4067];
const RASESA_BOUNDARY: LngLatTuple = [26.0725, -24.3742];
const TLOKWENG_BORDER_BOUNDARY: LngLatTuple = [25.9667, -24.6667];
const OTSE_BOUNDARY: LngLatTuple = [25.7386, -25.0333];
const GABANE_BOUNDARY: LngLatTuple = [25.75, -24.6667];

const BOUNDARY_ANCHORS: BoundaryAnchor[] = [
  { label: "Molepolole", coordinates: MOLEPOLOLE_BOUNDARY },
  { label: "Rasesa", coordinates: RASESA_BOUNDARY },
  { label: "Tlokweng Border", coordinates: TLOKWENG_BORDER_BOUNDARY },
  { label: "Otse", coordinates: OTSE_BOUNDARY },
  { label: "Gabane", coordinates: GABANE_BOUNDARY },
];

const OPERATIONAL_BOUNDS: [LngLatTuple, LngLatTuple] = [
  [MOLEPOLOLE_BOUNDARY[0], OTSE_BOUNDARY[1]],
  [RASESA_BOUNDARY[0], RASESA_BOUNDARY[1]],
];

const GABORONE_CORE: LngLatTuple = [25.90859, -24.65451];

const CORRIDORS: CorridorDefinition[] = [
  {
    id: "north-corridor",
    name: "A1 North - Rasesa",
    shortLabel: "A1 North",
    nodeCode: "RASESA",
    origin: "Rasesa",
    destination: "Gaborone",
    color: "#22c55e",
    heavyVehicleShare: 0.24,
    baseTrafficCount: 24800,
    stressIndex: 0.74,
    urbanEntryRatio: 0.68,
    highwaySpeedRange: [92, 138],
    urbanSpeedRange: [62, 96],
    waypoints: [
      { label: "Rasesa", coordinates: RASESA_BOUNDARY },
      { label: "Sebele", coordinates: [25.9305, -24.5584] },
      { label: "Block 3", coordinates: [25.91194, -24.62361] },
      { label: "Block 7", coordinates: [25.90194, -24.61472] },
      { label: "Block 6", coordinates: [25.88556, -24.63222] },
      { label: "GWest", coordinates: [25.8986, -24.6512] },
      { label: "Block 5", coordinates: [25.8725, -24.6475] },
      { label: "Kgale", coordinates: [25.88302, -24.68565] },
      { label: "Game City", coordinates: [25.88066, -24.6871] },
      { label: "Phase 4", coordinates: [25.88528, -24.67993] },
    ],
  },
  {
    id: "south-corridor",
    name: "A1 South - Ramotswa",
    shortLabel: "A1 South",
    nodeCode: "RAMOTSWA",
    origin: "Ramotswa",
    destination: "Gaborone",
    color: "#38bdf8",
    heavyVehicleShare: 0.18,
    baseTrafficCount: 20500,
    stressIndex: 0.62,
    urbanEntryRatio: 0.7,
    highwaySpeedRange: [84, 126],
    urbanSpeedRange: [60, 92],
    waypoints: [
      { label: "Ramotswa", coordinates: [25.86989, -24.87158] },
      { label: "Tlokweng turnoff", coordinates: [25.9074, -24.7382] },
      { label: "Gaborone Core", coordinates: GABORONE_CORE },
    ],
  },
  {
    id: "east-corridor",
    name: "Tlokweng Corridor",
    shortLabel: "Tlokweng",
    nodeCode: "TLOKWENG",
    origin: "Tlokweng Border",
    destination: "Gaborone",
    color: "#f59e0b",
    heavyVehicleShare: 0.13,
    baseTrafficCount: 17100,
    stressIndex: 0.58,
    urbanEntryRatio: 0.52,
    highwaySpeedRange: [78, 116],
    urbanSpeedRange: [60, 88],
    waypoints: [
      { label: "Tlokweng Border", coordinates: TLOKWENG_BORDER_BOUNDARY },
      { label: "Tlokweng", coordinates: [25.97111, -24.66861] },
      { label: "Riverwalk approach", coordinates: [25.9347, -24.6618] },
      { label: "Gaborone Core", coordinates: GABORONE_CORE },
    ],
  },
  {
    id: "west-corridor",
    name: "Molepolole Corridor",
    shortLabel: "Molepolole",
    nodeCode: "MOLEPOLOLE",
    origin: "Molepolole",
    destination: "Gaborone",
    color: "#8b5cf6",
    heavyVehicleShare: 0.22,
    baseTrafficCount: 23200,
    stressIndex: 0.68,
    urbanEntryRatio: 0.76,
    highwaySpeedRange: [88, 132],
    urbanSpeedRange: [62, 94],
    waypoints: [
      { label: "Molepolole", coordinates: MOLEPOLOLE_BOUNDARY },
      { label: "Mogoditshane", coordinates: [25.86556, -24.62694] },
      { label: "Block 5", coordinates: [25.8725, -24.6475] },
      { label: "GWest", coordinates: [25.8986, -24.6512] },
    ],
  },
  {
    id: "south-west-corridor",
    name: "Gabane Corridor",
    shortLabel: "Gabane",
    nodeCode: "GABANE",
    origin: "Gabane",
    destination: "Gaborone",
    color: "#ef4444",
    heavyVehicleShare: 0.16,
    baseTrafficCount: 15400,
    stressIndex: 0.49,
    urbanEntryRatio: 0.56,
    highwaySpeedRange: [74, 112],
    urbanSpeedRange: [60, 86],
    waypoints: [
      { label: "Gabane", coordinates: GABANE_BOUNDARY },
      { label: "Kgale", coordinates: [25.88302, -24.68565] },
      { label: "Phase 4", coordinates: [25.88528, -24.67993] },
      { label: "Gaborone Core", coordinates: GABORONE_CORE },
    ],
  },
];

interface DirectionsApiResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: number[][];
    };
  }>;
}

interface BuildSimulationOptions {
  mapboxToken?: string;
  signal?: AbortSignal;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 0) {
  return Number(value.toFixed(digits));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(from: LngLatTuple, to: LngLatTuple) {
  const earthRadius = 6_371_000;
  const deltaLat = toRadians(to[1] - from[1]);
  const deltaLng = toRadians(to[0] - from[0]);
  const fromLat = toRadians(from[1]);
  const toLat = toRadians(to[1]);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function interpolatePoint(from: LngLatTuple, to: LngLatTuple, ratio: number): LngLatTuple {
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
  ];
}

function polylineLengthMeters(path: LngLatTuple[]) {
  let total = 0;

  for (let index = 1; index < path.length; index += 1) {
    total += haversineMeters(path[index - 1], path[index]);
  }

  return total;
}

function pointWithinBounds(point: LngLatTuple, bounds: [LngLatTuple, LngLatTuple]) {
  const [southWest, northEast] = bounds;
  return (
    point[0] >= southWest[0] &&
    point[0] <= northEast[0] &&
    point[1] >= southWest[1] &&
    point[1] <= northEast[1]
  );
}

function deterministicNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function classifyDensity(trafficCount: number): "Low" | "Medium" | "High" {
  if (trafficCount >= 20_000) {
    return "High";
  }

  if (trafficCount >= 12_000) {
    return "Medium";
  }

  return "Low";
}

function classifyHealth(healthScore: number): DeploymentHealth {
  if (healthScore < 72) {
    return "maintenance";
  }

  if (healthScore < 84) {
    return "warning";
  }

  return "healthy";
}

function healthLabel(status: DeploymentHealth) {
  if (status === "maintenance") {
    return "Maintenance";
  }

  if (status === "warning") {
    return "Warning";
  }

  return "Healthy";
}

function pickSpeed(range: [number, number], seed: number) {
  const noise = deterministicNoise(seed);
  return round(range[0] + (range[1] - range[0]) * noise, 0);
}

function interpolateAlongPolyline(
  path: LngLatTuple[],
  spacingMeters: number,
  startOffsetMeters = spacingMeters / 2,
) {
  const totalLength = polylineLengthMeters(path);

  if (totalLength <= 0 || path.length < 2) {
    return [];
  }

  const points: Array<{ coordinates: LngLatTuple; distanceMeters: number }> = [];
  let targetDistance = Math.min(startOffsetMeters, totalLength / 2);
  let traversed = 0;

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const segmentLength = haversineMeters(previous, current);

    while (targetDistance <= traversed + segmentLength) {
      const segmentRatio = segmentLength === 0 ? 0 : (targetDistance - traversed) / segmentLength;
      points.push({
        coordinates: interpolatePoint(previous, current, segmentRatio),
        distanceMeters: targetDistance,
      });
      targetDistance += spacingMeters;
    }

    traversed += segmentLength;
  }

  return points;
}

function encodeWaypointPath(waypoints: CorridorWaypoint[]) {
  return waypoints
    .map((waypoint) => waypoint.coordinates.join(","))
    .join(";");
}

async function resolveCorridorPath(
  corridor: CorridorDefinition,
  token: string | undefined,
  signal: AbortSignal | undefined,
): Promise<{ path: LngLatTuple[]; geometrySource: GeometrySource }> {
  if (!token) {
    return {
      path: corridor.waypoints.map((waypoint) => waypoint.coordinates),
      geometrySource: "fallback",
    };
  }

  try {
    const waypointPath = encodeWaypointPath(corridor.waypoints);
    const directionsUrl =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointPath}` +
      `?alternatives=false&continue_straight=true&geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(directionsUrl, { signal });

    if (!response.ok) {
      throw new Error(`Directions request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as DirectionsApiResponse;
    const coordinates = payload.routes?.[0]?.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) {
      throw new Error("Directions API returned no usable geometry.");
    }

    return {
      path: coordinates.map((coordinate) => [coordinate[0], coordinate[1]] as LngLatTuple),
      geometrySource: "mapbox-directions",
    };
  } catch {
    return {
      path: corridor.waypoints.map((waypoint) => waypoint.coordinates),
      geometrySource: "fallback",
    };
  }
}

function buildNode(
  corridor: CorridorDefinition,
  corridorIndex: number,
  pathDistanceMeters: number,
  totalDistanceMeters: number,
  nodeIndex: number,
  coordinates: LngLatTuple,
): SimulationNode {
  const progress = totalDistanceMeters === 0 ? 0 : pathDistanceMeters / totalDistanceMeters;
  const zoneType: DeploymentZone = progress < corridor.urbanEntryRatio ? "highway" : "urban";
  const zoneSeed = (corridorIndex + 1) * 1_000 + nodeIndex + 1;
  const loadNoise = deterministicNoise(zoneSeed);
  const cityAmplifier = 1 + Math.max(0, 1 - Math.abs(progress - 0.84) / 0.2) * 0.22;
  const zoneTrafficMultiplier = zoneType === "highway" ? 1.08 : 0.91;
  const trafficCount = Math.round(
    corridor.baseTrafficCount * zoneTrafficMultiplier * cityAmplifier * (0.88 + loadNoise * 0.28),
  );

  const averageSpeedKmh = pickSpeed(
    zoneType === "highway" ? corridor.highwaySpeedRange : corridor.urbanSpeedRange,
    zoneSeed * 1.7,
  );
  const compressionEvents = Math.round(
    trafficCount * (2.2 + corridor.heavyVehicleShare * 4.4) * (zoneType === "highway" ? 1.06 : 0.96),
  );

  const energyBaseFactor = zoneType === "highway" ? 0.0053 : 0.0042;
  const energyOutputKwh = round(
    trafficCount *
      energyBaseFactor *
      (1 + corridor.heavyVehicleShare * 0.9) *
      (0.92 + averageSpeedKmh / 180),
    1,
  );

  const degradation =
    10 +
    corridor.stressIndex * 24 +
    progress * 17 +
    (zoneType === "urban" ? 7.5 : 2.5) +
    loadNoise * 11;
  const healthScore = round(clamp(100 - degradation, 55, 98), 1);
  const healthStatus = classifyHealth(healthScore);

  return {
    id: `PWM-${corridor.nodeCode}-${String(nodeIndex + 1).padStart(3, "0")}`,
    corridorId: corridor.id,
    corridorName: corridor.name,
    coordinates,
    latitude: coordinates[1],
    longitude: coordinates[0],
    stripCount: STRIP_COUNT,
    widthMeters: NODE_WIDTH_METERS,
    healthStatus,
    healthLabel: healthLabel(healthStatus),
    healthScore,
    energyOutputKwh,
    trafficCount,
    trafficDensity: classifyDensity(trafficCount),
    compressionEvents,
    co2OffsetKg: round(energyOutputKwh * CO2_DISPLACEMENT_KG_PER_KWH, 1),
    averageSpeedKmh,
    zoneType,
    positionKm: round(pathDistanceMeters / 1_000, 1),
  };
}

async function buildCorridorSimulation(
  corridor: CorridorDefinition,
  corridorIndex: number,
  token: string | undefined,
  signal: AbortSignal | undefined,
): Promise<CorridorSimulation> {
  const { path, geometrySource } = await resolveCorridorPath(corridor, token, signal);
  const totalDistanceMeters = polylineLengthMeters(path);

  const nodes = interpolateAlongPolyline(path, NODE_SPACING_METERS)
    .filter((node) => pointWithinBounds(node.coordinates, OPERATIONAL_BOUNDS))
    .map((node, nodeIndex) =>
      buildNode(
        corridor,
        corridorIndex,
        node.distanceMeters,
        totalDistanceMeters,
        nodeIndex,
        node.coordinates,
      ),
    );

  const healthyCount = nodes.filter((node) => node.healthStatus === "healthy").length;
  const warningCount = nodes.filter((node) => node.healthStatus === "warning").length;
  const maintenanceCount = nodes.filter((node) => node.healthStatus === "maintenance").length;
  const totalTrafficCount = nodes.reduce((sum, node) => sum + node.trafficCount, 0);
  const totalEnergyKwh = nodes.reduce((sum, node) => sum + node.energyOutputKwh, 0);

  return {
    id: corridor.id,
    name: corridor.name,
    shortLabel: corridor.shortLabel,
    origin: corridor.origin,
    destination: corridor.destination,
    color: corridor.color,
    geometrySource,
    waypoints: corridor.waypoints,
    path,
    nodeCount: nodes.length,
    distanceKm: round(totalDistanceMeters / 1_000, 1),
    avgTrafficCount: nodes.length > 0 ? Math.round(totalTrafficCount / nodes.length) : 0,
    avgEnergyKwh: nodes.length > 0 ? round(totalEnergyKwh / nodes.length, 1) : 0,
    healthyCount,
    warningCount,
    maintenanceCount,
    nodes,
  };
}

export async function buildDeploymentSimulation({
  mapboxToken,
  signal,
}: BuildSimulationOptions = {}): Promise<DeploymentSimulation> {
  const trimmedToken = mapboxToken?.trim() || undefined;

  const corridors = await Promise.all(
    CORRIDORS.map((corridor, corridorIndex) =>
      buildCorridorSimulation(corridor, corridorIndex, trimmedToken, signal),
    ),
  );

  const nodes = corridors.flatMap((corridor) => corridor.nodes);

  return {
    phaseLabel: PHASE_LABEL,
    bounds: OPERATIONAL_BOUNDS,
    center: GABORONE_CORE,
    boundaryAnchors: BOUNDARY_ANCHORS,
    spacingMeters: NODE_SPACING_METERS,
    stripCount: STRIP_COUNT,
    nodeWidthMeters: NODE_WIDTH_METERS,
    hasMapboxToken: Boolean(trimmedToken),
    usedDirections: corridors.some((corridor) => corridor.geometrySource === "mapbox-directions"),
    corridors,
    nodes,
    totals: {
      nodeCount: nodes.length,
      corridorCount: corridors.length,
      networkDistanceKm: round(
        corridors.reduce((sum, corridor) => sum + corridor.distanceKm, 0),
        1,
      ),
      dailyTrafficCount: nodes.reduce((sum, node) => sum + node.trafficCount, 0),
      dailyEnergyKwh: round(nodes.reduce((sum, node) => sum + node.energyOutputKwh, 0), 1),
      dailyCo2OffsetKg: round(nodes.reduce((sum, node) => sum + node.co2OffsetKg, 0), 1),
      compressionEvents: nodes.reduce((sum, node) => sum + node.compressionEvents, 0),
      healthyCount: nodes.filter((node) => node.healthStatus === "healthy").length,
      warningCount: nodes.filter((node) => node.healthStatus === "warning").length,
      maintenanceCount: nodes.filter((node) => node.healthStatus === "maintenance").length,
    },
  };
}
