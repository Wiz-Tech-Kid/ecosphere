import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ShieldAlert,
  TrendingDown,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
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

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const STATUS_STYLES = {
  healthy: {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/30",
    label: "HEALTHY",
    color: "#3d8a5e",
  },
  warning: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    label: "WARNING",
    color: "#c07a16",
  },
  critical: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
    label: "CRITICAL",
    color: "#b84a4a",
  },
} as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
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

interface MaintenanceProfile {
  nodeId: string;
  corridorId: string;
  corridorLabel: string;
  nodeHealth: number;
  stripHealth: number;
  degradedStrips: number;
  maintenanceRisk: number;
  status: "healthy" | "warning" | "critical";
  maintenanceRequired: boolean;
  trafficCount: number;
  outputKwh: number;
  estimatedLifeRemainingDays: number;
  degradationRate: number;
  estimatedCost: number;
  recommendedAction: string;
}

function buildMaintenanceProfile(
  corridorLabel: string,
  corridorId: string,
  node: ReturnType<typeof hydrateNodeWithRuntime>,
  runtime: NonNullable<ReturnType<typeof usePowamovSimulationStore.getState>["nodeRuntimeById"][string]>,
): MaintenanceProfile {
  const degradationRate = round((100 - runtime.nodeHealth) / 18 + runtime.degradedStrips * 0.68, 2);
  const estimatedLifeRemainingDays = clamp(
    Math.round((runtime.nodeHealth / Math.max(degradationRate, 0.4)) * 6.2),
    10,
    420,
  );
  const estimatedCost = Math.round(
    340 +
      runtime.degradedStrips * 220 +
      (runtime.status === "critical" ? 1850 : runtime.status === "warning" ? 760 : 0),
  );

  const recommendedAction =
    runtime.status === "critical"
      ? `Replace ${Math.max(runtime.degradedStrips, 4)} strips and inspect the node assembly immediately.`
      : runtime.status === "warning"
        ? "Three-strip warning threshold reached. Schedule strip replacement and calibration."
        : "Continue node monitoring and verify strip efficiency during routine inspection.";

  return {
    nodeId: node.id,
    corridorId,
    corridorLabel,
    nodeHealth: runtime.nodeHealth,
    stripHealth: runtime.stripHealthAverage,
    degradedStrips: runtime.degradedStrips,
    maintenanceRisk: runtime.maintenanceRisk,
    status: runtime.status,
    maintenanceRequired: runtime.status !== "healthy",
    trafficCount: node.trafficCount,
    outputKwh: node.energyOutputKwh,
    estimatedLifeRemainingDays,
    degradationRate,
    estimatedCost,
    recommendedAction,
  };
}

