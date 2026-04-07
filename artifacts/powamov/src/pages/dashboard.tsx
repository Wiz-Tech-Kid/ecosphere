import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Zap, Activity, Leaf, Globe2, Calculator, Radio,
  ArrowRight, Cpu, Wrench, BarChart3, Wind,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import BW_2024 from "@/data/BW_2024_monthly.json";
import ZA_2024 from "@/data/ZA_2024_monthly.json";
import { usePowamovSimulationBootstrap, usePowamovSimulationStore } from "@/stores/powamovSimulationStore";

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function KpiCard({ label, value, unit, icon: Icon, color, subtext, href }: {
  label: string; value: string | number; unit?: string;
  icon: React.ElementType; color: string; subtext?: string; href?: string;
}) {
  const content = (
    <div className={`bg-card border border-border rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group transition-all ${href ? "hover:border-primary/30 cursor-pointer" : ""}`}>
      <div className="absolute top-0 right-0 w-14 h-14 rounded-bl-full opacity-[0.06]" style={{ background: color }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground mb-0.5">{unit}</span>}
      </div>
      {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
      {href && (
        <div className="flex items-center gap-1 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color }}>
          Open <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function QuickNavCard({ href, icon: Icon, title, desc, color }: {
  href: string; icon: React.ElementType; title: string; desc: string; color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        variants={fadeIn}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:border-primary/30 transition-all group"
      >
        <div className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
      </motion.div>
    </Link>
  );
}

export default function Dashboard() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const livePowerKw = usePowamovSimulationStore((state) => state.livePowerKw);

  const bwData = BW_2024 as any[];
  const zaData = ZA_2024 as any[];

  const powamov = useMemo(() => {
    const runtimes = Object.values(nodeRuntimeById);
    const totalEnergyHarvestedKwh = runtimes.reduce((sum, runtime) => sum + runtime.liveEnergyWh / 1000, 0);
    const carbonOffsetKg = runtimes.reduce((sum, runtime) => sum + runtime.liveCo2OffsetKg, 0);
    const totalVehiclePasses = runtimes.reduce((sum, runtime) => sum + runtime.liveVehiclePasses, 0);
    const totalNodesOnline = runtimes.filter((runtime) => runtime.status === "healthy").length;
    const totalNodesWarning = runtimes.filter((runtime) => runtime.status === "warning").length;
    const totalNodesOffline = runtimes.filter((runtime) => runtime.status === "critical").length;

    return {
      currentPowerOutputW: livePowerKw * 1000,
      todayEnergyKwh: totalEnergyHarvestedKwh,
      carbonOffsetKg,
      co2SavedTons: carbonOffsetKg / 1000,
      totalNodesOnline,
      totalNodesWarning,
      totalNodesOffline,
      totalEnergyHarvestedKwh,
      treesEquivalent: Math.round(carbonOffsetKg * 0.06),
      totalVehiclePasses,
    };
  }, [livePowerKw, nodeRuntimeById]);

  const intensityChart = useMemo(() =>
    bwData.map((bw, i) => ({
      month: MONTHS[i],
      bw: Number(bw["Carbon intensity gCO₂eq"]?.["kWh (direct)"]?.toFixed(1) ?? 0),
      za: Number(zaData[i]?.["Carbon intensity gCO₂eq"]?.["kWh (direct)"]?.toFixed(1) ?? 0),
    })), []);

  const bwAvg = bwData.reduce((s, e) => s + (e["Carbon intensity gCO₂eq"]?.["kWh (direct)"] ?? 0), 0) / bwData.length;
  const zaAvg = zaData.reduce((s, e) => s + (e["Carbon intensity gCO₂eq"]?.["kWh (direct)"] ?? 0), 0) / zaData.length;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">ECOSPHERE 2.0</span>
            <span className="text-xs font-mono text-muted-foreground">Powered by POWAMOV</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-foreground tracking-wide">Intelligence Overview</h1>
          <p className="text-sm text-muted-foreground">Infrastructure energy + regional carbon analytics — unified</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-accent/20 rounded-md">
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse" />
          <span className="text-xs font-mono text-accent">LIVE</span>
        </div>
      </motion.div>

      <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="POWAMOV Output"
          value={powamov.currentPowerOutputW ? (powamov.currentPowerOutputW / 1000).toFixed(3) : "—"}
          unit="kW"
          icon={Zap}
          color="#22d3ee"
          subtext="Live kinetic harvest"
          href="/command"
        />
        <KpiCard
          label="Energy Today"
          value={powamov.todayEnergyKwh.toFixed(3)}
          unit="kWh"
          icon={Activity}
          color="#34d399"
          subtext="Rolling 24h generation"
          href="/analytics"
        />
        <KpiCard
          label="Carbon Offset"
          value={powamov.carbonOffsetKg.toFixed(3)}
          unit="kg CO₂"
          icon={Leaf}
          color="#4ade80"
          subtext={`${powamov.co2SavedTons.toFixed(3)} tons saved`}
          href="/analytics"
        />
        <KpiCard
          label="Nodes Online"
          value={`${powamov.totalNodesOnline}/${powamov.totalNodesOnline + powamov.totalNodesOffline + powamov.totalNodesWarning || simulation?.totals.nodeCount || 0}`}
          icon={Activity}
          color="#22d3ee"
          subtext={`${powamov.totalNodesWarning} warning`}
          href="/command"
        />
      </motion.div>

      <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="BW Grid Intensity"
          value={bwAvg.toFixed(0)}
          unit="gCO₂/kWh"
          icon={Wind}
          color="#f59e0b"
          subtext="2024 average"
          href="/carbon-analytics"
        />
        <KpiCard
          label="ZA Grid Intensity"
          value={zaAvg.toFixed(0)}
          unit="gCO₂/kWh"
          icon={Wind}
          color="#22d3ee"
          subtext="2024 average"
          href="/carbon-analytics"
        />
        <KpiCard
          label="Total Harvested"
          value={powamov.totalEnergyHarvestedKwh.toFixed(3)}
          unit="kWh"
          icon={Zap}
          color="#a78bfa"
          subtext="All-time POWAMOV"
          href="/analytics"
        />
        <KpiCard
          label="Trees Equivalent"
          value={powamov.treesEquivalent.toLocaleString()}
          icon={Leaf}
          color="#4ade80"
          subtext="Carbon sequestration equiv."
          href="/analytics"
        />
      </motion.div>

      <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">BW vs ZA Grid Carbon Intensity — 2024</span>
          </div>
          <Link href="/carbon-analytics">
            <span className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
              Full Analytics <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={intensityChart}>
            <defs>
              <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="zaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
            <YAxis domain={[580, 800]} tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(222,30%,15%)", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="bw" name="Botswana (gCO₂/kWh)" stroke="#f59e0b" fill="url(#bwGrad)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="za" name="South Africa (gCO₂/kWh)" stroke="#22d3ee" fill="url(#zaGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={fadeIn}>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Navigate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickNavCard
            href="/command"
            icon={Activity}
            title="POWAMOV Command Center"
            desc="Live node map, real-time telemetry, infrastructure status"
            color="#22d3ee"
          />
          <QuickNavCard
            href="/digital-twin"
            icon={Cpu}
            title="Digital Twin Simulation"
            desc="Vertical node-strip simulation with random traffic generation"
            color="#a78bfa"
          />
          <QuickNavCard
            href="/maintenance"
            icon={Wrench}
            title="Predictive Maintenance"
            desc="Node and strip drill-down with live health thresholds"
            color="#f59e0b"
          />
          <QuickNavCard
            href="/carbon-analytics"
            icon={Globe2}
            title="Regional Carbon Analytics"
            desc="BW & ZA grid carbon intensity, renewable mix, 2023–2024"
            color="#f59e0b"
          />
          <QuickNavCard
            href="/calculator"
            icon={Calculator}
            title="Enterprise Carbon Calculator"
            desc="Scope 1, 2 & 3 emissions — African regional emission factors"
            color="#22d3ee"
          />
          <QuickNavCard
            href="/tracker"
            icon={Radio}
            title="Emission Tracker"
            desc="Real-time emission simulation + Botswana regional data"
            color="#34d399"
          />
          <QuickNavCard
            href="/analytics"
            icon={BarChart3}
            title="Energy Analytics"
            desc="POWAMOV harvest performance, carbon offset, grid contribution"
            color="#4ade80"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
