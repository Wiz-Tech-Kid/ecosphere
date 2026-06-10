import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Cpu,
  Factory,
  Gauge,
  Leaf,
  MapPin,
  Radio,
  Route,
  ShieldCheck,
  TriangleAlert,
  Wrench,
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
import { DeploymentMap } from "@/components/command/deployment-map";
import {
  hydrateNodeWithRuntime,
  usePowamovSimulationBootstrap,
  usePowamovSimulationStore,
} from "@/stores/powamovSimulationStore";
import type {
  CorridorSimulation,
  DeploymentSimulation,
  SimulationNode,
} from "@/services/deploymentSimulation";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatRouteMode(simulation: DeploymentSimulation, hasToken: boolean) {
  if (!hasToken) {
    return "Fallback corridor geometry active. Add a Mapbox token for road-snapped deployment paths.";
  }

  if (!simulation.usedDirections) {
    return "Mapbox rendered successfully. Corridor spacing is using fallback waypoint geometry.";
  }

  return "Mapbox and Directions API active. Deployment nodes are spaced at 350 m on road geometry.";
}

function StatCard({
  label,
  value,
  unit,
  description,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string;
  unit?: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-3xl font-semibold ${colorClass}`}>{value}</span>
        {unit ? <span className="pb-1 text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function HealthBadge({ node }: { node: SimulationNode }) {
  const badgeClass =
    node.healthStatus === "healthy"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : node.healthStatus === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] ${badgeClass}`}>
      {node.healthLabel}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function SystemLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <div className="group rounded-2xl border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

function CorridorCard({
  corridor,
  onFocusNode,
}: {
  corridor: CorridorSimulation;
  onFocusNode: (nodeId: string) => void;
}) {
  const totalHealth = corridor.healthyCount + corridor.warningCount + corridor.maintenanceCount || 1;
  const focusNode =
    corridor.nodes.find((node) => node.healthStatus === "maintenance") ??
    corridor.nodes.find((node) => node.healthStatus === "warning") ??
    corridor.nodes[0];

  return (
    <button
      type="button"
      onClick={() => {
        if (focusNode) {
          onFocusNode(focusNode.id);
        }
      }}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="mb-4 h-1.5 rounded-full" style={{ background: corridor.color }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{corridor.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {corridor.origin} to {corridor.destination}
          </div>
        </div>
        <span className="rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {corridor.geometrySource === "mapbox-directions" ? "Road path" : "Fallback"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Distance
          </div>
          <div className="mt-1 font-medium text-foreground">{corridor.distanceKm.toFixed(1)} km</div>
        </div>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Nodes
          </div>
          <div className="mt-1 font-medium text-foreground">{wholeNumberFormatter.format(corridor.nodeCount)}</div>
        </div>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Avg Traffic
          </div>
          <div className="mt-1 font-medium text-foreground">
            {compactFormatter.format(corridor.avgTrafficCount)} / day
          </div>
        </div>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Node Output
          </div>
          <div className="mt-1 font-medium text-foreground">{corridor.avgEnergyKwh.toFixed(3)} kWh</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span>Health mix</span>
          <span>{wholeNumberFormatter.format(totalHealth)} nodes</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-secondary/50">
          <div className="bg-emerald-500" style={{ width: `${(corridor.healthyCount / totalHealth) * 100}%` }} />
          <div className="bg-amber-500" style={{ width: `${(corridor.warningCount / totalHealth) * 100}%` }} />
          <div className="bg-red-500" style={{ width: `${(corridor.maintenanceCount / totalHealth) * 100}%` }} />
        </div>
      </div>
    </button>
  );
}

function buildLiveSimulation(
  simulation: DeploymentSimulation,
  nodeRuntimeById: ReturnType<typeof usePowamovSimulationStore.getState>["nodeRuntimeById"],
) {
  const liveCorridors = simulation.corridors.map((corridor) => {
    const nodes = corridor.nodes.map((node) => hydrateNodeWithRuntime(node, nodeRuntimeById[node.id]));
    const healthyCount = nodes.filter((node) => node.healthStatus === "healthy").length;
    const warningCount = nodes.filter((node) => node.healthStatus === "warning").length;
    const maintenanceCount = nodes.filter((node) => node.healthStatus === "maintenance").length;
    const totalTrafficCount = nodes.reduce((sum, node) => sum + node.trafficCount, 0);
    const totalEnergyKwh = nodes.reduce((sum, node) => sum + node.energyOutputKwh, 0);

    return {
      ...corridor,
      nodes,
      healthyCount,
      warningCount,
      maintenanceCount,
      avgTrafficCount: nodes.length ? Math.round(totalTrafficCount / nodes.length) : 0,
      avgEnergyKwh: nodes.length ? totalEnergyKwh / nodes.length : 0,
    };
  });

  const nodes = liveCorridors.flatMap((corridor) => corridor.nodes);

  return {
    ...simulation,
    corridors: liveCorridors,
    nodes,
    totals: {
      ...simulation.totals,
      dailyTrafficCount: nodes.reduce((sum, node) => sum + node.trafficCount, 0),
      dailyEnergyKwh: Number(nodes.reduce((sum, node) => sum + node.energyOutputKwh, 0).toFixed(3)),
      dailyCo2OffsetKg: Number(nodes.reduce((sum, node) => sum + node.co2OffsetKg, 0).toFixed(3)),
      compressionEvents: nodes.reduce((sum, node) => sum + node.compressionEvents, 0),
      healthyCount: nodes.filter((node) => node.healthStatus === "healthy").length,
      warningCount: nodes.filter((node) => node.healthStatus === "warning").length,
      maintenanceCount: nodes.filter((node) => node.healthStatus === "maintenance").length,
    },
  };
}

export default function CommandCenter() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  const mapboxStyleUrl =
    import.meta.env.VITE_MAPBOX_STYLE_URL?.trim() || "mapbox://styles/mapbox/dark-v11";

  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const loading = usePowamovSimulationStore((state) => state.loading);
  const error = usePowamovSimulationStore((state) => state.error);
  const selectedNodeId = usePowamovSimulationStore((state) => state.selectedNodeId);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const livePowerKw = usePowamovSimulationStore((state) => state.livePowerKw);
  const selectNode = usePowamovSimulationStore((state) => state.selectNode);

  const liveSimulation = useMemo(
    () => (simulation ? buildLiveSimulation(simulation, nodeRuntimeById) : null),
    [nodeRuntimeById, simulation],
  );

  const selectedNode = useMemo(() => {
    if (!liveSimulation) {
      return null;
    }

    return liveSimulation.nodes.find((node) => node.id === selectedNodeId) ?? liveSimulation.nodes[0] ?? null;
  }, [liveSimulation, selectedNodeId]);

  const selectedRuntime = selectedNode ? nodeRuntimeById[selectedNode.id] : null;

  const corridorChartData = useMemo(() => {
    if (!liveSimulation) {
      return [];
    }

    return liveSimulation.corridors.map((corridor) => ({
      name: corridor.shortLabel,
      energy: Number((corridor.avgEnergyKwh * corridor.nodeCount).toFixed(3)),
      nodes: corridor.nodeCount,
      traffic: Math.round(corridor.avgTrafficCount / 1000),
    }));
  }, [liveSimulation]);

  if (loading && !liveSimulation) {
    return (
      <motion.div variants={fadeIn} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="h-[560px] animate-pulse rounded-2xl border border-border bg-card xl:col-span-8" />
          <div className="space-y-4 xl:col-span-4">
            <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!liveSimulation || !selectedNode) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        No POWAMOV deployment data is available for the Command Center.
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-primary">
              Phase 1
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Gaborone deployment simulation
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              POWAMOV Infrastructure Planning Dashboard
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Deployment overview for Greater Gaborone.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
            Route Mode
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Route className="h-4 w-4 text-primary" />
            <span>{formatRouteMode(liveSimulation, Boolean(mapboxToken))}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Deployment Nodes"
          value={wholeNumberFormatter.format(liveSimulation.totals.nodeCount)}
          description="Deployment nodes generated across the five Phase 1 corridors."
          icon={Factory}
          colorClass="text-primary"
        />
        <StatCard
          label="Network Span"
          value={liveSimulation.totals.networkDistanceKm.toFixed(1)}
          unit="km"
          description="Operational corridor distance under the Gaborone deployment boundary."
          icon={MapPin}
          colorClass="text-cyan-300"
        />
        <StatCard
          label="Node Output"
          value={compactFormatter.format(liveSimulation.totals.dailyEnergyKwh)}
          unit="kWh"
          description="Projected node output with live simulation updates applied from the shared store."
          icon={Activity}
          colorClass="text-emerald-300"
        />
        <StatCard
          label="CO2 Offset"
          value={compactFormatter.format(liveSimulation.totals.dailyCo2OffsetKg)}
          unit="kg"
          description={`Live network power ${livePowerKw.toFixed(3)} kW driving the emissions offset view.`}
          icon={Leaf}
          colorClass="text-lime-300"
        />
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DeploymentMap
            simulation={liveSimulation}
            selectedNode={selectedNode}
            onSelectNode={selectNode}
            mapboxToken={mapboxToken}
            styleUrl={mapboxStyleUrl}
          />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                  Selected node
                </div>
                <h2 className="mt-2 text-xl font-semibold text-foreground">{selectedNode.id}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedNode.corridorName}</p>
              </div>
              <HealthBadge node={selectedNode} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-border/70 bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {selectedNode.zoneType}
              </span>
              <span className="rounded-full border border-border/70 bg-secondary/30 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {selectedNode.trafficDensity} traffic density
              </span>
            </div>

            <div className="mt-5">
              <DetailRow label="Strip count" value={`${selectedNode.stripCount}`} />
              <DetailRow label="Node width" value={`${selectedNode.widthMeters} m`} />
              <DetailRow label="Node Output" value={`${selectedNode.energyOutputKwh.toFixed(3)} kWh`} />
              <DetailRow label="Traffic count" value={`${wholeNumberFormatter.format(selectedNode.trafficCount)} / day`} />
              <DetailRow label="Compression events" value={wholeNumberFormatter.format(selectedNode.compressionEvents)} />
              <DetailRow label="Node health" value={`${selectedRuntime?.nodeHealth.toFixed(1) ?? selectedNode.healthScore.toFixed(1)} / 100`} />
              <DetailRow label="Degraded strips" value={`${selectedRuntime?.degradedStrips ?? 0} / 6`} />
              <DetailRow label="Maintenance risk" value={selectedRuntime?.maintenanceRisk.toFixed(1) ?? "0.0"} />
              <DetailRow label="CO2 offset" value={`${selectedNode.co2OffsetKg.toFixed(3)} kg`} />
              <DetailRow label="Coordinates" value={`${selectedNode.latitude.toFixed(5)}, ${selectedNode.longitude.toFixed(5)}`} />
            </div>

            <div className="mt-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                System surfaces
              </div>
              <SystemLink
                href="/command"
                icon={Activity}
                title="Command Center"
                desc="Deployment overview and network health"
              />
              <SystemLink
                href="/digital-twin"
                icon={Cpu}
                title="Digital Twin"
                desc="Inspect the live node-strip engineering simulation"
              />
              <SystemLink
                href="/tracker"
                icon={Radio}
                title="Emissions Tracker"
                desc="Review carbon offset from the live deployment network"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Simulation basis
            </div>
            <div className="mt-4 space-y-3">
              <DetailRow label="Node composition" value={`${liveSimulation.stripCount} strips + reflector assembly`} />
              <DetailRow label="Node width" value={`${liveSimulation.nodeWidthMeters} m`} />
              <DetailRow label="Node spacing" value={`${liveSimulation.spacingMeters} m`} />
              <DetailRow label="Corridors" value={`${liveSimulation.totals.corridorCount} entry corridors`} />
              <DetailRow label="Operational boundary" value="Gabane, Otse, Rasesa, Tlokweng border, Molepolole" />
            </div>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Future compatible
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                Corridor deployment
              </div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Phase 1 corridor segmentation
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-300" />
              <span>Click a corridor to focus its most stressed node</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {liveSimulation.corridors.map((corridor) => (
              <CorridorCard key={corridor.id} corridor={corridor} onFocusNode={selectNode} />
            ))}
          </div>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                  Corridor energy
                </div>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Deployment node output by corridor
                </h2>
              </div>
              <Gauge className="h-4 w-4 text-primary" />
            </div>

            <div className="mt-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corridorChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 25% 10%)",
                      border: "1px solid hsl(220 14% 18%)",
                      borderRadius: 16,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "energy") {
                        return [`${value.toFixed(3)} kWh`, "Node Output"];
                      }

                      if (name === "nodes") {
                        return [`${wholeNumberFormatter.format(value)}`, "Nodes"];
                      }

                      return [`${value}k/day`, "Avg traffic"];
                    }}
                  />
                  <Bar dataKey="energy" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
