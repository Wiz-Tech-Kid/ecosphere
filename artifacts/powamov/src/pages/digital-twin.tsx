import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Car,
  Cpu,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  hydrateNodeWithRuntime,
  usePowamovSimulationBootstrap,
  usePowamovSimulationStore,
} from "@/stores/powamovSimulationStore";

const ENT = {
  blue: "#4a90b8",
  green: "#3d8a5e",
  amber: "#c07a16",
  violet: "#7c6db5",
  red: "#b84a4a",
  slate: "#5a7080",
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function statusMeta(status: "healthy" | "warning" | "critical") {
  if (status === "critical") {
    return { color: ENT.red, label: "Critical" };
  }

  if (status === "warning") {
    return { color: ENT.amber, label: "Warning" };
  }

  return { color: ENT.green, label: "Healthy" };
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded border border-border bg-card px-2.5 py-1.5 text-[10px] font-mono shadow-lg">
      <div className="mb-1 text-muted-foreground">{label}</div>
      {payload.map((item, index) => (
        <div key={index} style={{ color: item.color }}>
          {item.name}: {typeof item.value === "number" ? item.value.toFixed(2) : item.value}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: "healthy" | "warning" | "critical" }) {
  const meta = statusMeta(status);

  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]"
      style={{
        color: meta.color,
        borderColor: `${meta.color}35`,
        background: `${meta.color}10`,
      }}
    >
      {meta.label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="mt-2 text-xl font-mono font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function StripTile({
  strip,
}: {
  strip: {
    id: number;
    health: number;
    efficiency: number;
    usage: number;
    degradation: number;
    compression: number;
    forceKn: number;
    energyWh: number;
  };
}) {
  const active = strip.compression > 0.06;
  const color =
    strip.health < 50 ? ENT.red :
    strip.health < 70 ? ENT.amber :
    ENT.green;

  return (
    <div
      className="rounded-xl border p-3 transition-colors"
      style={{
        borderColor: active ? `${ENT.blue}40` : `${color}25`,
        background: active ? `${ENT.blue}10` : `${color}0c`,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-foreground">Strip {strip.id}</span>
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono">
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Health</div>
          <div className="text-foreground">{strip.health.toFixed(1)}%</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Compression</div>
          <div className="text-foreground">{Math.round(strip.compression * 100)}%</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Force</div>
          <div className="text-foreground">{strip.forceKn.toFixed(1)} kN</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Energy</div>
          <div className="text-foreground">{(strip.energyWh * 1000).toFixed(1)} mWh</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Degradation</div>
          <div className="text-foreground">{strip.degradation.toFixed(1)}%</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Efficiency</div>
          <div className="text-foreground">{strip.efficiency.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function springPath(centerX: number, topY: number, bottomY: number) {
  const segments = 6;
  const amplitude = 8;
  const step = (bottomY - topY) / segments;
  let path = `M ${centerX} ${topY}`;

  for (let index = 0; index < segments; index += 1) {
    const direction = index % 2 === 0 ? -amplitude : amplitude;
    path += ` L ${centerX + direction} ${topY + step * (index + 0.5)}`;
    path += ` L ${centerX} ${topY + step * (index + 1)}`;
  }

  return path;
}

function EngineeringNodeView({
  vehicleLabel,
  vehicleColor,
  vehicleWeight,
  vehicleSpeed,
  axleCount,
  vehicleTravel,
  stripStates,
  corridorLabel,
  nodeId,
  spacingMeters,
  deploymentWidthMeters,
  batteryPercent,
  currentNodeOutputWh,
  totalForceKn,
  degradedStrips,
  status,
}: {
  vehicleLabel: string;
  vehicleColor: string;
  vehicleWeight: number | null;
  vehicleSpeed: number | null;
  axleCount: number | null;
  vehicleTravel: number;
  stripStates: Array<{
    id: number;
    health: number;
    compression: number;
    efficiency: number;
    forceKn: number;
    energyWh: number;
    degradation: number;
  }>;
  corridorLabel: string;
  nodeId: string;
  spacingMeters: number;
  deploymentWidthMeters: number;
  batteryPercent: number;
  currentNodeOutputWh: number;
  totalForceKn: number;
  degradedStrips: number;
  status: "healthy" | "warning" | "critical";
}) {
  const statusColor = statusMeta(status).color;
  const activeStripIndex = stripStates.findIndex((strip) => strip.compression > 0.05);
  const activeStrip = activeStripIndex >= 0 ? stripStates[activeStripIndex] : null;
  const cableActive = Boolean(activeStrip);
  const vehicleX = 74 + (clamp(vehicleTravel, 0, 100) / 100) * 610;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            Vertical Engineering Simulation
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {corridorLabel}
          </h2>
          <div className="text-sm text-muted-foreground">
            {nodeId} · Vehicle passes a 2 m deployment node with 6 strips at 350 m spacing
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-right text-[10px] font-mono">
          <div className="text-muted-foreground">Random Traffic Generator</div>
          <div className="mt-1 font-semibold text-foreground">
            {vehicleLabel}
            {vehicleWeight ? ` · ${vehicleWeight.toLocaleString()} kg` : " · waiting"}
          </div>
          <div className="text-muted-foreground">
            {vehicleSpeed ? `${vehicleSpeed} km/h` : "1-3 s interval"} · {axleCount ?? 0} axles
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
        <svg viewBox="0 0 960 560" className="w-full">
          <defs>
            <linearGradient id="dtRoadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a3040" />
              <stop offset="100%" stopColor="#171d29" />
            </linearGradient>
            <linearGradient id="dtStripGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`${vehicleColor}aa`} />
              <stop offset="100%" stopColor={`${vehicleColor}18`} />
            </linearGradient>
            <linearGradient id="dtPowerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d2d42" />
              <stop offset="100%" stopColor="#071828" />
            </linearGradient>
            <linearGradient id="dtBatteryGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d9ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            <filter id="dtGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="960" height="560" rx="20" fill="#07121d" />
          <rect x="26" y="26" width="908" height="508" rx="18" fill="rgba(7,24,40,0.82)" stroke="rgba(74,144,184,0.16)" />

          {[
            { label: "Vehicle", y: 76 },
            { label: "Road Surface", y: 134 },
            { label: "6 Strips", y: 188 },
            { label: "Springs", y: 262 },
            { label: "Power Chamber", y: 342 },
            { label: "Energy Cable", y: 424 },
            { label: "Battery", y: 476 },
          ].map((layer) => (
            <g key={layer.label}>
              <text x="42" y={layer.y} fill="rgba(122,136,152,0.92)" fontSize="10" fontFamily="'Space Mono', monospace">
                {layer.label}
              </text>
              <line x1="132" y1={layer.y - 4} x2="904" y2={layer.y - 4} stroke="rgba(74,144,184,0.08)" strokeDasharray="3 6" />
            </g>
          ))}

          <g transform={`translate(${vehicleX}, 44)`}>
            <rect x="0" y="18" width="124" height="30" rx="5" fill="#1a2535" stroke="#2a3545" strokeWidth="1.5" />
            <rect x="64" y="0" width="42" height="28" rx="4" fill="#1f2d3d" stroke="#2a3545" strokeWidth="1.5" />
            <rect x="70" y="5" width="24" height="12" rx="2" fill="rgba(130,165,210,0.14)" stroke="#2a3e55" strokeWidth="0.8" />
            <rect x="116" y="25" width="5" height="8" rx="1" fill="#ddd060" opacity="0.84" />
            <rect x="3" y="26" width="4" height="7" rx="1" fill="#c04242" opacity="0.84" />
            <circle cx="24" cy="54" r="8" fill="#10161f" stroke="#2a3545" strokeWidth="1.5" />
            <circle cx="98" cy="54" r="8" fill="#10161f" stroke="#2a3545" strokeWidth="1.5" />
          </g>

          <rect x="138" y="118" width="696" height="34" rx="4" fill="url(#dtRoadGrad)" stroke="rgba(255,255,255,0.08)" />
          {Array.from({ length: 8 }, (_, index) => (
            <rect key={index} x={168 + index * 82} y="132" width="34" height="4" rx="2" fill="rgba(222,208,96,0.28)" />
          ))}

          {stripStates.map((strip, index) => {
            const stripColor =
              strip.health < 50 ? ENT.red :
              strip.health < 70 ? ENT.amber :
              ENT.green;
            const isActive = strip.compression > 0.05;
            const centerX = 184 + index * 96;
            const stripCompressionPx = strip.compression * 18;
            const stripY = 170 + stripCompressionPx;
            const springTopY = 222 + stripCompressionPx;
            const springBottomY = 288;

            return (
              <g key={strip.id}>
                <rect
                  x={centerX - 32}
                  y={stripY}
                  width="64"
                  height={22 - strip.compression * 6}
                  rx="4"
                  fill={isActive ? "url(#dtStripGrad)" : `${stripColor}18`}
                  stroke={isActive ? vehicleColor : stripColor}
                  strokeWidth={isActive ? 2 : 1.1}
                  filter={isActive ? "url(#dtGlow)" : undefined}
                />
                <text
                  x={centerX}
                  y={164}
                  textAnchor="middle"
                  fill={isActive ? vehicleColor : "rgba(226,244,255,0.72)"}
                  fontSize="10"
                  fontFamily="'Space Mono', monospace"
                >
                  S{strip.id}
                </text>
                <text
                  x={centerX}
                  y={198}
                  textAnchor="middle"
                  fill={isActive ? vehicleColor : "rgba(122,136,152,0.92)"}
                  fontSize="8"
                  fontFamily="'Space Mono', monospace"
                >
                  {Math.round(strip.compression * 100)}%
                </text>
                <path
                  d={springPath(centerX, springTopY, springBottomY)}
                  fill="none"
                  stroke={isActive ? vehicleColor : "rgba(42,90,122,0.9)"}
                  strokeWidth="2"
                  filter={isActive ? "url(#dtGlow)" : undefined}
                />
                <line x1={centerX} y1={springBottomY} x2={centerX} y2="322" stroke="rgba(74,144,184,0.24)" strokeWidth="1.2" />
                <text
                  x={centerX}
                  y="308"
                  textAnchor="middle"
                  fill={stripColor}
                  fontSize="8"
                  fontFamily="'Space Mono', monospace"
                >
                  {strip.health.toFixed(0)}%
                </text>
              </g>
            );
          })}

          <rect x="146" y="322" width="578" height="52" rx="8" fill="url(#dtPowerGrad)" stroke={cableActive ? vehicleColor : "rgba(26,74,107,0.9)"} strokeWidth="1.5" />
          {Array.from({ length: 9 }, (_, index) => (
            <line
              key={index}
              x1={168 + index * 58}
              y1="330"
              x2={168 + index * 58}
              y2="366"
              stroke={cableActive ? `${vehicleColor}55` : "rgba(13,42,62,0.95)"}
              strokeWidth="1"
            />
          ))}
          <text x="436" y="352" textAnchor="middle" fill={cableActive ? vehicleColor : "rgba(74,144,184,0.74)"} fontSize="12" fontFamily="'Space Mono', monospace">
            Power Chamber
          </text>
          <text x="436" y="367" textAnchor="middle" fill="rgba(122,136,152,0.92)" fontSize="9" fontFamily="'Space Mono', monospace">
            {"Sequential strip compression -> force conversion -> energy capture"}
          </text>

          <path
            d="M 724 348 C 780 348 814 376 844 416"
            fill="none"
            stroke={cableActive ? "#00ff88" : "rgba(22,78,99,0.9)"}
            strokeWidth="4"
            strokeDasharray="8 7"
            filter={cableActive ? "url(#dtGlow)" : undefined}
          />
          {cableActive ? (
            <>
              <circle cx="756" cy="352" r="4" fill="#00ff88" filter="url(#dtGlow)" />
              <circle cx="790" cy="370" r="4" fill="#00d9ff" filter="url(#dtGlow)" />
              <circle cx="822" cy="395" r="4" fill="#00ff88" filter="url(#dtGlow)" />
            </>
          ) : null}

          <rect x="824" y="420" width="66" height="36" rx="6" fill="#0a1f35" stroke={cableActive ? "#00ff88" : "#1a4a6b"} strokeWidth="1.8" />
          <rect x="890" y="431" width="7" height="14" rx="2" fill={cableActive ? "#00ff88" : "#1a4a6b"} />
          <rect x="828" y="424" width={Math.max(6, (58 * batteryPercent) / 100)} height="28" rx="4" fill="url(#dtBatteryGrad)" opacity={0.9} />
          <text x="857" y="444" textAnchor="middle" fill="#e2f4ff" fontSize="10" fontFamily="'Space Mono', monospace">
            Battery
          </text>
          <text x="857" y="455" textAnchor="middle" fill="rgba(122,136,152,0.92)" fontSize="8" fontFamily="'Space Mono', monospace">
            {batteryPercent.toFixed(0)}%
          </text>

          {activeStrip ? (
            <g>
              <line
                x1={184 + activeStripIndex * 96}
                y1="84"
                x2={184 + activeStripIndex * 96}
                y2="118"
                stroke="#ffb800"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polygon
                points={`${180 + activeStripIndex * 96},116 ${188 + activeStripIndex * 96},116 ${184 + activeStripIndex * 96},126`}
                fill="#ffb800"
              />
              <text
                x={184 + activeStripIndex * 96}
                y="78"
                textAnchor="middle"
                fill="#ffb800"
                fontSize="9"
                fontFamily="'Space Mono', monospace"
              >
                {activeStrip.forceKn.toFixed(1)} kN
              </text>
            </g>
          ) : null}

          <rect x="146" y="470" width="260" height="42" rx="8" fill="rgba(10,31,53,0.92)" stroke="rgba(26,74,107,0.8)" />
          <text x="164" y="488" fill="rgba(226,244,255,0.88)" fontSize="10" fontFamily="'Space Mono', monospace">
            Node {nodeId}
          </text>
          <text x="164" y="502" fill="rgba(122,136,152,0.92)" fontSize="9" fontFamily="'Space Mono', monospace">
            {corridorLabel} · {deploymentWidthMeters} m deployment · {spacingMeters} m spacing
          </text>

          <rect x="424" y="470" width="240" height="42" rx="8" fill="rgba(10,31,53,0.92)" stroke={`${statusColor}66`} />
          <text x="442" y="488" fill={statusColor} fontSize="10" fontFamily="'Space Mono', monospace">
            Strip architecture
          </text>
          <text x="442" y="502" fill="rgba(122,136,152,0.92)" fontSize="9" fontFamily="'Space Mono', monospace">
            6 strips · {degradedStrips} degraded · {(currentNodeOutputWh * 1000).toFixed(1)} mWh current output
          </text>

          <rect x="682" y="470" width="208" height="42" rx="8" fill="rgba(10,31,53,0.92)" stroke="rgba(26,74,107,0.8)" />
          <text x="700" y="488" fill="rgba(226,244,255,0.88)" fontSize="10" fontFamily="'Space Mono', monospace">
            Force + generation
          </text>
          <text x="700" y="502" fill="rgba(122,136,152,0.92)" fontSize="9" fontFamily="'Space Mono', monospace">
            {totalForceKn.toFixed(1)} kN array force · {(currentNodeOutputWh * 1000).toFixed(1)} mWh generated
          </text>
        </svg>
      </div>
    </div>
  );
}

function CorridorRuntimeCard({
  corridorLabel,
  nodeId,
  nodeHealth,
  degradedStrips,
  maintenanceRisk,
  outputKwh,
  trafficCount,
  status,
  onSelect,
  selected,
}: {
  corridorLabel: string;
  nodeId: string;
  nodeHealth: number;
  degradedStrips: number;
  maintenanceRisk: number;
  outputKwh: number;
  trafficCount: number;
  status: "healthy" | "warning" | "critical";
  onSelect: () => void;
  selected: boolean;
}) {
  const meta = statusMeta(status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border bg-card p-4 text-left transition-colors ${
        selected ? "border-primary/35" : "border-border hover:border-border/70"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{corridorLabel}</div>
          <div className="text-xs text-muted-foreground">{nodeId}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <div className="text-muted-foreground">Node Health</div>
          <div className="mt-1 font-bold" style={{ color: meta.color }}>{nodeHealth.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <div className="text-muted-foreground">Node Output</div>
          <div className="mt-1 font-bold text-primary">{outputKwh.toFixed(3)} kWh</div>
        </div>
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <div className="text-muted-foreground">Degraded Strips</div>
          <div className="mt-1 font-bold text-foreground">{degradedStrips}/6</div>
        </div>
        <div className="rounded-lg bg-background/40 px-3 py-2">
          <div className="text-muted-foreground">Traffic Count</div>
          <div className="mt-1 font-bold text-foreground">{trafficCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] font-mono text-muted-foreground">
        Maintenance risk <span style={{ color: meta.color }}>{maintenanceRisk.toFixed(1)}</span>
      </div>
    </button>
  );
}

export default function DigitalTwin() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const loading = usePowamovSimulationStore((state) => state.loading);
  const error = usePowamovSimulationStore((state) => state.error);
  const engineRunning = usePowamovSimulationStore((state) => state.engineRunning);
  const selectedCorridorId = usePowamovSimulationStore((state) => state.selectedCorridorId);
  const selectedNodeId = usePowamovSimulationStore((state) => state.selectedNodeId);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const corridorRuntimeById = usePowamovSimulationStore((state) => state.corridorRuntimeById);
  const history = usePowamovSimulationStore((state) => state.history);
  const livePowerKw = usePowamovSimulationStore((state) => state.livePowerKw);
  const setSelectedCorridor = usePowamovSimulationStore((state) => state.setSelectedCorridor);
  const startEngine = usePowamovSimulationStore((state) => state.startEngine);
  const stopEngine = usePowamovSimulationStore((state) => state.stopEngine);
  const resetCorridor = usePowamovSimulationStore((state) => state.resetCorridor);
  const [activeTab, setActiveTab] = useState<"simulation" | "grid">("simulation");

  const corridor = useMemo(
    () => simulation?.corridors.find((entry) => entry.id === selectedCorridorId) ?? null,
    [selectedCorridorId, simulation],
  );

  const baseNode = useMemo(() => {
    if (!corridor || !selectedNodeId) {
      return corridor?.nodes[0] ?? null;
    }

    return corridor.nodes.find((node) => node.id === selectedNodeId) ?? corridor.nodes[0] ?? null;
  }, [corridor, selectedNodeId]);

  const nodeRuntime = baseNode ? nodeRuntimeById[baseNode.id] : null;
  const liveNode = baseNode ? hydrateNodeWithRuntime(baseNode, nodeRuntime ?? undefined) : null;
  const corridorRuntime = corridor ? corridorRuntimeById[corridor.id] : null;
  const activeVehicle = corridorRuntime?.activeVehicle ?? null;
  const activeCompression = nodeRuntime?.stripStates.find((strip) => strip.compression > 0.05)?.compression ?? 0;
  const vehicleTravel = activeVehicle ? ((activeVehicle.stripIndex + activeCompression) / 6) * 100 : 0;
  const currentOutputWh = nodeRuntime?.stripStates.reduce((sum, strip) => sum + strip.energyWh, 0) ?? 0;
  const totalForceKn = nodeRuntime?.stripStates.reduce((sum, strip) => sum + strip.forceKn, 0) ?? 0;
  const vehiclesPerMinute = liveNode ? liveNode.trafficCount / (24 * 60) : 0;
  const batteryPercent = clamp((nodeRuntime?.liveEnergyWh ?? 0) * 12, 4, 100);
  const nextVehicleSeconds =
    activeVehicle || !corridorRuntime
      ? 0
      : Math.max(0, Math.ceil((corridorRuntime.nextVehicleDueAt - Date.now()) / 1000));

  const networkCards = useMemo(() => {
    if (!simulation) {
      return [];
    }

    return simulation.corridors.map((entry) => {
      const focusNodeId =
        corridorRuntimeById[entry.id]?.activeNodeId ??
        entry.nodes[0]?.id ??
        null;
      const focusNode = (focusNodeId && entry.nodes.find((node) => node.id === focusNodeId)) ?? entry.nodes[0] ?? null;
      const runtime = focusNode ? nodeRuntimeById[focusNode.id] : undefined;

      if (!focusNode || !runtime) {
        return null;
      }

      const liveFocusNode = hydrateNodeWithRuntime(focusNode, runtime);
      return {
        id: entry.id,
        label: entry.name,
        nodeId: liveFocusNode.id,
        nodeHealth: runtime.nodeHealth,
        degradedStrips: runtime.degradedStrips,
        maintenanceRisk: runtime.maintenanceRisk,
        outputKwh: liveFocusNode.energyOutputKwh,
        trafficCount: liveFocusNode.trafficCount,
        status: runtime.status,
      };
    }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [corridorRuntimeById, nodeRuntimeById, simulation]);

  const healthyNodes = useMemo(
    () => Object.values(nodeRuntimeById).filter((runtime) => runtime.status === "healthy").length,
    [nodeRuntimeById],
  );
  const warningNodes = useMemo(
    () => Object.values(nodeRuntimeById).filter((runtime) => runtime.status === "warning").length,
    [nodeRuntimeById],
  );
  const criticalNodes = useMemo(
    () => Object.values(nodeRuntimeById).filter((runtime) => runtime.status === "critical").length,
    [nodeRuntimeById],
  );
  const totalVehiclePasses = useMemo(
    () => Object.values(nodeRuntimeById).reduce((sum, runtime) => sum + runtime.liveVehiclePasses, 0),
    [nodeRuntimeById],
  );

  if (loading && !simulation) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-36 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!simulation || !corridor || !baseNode || !nodeRuntime || !liveNode) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        No POWAMOV node data is available for the Digital Twin.
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-5">
      <motion.div variants={fadeIn} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-primary">
              Node-Strip Engine
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Region - Corridor - Node - Strip
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            POWAMOV Engineering Simulation
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Random traffic is generated every 1 to 3 seconds. Each vehicle compresses 6 strips
            sequentially under the selected deployment node, updates strip degradation in real time,
            and pushes node health into the shared POWAMOV simulation store.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {[
              { id: "simulation", label: "Engineering View" },
              { id: "grid", label: "Network Grid" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as "simulation" | "grid")}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
                  activeTab === tab.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (engineRunning) {
                stopEngine();
              } else {
                startEngine();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground"
          >
            {engineRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {engineRunning ? "Pause" : "Resume"}
          </button>

          <button
            type="button"
            onClick={() => resetCorridor(selectedCorridorId ?? undefined)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Corridor
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {simulation.corridors.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedCorridor(entry.id)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
                  selectedCorridorId === entry.id
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {entry.shortLabel}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-right text-[10px] font-mono sm:flex sm:items-center sm:gap-5">
            <div>
              <div className="text-muted-foreground">Vehicle</div>
              <div className="font-semibold text-foreground">{activeVehicle?.label ?? "Generator idle"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Speed</div>
              <div className="font-semibold text-foreground">{activeVehicle?.speedKmh ?? 0} km/h</div>
            </div>
            <div>
              <div className="text-muted-foreground">Axles</div>
              <div className="font-semibold text-foreground">{activeVehicle?.axleCount ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Next Vehicle</div>
              <div className="font-semibold text-foreground">
                {activeVehicle ? "In progress" : `${nextVehicleSeconds}s`}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {activeTab === "simulation" ? (
        <>
          <motion.div variants={fadeIn}>
            <EngineeringNodeView
              vehicleLabel={activeVehicle?.label ?? "Traffic generator"}
              vehicleColor={activeVehicle?.color ?? ENT.blue}
              vehicleWeight={activeVehicle?.weightKg ?? nodeRuntime.lastWeightKg}
              vehicleSpeed={activeVehicle?.speedKmh ?? nodeRuntime.lastSpeedKmh}
              axleCount={activeVehicle?.axleCount ?? nodeRuntime.lastAxleCount}
              vehicleTravel={vehicleTravel}
              stripStates={nodeRuntime.stripStates}
              corridorLabel={corridor.name}
              nodeId={liveNode.id}
              spacingMeters={simulation.spacingMeters}
              deploymentWidthMeters={liveNode.widthMeters}
              batteryPercent={batteryPercent}
              currentNodeOutputWh={currentOutputWh}
              totalForceKn={totalForceKn}
              degradedStrips={nodeRuntime.degradedStrips}
              status={nodeRuntime.status}
            />
          </motion.div>

          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              label="Vehicles / Min"
              value={vehiclesPerMinute.toFixed(1)}
              sub="Selected node corridor flow"
              icon={Car}
              color={ENT.violet}
            />
            <MetricCard
              label="Energy Generation"
              value={`${(currentOutputWh * 1000).toFixed(1)} mWh`}
              sub={`${nodeRuntime.liveEnergyWh.toFixed(3)} Wh cumulative`}
              icon={Zap}
              color={ENT.blue}
            />
            <MetricCard
              label="Node Health"
              value={`${nodeRuntime.nodeHealth.toFixed(1)}%`}
              sub="Average strip health"
              icon={ShieldAlert}
              color={statusMeta(nodeRuntime.status).color}
            />
            <MetricCard
              label="Strip Health"
              value={`${nodeRuntime.stripHealthAverage.toFixed(1)}%`}
              sub={`${nodeRuntime.degradedStrips}/6 degraded`}
              icon={Cpu}
              color={ENT.green}
            />
            <MetricCard
              label="Maintenance Trigger"
              value={nodeRuntime.status === "critical" ? "Critical" : nodeRuntime.status === "warning" ? "Warning" : "Healthy"}
              sub="3 degraded = warning, 4 degraded = critical"
              icon={Wrench}
              color={statusMeta(nodeRuntime.status).color}
            />
          </motion.div>

          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {nodeRuntime.stripStates.map((strip) => (
              <StripTile key={strip.id} strip={strip} />
            ))}
          </motion.div>

          <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Live Energy History
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="digitalTwinEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ENT.blue} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={ENT.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="energyKwh" name="Energy kWh" stroke={ENT.blue} fill="url(#digitalTwinEnergy)" strokeWidth={1.6} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Active Node Summary
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Node ID</span>
                    <span className="font-medium text-foreground">{liveNode.id}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Corridor</span>
                    <span className="font-medium text-foreground">{corridor.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Strip Count</span>
                    <span className="font-medium text-foreground">6</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Width</span>
                    <span className="font-medium text-foreground">{liveNode.widthMeters} m</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Traffic Count</span>
                    <span className="font-medium text-foreground">{liveNode.trafficCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Vehicles / Min</span>
                    <span className="font-medium text-foreground">{vehiclesPerMinute.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">CO2 Offset</span>
                    <span className="font-medium text-foreground">{liveNode.co2OffsetKg.toFixed(2)} kg</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Array Force</span>
                    <span className="font-medium text-foreground">{totalForceKn.toFixed(1)} kN</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={nodeRuntime.status} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  <Car className="h-3.5 w-3.5" />
                  Generator Feed
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vehicle Type</span>
                    <span className="font-medium text-foreground">{activeVehicle?.label ?? nodeRuntime.lastVehicleType ?? "Pending"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium text-foreground">
                      {(activeVehicle?.weightKg ?? nodeRuntime.lastWeightKg ?? 0).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Speed</span>
                    <span className="font-medium text-foreground">{activeVehicle?.speedKmh ?? nodeRuntime.lastSpeedKmh ?? 0} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Axles</span>
                    <span className="font-medium text-foreground">{activeVehicle?.axleCount ?? nodeRuntime.lastAxleCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Live Network Power</span>
                    <span className="font-medium text-primary">{livePowerKw.toFixed(3)} kW</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div variants={fadeIn} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              label="Nodes Healthy"
              value={healthyNodes.toString()}
              sub="Current network band"
              icon={ShieldAlert}
              color={ENT.green}
            />
            <MetricCard
              label="Nodes Warning"
              value={warningNodes.toString()}
              sub="Require review"
              icon={AlertTriangle}
              color={ENT.amber}
            />
            <MetricCard
              label="Nodes Critical"
              value={criticalNodes.toString()}
              sub="Maintenance priority"
              icon={Wrench}
              color={ENT.red}
            />
            <MetricCard
              label="Vehicle Passes"
              value={totalVehiclePasses.toString()}
              sub="Since simulation start"
              icon={Car}
              color={ENT.violet}
            />
            <MetricCard
              label="Live Power"
              value={`${livePowerKw.toFixed(3)} kW`}
              sub="Shared store output"
              icon={Zap}
              color={ENT.blue}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {networkCards.map((card) => (
                <CorridorRuntimeCard
                  key={card.id}
                  corridorLabel={card.label}
                  nodeId={card.nodeId}
                  nodeHealth={card.nodeHealth}
                  degradedStrips={card.degradedStrips}
                  maintenanceRisk={card.maintenanceRisk}
                  outputKwh={card.outputKwh}
                  trafficCount={card.trafficCount}
                  status={card.status}
                  onSelect={() => {
                    setSelectedCorridor(card.id);
                    setActiveTab("simulation");
                  }}
                  selected={card.id === selectedCorridorId}
                />
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                Network Efficiency
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="networkEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ENT.green} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={ENT.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="efficiency" name="Efficiency %" stroke={ENT.green} fill="url(#networkEfficiency)" strokeWidth={1.6} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