export default function Maintenance() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const loading = usePowamovSimulationStore((state) => state.loading);
  const error = usePowamovSimulationStore((state) => state.error);
  const selectedCorridorId = usePowamovSimulationStore((state) => state.selectedCorridorId);
  const selectedNodeId = usePowamovSimulationStore((state) => state.selectedNodeId);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const history = usePowamovSimulationStore((state) => state.history);
  const setSelectedCorridor = usePowamovSimulationStore((state) => state.setSelectedCorridor);
  const selectNode = usePowamovSimulationStore((state) => state.selectNode);

  const profiles = useMemo(() => {
    if (!simulation) {
      return [];
    }

    return simulation.corridors.flatMap((corridor) =>
      corridor.nodes
        .map((node) => {
          const runtime = nodeRuntimeById[node.id];
          if (!runtime) {
            return null;
          }

          return buildMaintenanceProfile(
            corridor.name,
            corridor.id,
            hydrateNodeWithRuntime(node, runtime),
            runtime,
          );
        })
        .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile)),
    );
  }, [nodeRuntimeById, simulation]);

  const activeCorridorId = selectedCorridorId ?? simulation?.corridors[0]?.id ?? null;
  const filteredProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => !activeCorridorId || profile.corridorId === activeCorridorId)
        .sort((left, right) => right.maintenanceRisk - left.maintenanceRisk),
    [activeCorridorId, profiles],
  );

  const selectedProfile = useMemo(() => {
    if (!filteredProfiles.length) {
      return profiles.find((profile) => profile.nodeId === selectedNodeId) ?? null;
    }

    return (
      filteredProfiles.find((profile) => profile.nodeId === selectedNodeId) ??
      filteredProfiles[0] ??
      null
    );
  }, [filteredProfiles, profiles, selectedNodeId]);

  const selectedRuntime = selectedProfile ? nodeRuntimeById[selectedProfile.nodeId] : null;
  const selectedCorridor = simulation?.corridors.find((corridor) => corridor.id === selectedProfile?.corridorId) ?? null;

  const summary = useMemo(() => {
    const healthy = profiles.filter((profile) => profile.status === "healthy").length;
    const warning = profiles.filter((profile) => profile.status === "warning").length;
    const critical = profiles.filter((profile) => profile.status === "critical").length;
    const stripsDegraded = profiles.reduce((sum, profile) => sum + profile.degradedStrips, 0);
    const maintenanceRequired = profiles.filter((profile) => profile.maintenanceRequired).length;

    return {
      healthy,
      warning,
      critical,
      stripsDegraded,
      maintenanceRequired,
    };
  }, [profiles]);

  const healthChartData = filteredProfiles.slice(0, 12).map((profile) => ({
    id: profile.nodeId.replace("PWM-", ""),
    nodeHealth: profile.nodeHealth,
    risk: profile.maintenanceRisk,
  }));

  const stripChartData = filteredProfiles.slice(0, 12).map((profile) => ({
    id: profile.nodeId.replace("PWM-", ""),
    degradedStrips: profile.degradedStrips,
    traffic: profile.trafficCount / 1000,
  }));

  const forecastProfiles = [...profiles]
    .sort((left, right) => right.maintenanceRisk - left.maintenanceRisk)
    .slice(0, 8);

  if (loading && !simulation) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-28 animate-pulse rounded-xl border border-border bg-card" />
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

  if (!simulation || !selectedProfile || !selectedRuntime || !selectedCorridor) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        No live node maintenance data is available.
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-5">
      <motion.div variants={fadeIn}>
        <h1 className="text-xl font-bold font-mono tracking-wide text-foreground">
          Node and Strip Health Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Corridor-filtered node drill-down using the live POWAMOV node-strip simulation feed
        </p>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total Nodes Healthy", value: summary.healthy, color: "text-accent", icon: ShieldAlert },
          { label: "Nodes Warning", value: summary.warning, color: "text-yellow-400", icon: AlertTriangle },
          { label: "Nodes Critical", value: summary.critical, color: "text-destructive", icon: XCircle },
          { label: "Strips Degraded", value: summary.stripsDegraded, color: "text-chart-3", icon: TrendingDown },
          { label: "Maintenance Required", value: summary.maintenanceRequired, color: "text-primary", icon: Calendar },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className={`mt-2 text-2xl font-mono font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {simulation.corridors.map((corridor) => (
            <button
              key={corridor.id}
              type="button"
              onClick={() => setSelectedCorridor(corridor.id)}
              className={`rounded-xl border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${
                corridor.id === activeCorridorId
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {corridor.shortLabel}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Node List
          </div>
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredProfiles.map((profile) => {
              const styles = STATUS_STYLES[profile.status];
              const selected = profile.nodeId === selectedProfile.nodeId;

              return (
                <button
                  key={profile.nodeId}
                  type="button"
                  onClick={() => selectNode(profile.nodeId)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selected ? "border-primary/35 bg-primary/5" : "border-border hover:border-border/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{profile.nodeId}</div>
                      <div className="text-xs text-muted-foreground">{profile.corridorLabel}</div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${styles.bg} ${styles.text} ${styles.border}`}>
                      {styles.label}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div className="rounded-lg bg-background/40 px-2.5 py-2">
                      <div className="text-muted-foreground">Node Health</div>
                      <div className="mt-1 font-bold" style={{ color: styles.color }}>{profile.nodeHealth.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-lg bg-background/40 px-2.5 py-2">
                      <div className="text-muted-foreground">Energy</div>
                      <div className="mt-1 font-bold text-primary">{profile.outputKwh.toFixed(3)} kWh</div>
                    </div>
                    <div className="rounded-lg bg-background/40 px-2.5 py-2">
                      <div className="text-muted-foreground">Status</div>
                      <div className="mt-1 font-bold text-foreground">{styles.label}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Strip Breakdown
                </div>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{selectedProfile.nodeId}</h2>
                <div className="text-sm text-muted-foreground">{selectedCorridor.name}</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-mono ${STATUS_STYLES[selectedProfile.status].bg} ${STATUS_STYLES[selectedProfile.status].text} ${STATUS_STYLES[selectedProfile.status].border}`}>
                {STATUS_STYLES[selectedProfile.status].label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: "Node Health", value: `${selectedProfile.nodeHealth.toFixed(1)}%` },
                { label: "Strip Health", value: `${selectedProfile.stripHealth.toFixed(1)}%` },
                { label: "Traffic", value: selectedProfile.trafficCount.toLocaleString() },
                { label: "Node Output", value: `${selectedProfile.outputKwh.toFixed(3)} kWh` },
                { label: "Risk", value: selectedProfile.maintenanceRisk.toFixed(1) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-background/40 px-3 py-2.5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-sm font-mono font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedRuntime.stripStates.map((strip) => {
                const stripColor =
                  strip.health < 50 ? STATUS_STYLES.critical.color :
                  strip.health < 70 ? STATUS_STYLES.warning.color :
                  STATUS_STYLES.healthy.color;

                return (
                  <div
                    key={strip.id}
                    className="rounded-xl border border-border bg-background/40 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-foreground">Strip {strip.id}</span>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: stripColor }} />
                    </div>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Health</span>
                        <span className="text-foreground">{strip.health.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Efficiency</span>
                        <span className="text-foreground">{strip.efficiency.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Usage</span>
                        <span className="text-foreground">{strip.usage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Degradation</span>
                        <span className="text-foreground">{strip.degradation.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" />
              Maintenance Forecast
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
              {selectedProfile.recommendedAction}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] font-mono">
              <div className="rounded-xl bg-background/40 px-3 py-2.5">
                <div className="text-muted-foreground">Life Remaining</div>
                <div className="mt-1 font-bold text-foreground">{selectedProfile.estimatedLifeRemainingDays} days</div>
              </div>
              <div className="rounded-xl bg-background/40 px-3 py-2.5">
                <div className="text-muted-foreground">Degradation Rate</div>
                <div className="mt-1 font-bold text-foreground">{selectedProfile.degradationRate.toFixed(2)} pts/mo</div>
              </div>
              <div className="rounded-xl bg-background/40 px-3 py-2.5">
                <div className="text-muted-foreground">Estimated Cost</div>
                <div className="mt-1 font-bold text-primary">${selectedProfile.estimatedCost.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Node Health Comparison
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={healthChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="id" tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={84} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="nodeHealth" name="Node Health %" fill="hsl(142,70%,45%)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Strip Degradation by Node
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stripChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="id" tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
              <YAxis domain={[0, 6]} tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="degradedStrips" name="Degraded Strips" fill="hsl(32,95%,54%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Node-Based Forecasting
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {forecastProfiles.map((profile) => {
              const styles = STATUS_STYLES[profile.status];

              return (
                <div key={profile.nodeId} className={`rounded-xl border p-3 ${styles.bg} ${styles.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{profile.nodeId}</div>
                      <div className="text-xs text-muted-foreground">{profile.corridorLabel}</div>
                    </div>
                    <span className={`text-[10px] font-mono ${styles.text}`}>{profile.estimatedLifeRemainingDays}d</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{profile.recommendedAction}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <TrendingDown className="h-3.5 w-3.5" />
          Maintenance Threshold Logic
        </div>
        <p className="text-sm text-muted-foreground">
          Node health 100-70 is healthy, 70-50 is warning, and below 50 is critical. Three degraded strips
          trigger a warning state, and four degraded strips trigger critical maintenance.
        </p>
        <div className="mt-4 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="efficiency" name="Network Efficiency %" fill="hsl(220,80%,66%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
