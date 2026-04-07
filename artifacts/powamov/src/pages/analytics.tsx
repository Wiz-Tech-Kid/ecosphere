import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Leaf, Grid, Car, TrendingUp, DollarSign, Trees } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { usePowamovSimulationBootstrap, usePowamovSimulationStore } from "@/stores/powamovSimulationStore";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const GRID_DISPLACEMENT_TARGET_KWH = 25000;
const TREE_EQUIVALENT_PER_KG = 0.06;
const REVENUE_PER_KWH = 0.12;

function CustomTooltip({
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
    <div className="rounded border border-border bg-card px-3 py-2 text-xs font-mono">
      <div className="mb-1 text-muted-foreground">{label}</div>
      {payload.map((point, index) => (
        <div key={index} style={{ color: point.color }}>
          {point.name}: {typeof point.value === "number" ? point.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : point.value}
        </div>
      ))}
    </div>
  );
}

function HeroStat({
  label,
  value,
  unit,
  icon: Icon,
  color = "text-primary",
  subtext,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color?: string;
  subtext?: string;
}) {
  return (
    <motion.div variants={fadeIn} className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
        {unit ? <span className="mb-1 text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {subtext ? <span className="mt-1 block text-xs text-muted-foreground">{subtext}</span> : null}
    </motion.div>
  );
}

export default function Analytics() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const loading = usePowamovSimulationStore((state) => state.loading);
  const error = usePowamovSimulationStore((state) => state.error);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const history = usePowamovSimulationStore((state) => state.history);
  const livePowerKw = usePowamovSimulationStore((state) => state.livePowerKw);

  const summary = useMemo(() => {
    const runtimes = Object.values(nodeRuntimeById);
    const totalEnergyKwh = runtimes.reduce((sum, runtime) => sum + runtime.liveEnergyWh / 1000, 0);
    const carbonOffsetKg = runtimes.reduce((sum, runtime) => sum + runtime.liveCo2OffsetKg, 0);
    const totalVehiclePasses = runtimes.reduce((sum, runtime) => sum + runtime.liveVehiclePasses, 0);
    const avgEfficiencyPercent = runtimes.length
      ? runtimes.reduce((sum, runtime) => sum + runtime.stripHealthAverage, 0) / runtimes.length
      : 0;
    const avgNodeHealth = runtimes.length
      ? runtimes.reduce((sum, runtime) => sum + runtime.nodeHealth, 0) / runtimes.length
      : 0;
    const activeNodes = runtimes.filter((runtime) => runtime.liveVehiclePasses > 0 || runtime.liveCompressionEvents > 0).length;
    const totalNodes = simulation?.totals.nodeCount ?? runtimes.length;
    const warningNodes = runtimes.filter((runtime) => runtime.status !== "healthy").length;
    const revenueUsd = totalEnergyKwh * REVENUE_PER_KWH;

    return {
      totalEnergyKwh,
      carbonOffsetKg,
      totalVehiclePasses,
      avgEfficiencyPercent,
      avgNodeHealth,
      activeNodes,
      totalNodes,
      warningNodes,
      revenueUsd,
      treesEquivalent: Math.round(carbonOffsetKg * TREE_EQUIVALENT_PER_KG),
      gridDisplacementPercent: totalEnergyKwh > 0 ? (totalEnergyKwh / GRID_DISPLACEMENT_TARGET_KWH) * 100 : 0,
      co2SavedTons: carbonOffsetKg / 1000,
    };
  }, [nodeRuntimeById, simulation]);

  const chartData = history.map((point) => ({
    date: point.t,
    energy: point.energyKwh,
    carbon: point.carbonOffsetKg,
    passes: point.vehiclePasses,
    efficiency: point.efficiency,
  }));

  if (loading && !simulation) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-card" />
        ))}
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

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-5">
      <motion.div variants={fadeIn}>
        <h1 className="text-xl font-bold font-mono tracking-wide text-foreground">Energy Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Live energy harvest, carbon offset, and network efficiency from the POWAMOV simulation store
        </p>
      </motion.div>

      <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeroStat
          label="Live Harvested"
          value={summary.totalEnergyKwh.toFixed(3)}
          unit="kWh"
          icon={Zap}
          color="text-primary"
          subtext={`${livePowerKw.toFixed(3)} kW current network power`}
        />
        <HeroStat
          label="Carbon Offset"
          value={summary.carbonOffsetKg.toFixed(3)}
          unit="kg CO2"
          icon={Leaf}
          color="text-accent"
          subtext={`${summary.co2SavedTons.toFixed(3)} tons saved`}
        />
        <HeroStat
          label="Grid Displacement"
          value={summary.gridDisplacementPercent.toFixed(2)}
          unit="%"
          icon={Grid}
          color="text-chart-4"
          subtext="Against the target offset envelope"
        />
        <HeroStat
          label="Trees Equivalent"
          value={summary.treesEquivalent.toLocaleString()}
          icon={Trees}
          color="text-chart-2"
          subtext="Equivalent sequestration estimate"
        />
      </motion.div>

      <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeroStat
          label="Vehicle Passes"
          value={summary.totalVehiclePasses.toLocaleString()}
          icon={Car}
          color="text-chart-3"
          subtext="Random traffic generator events"
        />
        <HeroStat
          label="Avg Efficiency"
          value={summary.avgEfficiencyPercent.toFixed(1)}
          unit="%"
          icon={TrendingUp}
          color="text-primary"
          subtext="Average strip health aggregate"
        />
        <HeroStat
          label="Revenue Impact"
          value={`$${summary.revenueUsd.toFixed(2)}`}
          icon={DollarSign}
          color="text-chart-5"
          subtext={`At $${REVENUE_PER_KWH.toFixed(2)}/kWh`}
        />
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-chart-4" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Network Status</span>
          </div>
          <div className="mt-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Nodes</span>
              <span className="font-bold text-accent">{summary.activeNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Nodes</span>
              <span className="font-bold text-foreground">{summary.totalNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warning / Critical</span>
              <span className="font-bold text-primary">{summary.warningNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Node Health</span>
              <span className="font-bold text-foreground">{summary.avgNodeHealth.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="mb-3 block text-xs font-mono uppercase tracking-widest text-muted-foreground">Live Energy Generation</span>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="analyticsEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185,85%,50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185,85%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="energy" name="Energy kWh" stroke="hsl(185,85%,50%)" fill="url(#analyticsEnergy)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <span className="mb-3 block text-xs font-mono uppercase tracking-widest text-muted-foreground">Carbon Offset Trend</span>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="analyticsCarbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142,70%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142,70%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="carbon" name="Carbon kg" stroke="hsl(142,70%,45%)" fill="url(#analyticsCarbon)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <span className="mb-3 block text-xs font-mono uppercase tracking-widest text-muted-foreground">Vehicle Passes</span>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="passes" name="Passes" fill="hsl(32,95%,54%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <span className="mb-3 block text-xs font-mono uppercase tracking-widest text-muted-foreground">Efficiency Trend</span>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="efficiency" name="Efficiency %" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
