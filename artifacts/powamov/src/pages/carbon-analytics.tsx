import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Globe2, TrendingDown, TrendingUp, Wind, Zap } from "lucide-react";

import BW_2023 from "@/data/BW_2023_monthly.json";
import ZA_2023 from "@/data/ZA_2023_monthly.json";
import BW_2024 from "@/data/BW_2024_monthly.json";
import ZA_2024 from "@/data/ZA_2024_monthly.json";

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

type YearKey = "2023" | "2024";

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

function StatCard({ label, value, unit, icon: Icon, color, subtext, trend }: {
  label: string; value: string | number; unit?: string;
  icon: React.ElementType; color: string; subtext?: string; trend?: "up" | "down";
}) {
  return (
    <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-5 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-5" style={{ background: color }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
        {trend && (
          trend === "up"
            ? <TrendingUp className="h-3.5 w-3.5 text-destructive mb-0.5" />
            : <TrendingDown className="h-3.5 w-3.5 text-accent mb-0.5" />
        )}
      </div>
      {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </motion.div>
  );
}

export default function CarbonAnalytics() {
  const [year, setYear] = useState<YearKey>("2024");

  const { bwData, zaData } = useMemo(() => {
    const bw = year === "2023" ? BW_2023 : BW_2024;
    const za = year === "2023" ? ZA_2023 : ZA_2024;
    return { bwData: bw as any[], zaData: za as any[] };
  }, [year]);

  const monthlyData = useMemo(() =>
    bwData.map((bw, i) => {
      const za = zaData[i];
      return {
        month: MONTHS[i] ?? `M${i + 1}`,
        bwIntensity: Number(bw["Carbon intensity gCO₂eq"]?.["kWh (direct)"]?.toFixed(1) ?? 0),
        zaIntensity: Number(za?.["Carbon intensity gCO₂eq"]?.["kWh (direct)"]?.toFixed(1) ?? 0),
        bwRE: Number(bw["Renewable energy percentage (RE%)"]?.toFixed(2) ?? 0),
        zaRE: Number(za?.["Renewable energy percentage (RE%)"]?.toFixed(2) ?? 0),
        bwCFE: Number(bw["Carbon-free energy percentage (CFE%)"]?.toFixed(2) ?? 0),
        zaCFE: Number(za?.["Carbon-free energy percentage (CFE%)"]?.toFixed(2) ?? 0),
      };
    }), [bwData, zaData]);

  const bwAvgIntensity = avg(bwData.map(e => e["Carbon intensity gCO₂eq"]?.["kWh (direct)"] ?? 0));
  const zaAvgIntensity = avg(zaData.map(e => e["Carbon intensity gCO₂eq"]?.["kWh (direct)"] ?? 0));
  const bwAvgRE = avg(bwData.map(e => e["Renewable energy percentage (RE%)"] ?? 0));
  const zaAvgRE = avg(zaData.map(e => e["Renewable energy percentage (RE%)"] ?? 0));
  const bwAvgCFE = avg(bwData.map(e => e["Carbon-free energy percentage (CFE%)"] ?? 0));
  const zaAvgCFE = avg(zaData.map(e => e["Carbon-free energy percentage (CFE%)"] ?? 0));

  const barData = [
    { country: "Botswana", intensity: Number(bwAvgIntensity.toFixed(1)), fill: "#f59e0b" },
    { country: "South Africa", intensity: Number(zaAvgIntensity.toFixed(1)), fill: "#22d3ee" },
  ];

  const pieData = [
    { name: "BW Renewable", value: Number(bwAvgRE.toFixed(2)), color: "#f59e0b" },
    { name: "BW Non-Renewable", value: Number((100 - bwAvgRE).toFixed(2)), color: "#78350f" },
    { name: "ZA Renewable", value: Number(zaAvgRE.toFixed(2)), color: "#22d3ee" },
    { name: "ZA Non-Renewable", value: Number((100 - zaAvgRE).toFixed(2)), color: "#164e63" },
  ];

  const cleaner = zaAvgIntensity < bwAvgIntensity ? "South Africa" : "Botswana";
  const diff = Math.abs(bwAvgIntensity - zaAvgIntensity).toFixed(1);

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-foreground tracking-wide">Regional Carbon Analytics</h1>
          <p className="text-sm text-muted-foreground">Live grid carbon intensity — Botswana & South Africa</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {(["2023", "2024"] as YearKey[]).map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 rounded-md text-sm font-mono font-medium transition-all ${
                year === y
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="BW Avg Intensity"
          value={bwAvgIntensity.toFixed(0)}
          unit="gCO₂/kWh"
          icon={Zap}
          color="#f59e0b"
          subtext={`${year} annual average`}
          trend="up"
        />
        <StatCard
          label="ZA Avg Intensity"
          value={zaAvgIntensity.toFixed(0)}
          unit="gCO₂/kWh"
          icon={Zap}
          color="#22d3ee"
          subtext={`${year} annual average`}
          trend="up"
        />
        <StatCard
          label="BW Renewable %"
          value={bwAvgRE.toFixed(2)}
          unit="%"
          icon={Wind}
          color="#f59e0b"
          subtext="Avg renewable energy share"
        />
        <StatCard
          label="ZA Renewable %"
          value={zaAvgRE.toFixed(2)}
          unit="%"
          icon={Wind}
          color="#22d3ee"
          subtext="Avg renewable energy share"
        />
      </motion.div>

      <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Regional Insight</span>
        </div>
        <p className="text-sm text-foreground">
          <span className="text-primary font-mono font-bold">{cleaner}</span> runs a cleaner grid in {year},
          with a carbon intensity difference of <span className="text-accent font-mono font-bold">{diff} gCO₂eq/kWh</span>.
          {" "}Botswana averages <span className="font-mono text-yellow-400">{bwAvgCFE.toFixed(2)}%</span> carbon-free energy
          vs. South Africa's <span className="font-mono text-cyan-400">{zaAvgCFE.toFixed(2)}%</span>.
          Both grids remain coal-heavy with minimal renewable penetration — POWAMOV road nodes provide a tangible offset opportunity.
        </p>
      </motion.div>

      <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-4">Monthly Carbon Intensity Comparison — {year}</span>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} domain={[500, 900]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
            <Bar dataKey="bwIntensity" name="Botswana gCO₂/kWh" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="zaIntensity" name="South Africa gCO₂/kWh" fill="#22d3ee" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-4">Carbon-Free Energy % — {year}</span>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="bwCFEGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="zaCFEGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="bwCFE" name="BW CFE %" stroke="#f59e0b" fill="url(#bwCFEGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="zaCFE" name="ZA CFE %" stroke="#22d3ee" fill="url(#zaCFEGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-4">Avg Carbon Intensity Comparison</span>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} layout="vertical" barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
              <YAxis dataKey="country" type="category" tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="intensity" name="gCO₂/kWh" radius={[0, 3, 3, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Energy Mix Breakdown</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { label: "BW Renewable", value: `${bwAvgRE.toFixed(2)}%`, color: "#f59e0b" },
                { label: "ZA Renewable", value: `${zaAvgRE.toFixed(2)}%`, color: "#22d3ee" },
                { label: "BW Non-Renewable", value: `${(100 - bwAvgRE).toFixed(2)}%`, color: "#78350f" },
                { label: "ZA Non-Renewable", value: `${(100 - zaAvgRE).toFixed(2)}%`, color: "#164e63" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.label}:</span>
                  <span style={{ color: item.color }} className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-4">POWAMOV Carbon Offset Potential (per kWh harvested)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              country: "Botswana Grid",
              intensity: bwAvgIntensity,
              color: "#f59e0b",
              example: (bwAvgIntensity * 69.1 / 1000).toFixed(2),
            },
            {
              country: "South Africa Grid",
              intensity: zaAvgIntensity,
              color: "#22d3ee",
              example: (zaAvgIntensity * 69.1 / 1000).toFixed(2),
            },
          ].map(item => (
            <div key={item.country} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: item.color }}>{item.country}</span>
                <span className="text-xs font-mono text-muted-foreground">{item.intensity.toFixed(0)} gCO₂/kWh</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Each 1 kWh harvested by POWAMOV nodes displaces{" "}
                <span className="font-mono font-bold" style={{ color: item.color }}>{item.intensity.toFixed(0)}g CO₂</span>{" "}
                from this grid. At current POWAMOV output of ~69.1 MWh total,
                that's <span className="font-mono font-bold" style={{ color: item.color }}>{item.example} tons CO₂</span> avoided.
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
