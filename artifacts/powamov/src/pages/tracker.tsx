import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import {
  Radio, Activity, MapPin, Filter, TrendingDown,
  Zap, Flame, Wind, Truck, Factory, GraduationCap, Globe,
  Thermometer, ShieldAlert, Gauge, Car, FlaskConical, Users,
  ChevronDown,
} from "lucide-react";

import BED_DATA from "@/data/B_E_D.json";
import {
  getIndustrialTelemetry, getCampusTelemetry,
  tickIndustrialPower, tickIndustrialGenerator, tickIndustrialGas,
  tickIndustrialFire, tickIndustrialHVAC, tickIndustrialFleet,
  tickCampusElectricity, tickCampusHVAC, tickCampusOccupancy,
  tickCampusVehicles, tickCampusLab,
  type IndustrialTelemetry, type CampusTelemetry,
} from "@/services/telemetryEngine";
import {
  calcIndustrialEmissions, calcCampusEmissions, getIndustrialRiskLevel,
  type IndustrialEmissions, type CampusEmissions,
} from "@/services/emissionsEngine";
import { usePowamovSimulationBootstrap, usePowamovSimulationStore } from "@/stores/powamovSimulationStore";

/* ── Enterprise palette ── */
const ENT = {
  blue:   "#4a90b8",
  green:  "#3d8a5e",
  amber:  "#c07a16",
  violet: "#7c6db5",
  red:    "#b84a4a",
  slate:  "#5a7080",
};

const STATUS_COLOR = { normal: ENT.green, warning: ENT.amber, alert: ENT.red };

type Scenario = "regional" | "industrial" | "campus";
type IntervalType = "1s" | "5s" | "30s" | "1m";
const INTERVAL_MS: Record<IntervalType, number> = { "1s": 1000, "5s": 5000, "30s": 30000, "1m": 60000 };

const BW_REGIONS    = ["Central","South East","Chobe","Ghanzi","Kgalagadi","Kweneng","North West","Southern"];
const REGION_COLORS = [ENT.blue, ENT.amber, ENT.violet, ENT.green, ENT.red, ENT.slate, "#7a9db8", "#5a8a6a"];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-[10px] font-mono shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? p.stroke }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SENSOR PANEL — shared UI atom
══════════════════════════════════════════════════════════════ */
function SensorPanel({
  icon: Icon, title, status, badge, metrics,
}: {
  icon: React.ElementType;
  title: string;
  status: "normal" | "warning" | "alert";
  badge: string;
  metrics: Array<{ label: string; value: string; unit?: string; primary?: boolean }>;
}) {
  const col = STATUS_COLOR[status];
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 transition-colors"
      style={{ borderColor: status !== "normal" ? `${col}30` : undefined }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: `${col}14` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: col }}/>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: col }}/>
          <span className="text-[9px] font-mono text-muted-foreground/60">{badge}</span>
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)` }}>
        {metrics.map((m) => (
          <div key={m.label} className="space-y-0.5">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</div>
            <div className={`font-mono font-bold ${m.primary ? "text-base" : "text-sm"}`}
              style={{ color: m.primary ? col : undefined }}>
              {m.value}
            </div>
            {m.unit && <div className="text-[9px] font-mono text-muted-foreground/60">{m.unit}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, unit, color, icon: Icon }: {
  label: string; value: string; unit: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40"/>
      </div>
      <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 1 — INDUSTRIAL (Taurus Batteries)
══════════════════════════════════════════════════════════════ */
function IndustrialView() {
  const [telemetry, setTelemetry] = useState<IndustrialTelemetry>(getIndustrialTelemetry());
  const [emissions, setEmissions] = useState<IndustrialEmissions>(calcIndustrialEmissions(getIndustrialTelemetry()));
  const [co2History, setCo2History] = useState<{ t: string; co2: number; grid: number }[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    tickRef.current = 0;
    const id = setInterval(() => {
      tickRef.current++;
      tickIndustrialGas(); tickIndustrialFire();
      if (tickRef.current % 3 === 0) { tickIndustrialPower(); tickIndustrialHVAC(); }
      if (tickRef.current % 5 === 0) { tickIndustrialGenerator(); }
      if (tickRef.current % 8 === 0) { tickIndustrialFleet(); }
      const state = getIndustrialTelemetry();
      const emis  = calcIndustrialEmissions(state);
      setTelemetry(state);
      setEmissions(emis);
      const t = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCo2History(h => [...h.slice(-29), { t, co2: emis.netCo2Kg, grid: emis.gridCo2Kg }]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const risk = getIndustrialRiskLevel(telemetry);
  const gasStatus = telemetry.gas.hydrogenPpm > 65 ? "alert" : telemetry.gas.hydrogenPpm > 40 ? "warning" : "normal";
  const fireStatus = telemetry.fire.smokeLevelPct > 20 ? "alert" : telemetry.fire.smokeLevelPct > 12 ? "warning" : "normal";
  const powerStatus = telemetry.power.machineLoadPct > 94 ? "alert" : telemetry.power.machineLoadPct > 85 ? "warning" : "normal";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-bold text-foreground">Taurus Batteries — Industrial Facility</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border font-semibold"
              style={{ color: STATUS_COLOR[risk], borderColor: `${STATUS_COLOR[risk]}30`, background: `${STATUS_COLOR[risk]}0c` }}>
              {risk.toUpperCase()}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">Live sensor telemetry · 6 sensor groups · 2–15s update cycle</div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-destructive"/>
          LIVE
        </div>
      </div>

      {/* CO₂ KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Grid CO₂"    value={emissions.gridCo2Kg.toFixed(1)}  unit="kg/hr"       color={ENT.amber}  icon={Zap}/>
        <KpiCard label="Diesel CO₂"  value={emissions.dieselCo2Kg.toFixed(1)} unit="kg/hr"      color={ENT.red}    icon={Flame}/>
        <KpiCard label="POWAMOV Offset" value={emissions.offsetKg.toFixed(2)} unit="kg avoided" color={ENT.green}  icon={Activity}/>
        <KpiCard label="Net CO₂"     value={emissions.netCo2Kg.toFixed(1)}   unit="kg/hr"       color={ENT.violet} icon={TrendingDown}/>
      </div>

      {/* Sensor panels 2x3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SensorPanel icon={Zap} title="Power Monitoring" status={powerStatus} badge="5s"
          metrics={[
            { label: "Total Usage",   value: telemetry.power.totalKwh.toFixed(0),       unit: "kWh",   primary: true },
            { label: "Machine Load",  value: `${telemetry.power.machineLoadPct.toFixed(1)}%`,  unit: "%" },
            { label: "Peak Demand",   value: telemetry.power.peakDemandKw.toFixed(0),   unit: "kW" },
          ]}/>
        <SensorPanel icon={Factory} title="Generator" status="normal" badge="10s"
          metrics={[
            { label: "Status",   value: telemetry.generator.isOn ? "RUNNING" : "STANDBY", primary: true },
            { label: "Diesel",   value: telemetry.generator.dieselLitres.toFixed(1),     unit: "L" },
            { label: "Runtime",  value: telemetry.generator.runtimeHrs.toFixed(1),       unit: "hrs" },
          ]}/>
        <SensorPanel icon={ShieldAlert} title="Gas Detection" status={gasStatus} badge="2s"
          metrics={[
            { label: "Hydrogen",  value: `${telemetry.gas.hydrogenPpm.toFixed(0)}`,  unit: "ppm",  primary: true },
            { label: "Chemical",  value: telemetry.gas.chemicalIndex.toFixed(0),      unit: "idx" },
            { label: "AQI",       value: telemetry.gas.aqi.toFixed(0),               unit: "AQI" },
          ]}/>
        <SensorPanel icon={Flame} title="Fire / Smoke" status={fireStatus} badge="2s"
          metrics={[
            { label: "Smoke Level", value: `${telemetry.fire.smokeLevelPct.toFixed(1)}%`, primary: true },
            { label: "Heat",        value: `${telemetry.fire.heatC.toFixed(1)}°C`, unit: "°C" },
          ]}/>
        <SensorPanel icon={Wind} title="Industrial HVAC" status="normal" badge="5s"
          metrics={[
            { label: "Ventilation", value: `${telemetry.hvac.ventilationPct.toFixed(0)}%`, primary: true },
            { label: "Cooling Load", value: telemetry.hvac.coolingKw.toFixed(1), unit: "kW" },
          ]}/>
        <SensorPanel icon={Truck} title="Fleet / Logistics" status="normal" badge="15s"
          metrics={[
            { label: "Trucks Entered",   value: telemetry.fleet.trucksEntered.toString(), primary: true },
            { label: "Forklifts Active", value: telemetry.fleet.forkliftActive.toString() },
          ]}/>
      </div>

      {/* CO₂ chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"/>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live Facility CO₂ Emissions (kg/hr)</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">{co2History.length}/30 samples</span>
        </div>
        {co2History.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-mono">Collecting data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={co2History}>
              <defs>
                <linearGradient id="indCo2G" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ENT.amber} stopOpacity={0.18}/>
                  <stop offset="95%" stopColor={ENT.amber} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="indGridG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ENT.blue} stopOpacity={0.14}/>
                  <stop offset="95%" stopColor={ENT.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={5}/>
              <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={36}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="grid" name="Grid CO₂" stroke={ENT.blue}  fill="url(#indGridG)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="co2"  name="Net CO₂"  stroke={ENT.amber} fill="url(#indCo2G)"  strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 2 — CAMPUS (Botho University)
══════════════════════════════════════════════════════════════ */
function CampusView() {
  const [telemetry, setTelemetry] = useState<CampusTelemetry>(getCampusTelemetry());
  const [emissions, setEmissions] = useState<CampusEmissions>(calcCampusEmissions(getCampusTelemetry()));
  const [co2History, setCo2History] = useState<{ t: string; co2: number; kwh: number }[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    tickRef.current = 0;
    const id = setInterval(() => {
      tickRef.current++;
      tickCampusLab();
      if (tickRef.current % 2 === 0) { tickCampusElectricity(); tickCampusHVAC(); }
      if (tickRef.current % 4 === 0) { tickCampusOccupancy(); tickCampusVehicles(); }
      const state = getCampusTelemetry();
      const emis  = calcCampusEmissions(state);
      setTelemetry(state);
      setEmissions(emis);
      const t = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCo2History(h => [...h.slice(-29), { t, co2: emis.netCo2Kg, kwh: emis.totalKwh }]);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const labGasStatus = telemetry.lab.gasPpm > 40 ? "alert" : telemetry.lab.gasPpm > 25 ? "warning" : "normal";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-bold text-foreground">Botho University — Institutional Campus</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Campus-wide telemetry · 5 sensor groups · 5–20s update cycle</div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ENT.blue }}/>
          LIVE
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Campus CO₂"   value={emissions.co2Kg.toFixed(1)}         unit="kg/hr"          color={ENT.amber}  icon={Activity}/>
        <KpiCard label="Total Usage"  value={emissions.totalKwh.toFixed(0)}       unit="kWh"            color={ENT.blue}   icon={Zap}/>
        <KpiCard label="Students"     value={telemetry.occupancy.students.toLocaleString()} unit="active" color={ENT.violet} icon={Users}/>
        <KpiCard label="Per Student"  value={emissions.perStudentGco2.toFixed(0)} unit="gCO₂ / student" color={ENT.green}  icon={TrendingDown}/>
      </div>

      {/* Sensor panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SensorPanel icon={Zap} title="Electricity Monitoring" status="normal" badge="10s"
          metrics={[
            { label: "Building Power", value: telemetry.electricity.buildingKwh.toFixed(0), unit: "kWh", primary: true },
            { label: "Lab Power",      value: telemetry.electricity.labKwh.toFixed(0),      unit: "kWh" },
          ]}/>
        <SensorPanel icon={Wind} title="HVAC Systems" status="normal" badge="10s"
          metrics={[
            { label: "Lecture Halls", value: `${telemetry.hvac.lectureHallsPct.toFixed(0)}%`, primary: true },
            { label: "Labs",          value: `${telemetry.hvac.labsPct.toFixed(0)}%` },
            { label: "Offices",       value: `${telemetry.hvac.officesPct.toFixed(0)}%` },
          ]}/>
        <SensorPanel icon={Users} title="Occupancy" status="normal" badge="20s"
          metrics={[
            { label: "Students",          value: telemetry.occupancy.students.toLocaleString(), primary: true },
            { label: "Buildings Active",  value: `${telemetry.occupancy.buildingsActive}/12` },
          ]}/>
        <SensorPanel icon={Car} title="Campus Vehicles" status="normal" badge="20s"
          metrics={[
            { label: "Security",     value: telemetry.vehicles.security.toString(), primary: true },
            { label: "Maintenance",  value: telemetry.vehicles.maintenance.toString() },
          ]}/>
        <SensorPanel icon={FlaskConical} title="Lab Monitoring" status={labGasStatus} badge="5s"
          metrics={[
            { label: "Gas Sensors", value: `${telemetry.lab.gasPpm.toFixed(1)} ppm`, primary: true },
            { label: "Temperature", value: `${telemetry.lab.tempC.toFixed(1)}°C` },
          ]}/>

        {/* POWAMOV offset summary */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3"
          style={{ borderColor: `${ENT.green}28` }}>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded flex items-center justify-center" style={{ background: `${ENT.green}14` }}>
              <Activity className="h-3.5 w-3.5" style={{ color: ENT.green }}/>
            </div>
            <span className="text-xs font-mono font-bold text-foreground">POWAMOV Offset</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Offset",    value: `${emissions.offsetKg.toFixed(2)} kg`, color: ENT.green },
              { label: "Net CO₂",  value: `${emissions.netCo2Kg.toFixed(1)} kg`, color: ENT.amber },
              { label: "Intensity", value: `${emissions.intensityGco2Kwh.toFixed(0)} gCO₂/kWh`, color: ENT.slate },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-baseline text-[10px] font-mono">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-bold" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CO₂ chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ENT.blue }}/>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Campus CO₂ & Energy (5s interval)</span>
          </div>
        </div>
        {co2History.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-mono">Collecting data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={co2History}>
              <defs>
                <linearGradient id="campCo2G" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ENT.amber} stopOpacity={0.18}/>
                  <stop offset="95%" stopColor={ENT.amber} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="campKwhG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ENT.blue} stopOpacity={0.14}/>
                  <stop offset="95%" stopColor={ENT.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={5}/>
              <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={36}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="kwh" name="Energy (kWh)" stroke={ENT.blue}  fill="url(#campKwhG)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="co2" name="Net CO₂ (kg)" stroke={ENT.amber} fill="url(#campCo2G)" strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 3 — REGIONAL DATASET (existing, preserved)
══════════════════════════════════════════════════════════════ */
function RegionalView() {
  const [interval, setIntervalType] = useState<IntervalType>("5s");
  const [realTimeData, setRealTimeData] = useState<{ time: string; emissions: number }[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(BW_REGIONS);
  const [chartMode, setChartMode] = useState<"bar" | "pie">("bar");
  const lastEmission = useRef(300 + Math.random() * 200);

  useEffect(() => {
    const id = setInterval(() => {
      const drift = (Math.random() - 0.48) * 30;
      lastEmission.current = Math.max(20, Math.min(965, lastEmission.current + drift));
      setRealTimeData(prev => [...prev.slice(-30), {
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        emissions: Number(lastEmission.current.toFixed(1)),
      }]);
    }, INTERVAL_MS[interval]);
    return () => clearInterval(id);
  }, [interval]);

  const regionalData = useMemo(() => {
    const bedRaw = BED_DATA as Array<{ Region: string; CarbonIntensity_gCO2eq_kWh: number; RE_Percentage: number }>;
    return BW_REGIONS.filter(r => selectedRegions.includes(r)).map(region => {
      const rows = bedRaw.filter(r => r.Region === region);
      return {
        region,
        avgIntensity: Number((rows.reduce((s, r) => s + r.CarbonIntensity_gCO2eq_kWh, 0) / (rows.length || 1)).toFixed(1)),
        avgRE:        Number((rows.reduce((s, r) => s + r.RE_Percentage, 0) / (rows.length || 1)).toFixed(1)),
      };
    });
  }, [selectedRegions]);

  const pieData = useMemo(() => regionalData.map((r) => ({
    name: r.region,
    value: r.avgIntensity,
    color: REGION_COLORS[BW_REGIONS.indexOf(r.region) % REGION_COLORS.length],
  })), [regionalData]);

  const current = realTimeData[realTimeData.length - 1]?.emissions ?? 0;
  const trend   = realTimeData.length > 2
    ? realTimeData[realTimeData.length - 1].emissions - realTimeData[realTimeData.length - 2].emissions
    : 0;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Live Emission", value: current.toFixed(1), unit: "gCO₂/kWh",
            color: current > 700 ? ENT.red : current > 400 ? ENT.amber : ENT.green, icon: Radio },
          { label: "Trend", value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}`, unit: "gCO₂",
            color: trend > 0 ? ENT.red : ENT.green, icon: Activity },
          { label: "Avg (session)", unit: "gCO₂/kWh",
            value: realTimeData.length > 0 ? (realTimeData.reduce((s, p) => s + p.emissions, 0) / realTimeData.length).toFixed(1) : "—",
            color: ENT.blue, icon: TrendingDown },
          { label: "Data Points", value: String(realTimeData.length), unit: "samples", color: ENT.violet, icon: Filter },
        ].map(s => <KpiCard key={s.label} label={s.label} value={s.value} unit={s.unit} color={s.color} icon={s.icon}/>)}
      </div>

      {/* Update interval */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">Update interval:</span>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {(Object.keys(INTERVAL_MS) as IntervalType[]).map(i => (
            <button key={i} onClick={() => setIntervalType(i)}
              className={`px-3 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                interval === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Live chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"/>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live Emission Feed</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">{realTimeData.length}/30 points</span>
        </div>
        {realTimeData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Waiting for data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={realTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4}/>
              <YAxis domain={[0, 1000]} tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="emissions" name="gCO₂/kWh" stroke={ENT.blue}
                strokeWidth={1.5} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Regional chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary"/>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Botswana Regional Carbon Intensity</span>
          </div>
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
            {(["bar", "pie"] as const).map(m => (
              <button key={m} onClick={() => setChartMode(m)}
                className={`px-3 py-1 rounded-md text-[10px] font-mono transition-all ${
                  chartMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BW_REGIONS.map((r, i) => (
            <button key={r}
              onClick={() => setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
              className="px-2.5 py-1 rounded-md text-[10px] font-mono border transition-all"
              style={selectedRegions.includes(r) ? {
                borderColor: REGION_COLORS[i] + "70",
                backgroundColor: REGION_COLORS[i] + "14",
                color: REGION_COLORS[i],
              } : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}>
              {r}
            </button>
          ))}
        </div>
        {chartMode === "bar" ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionalData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="region" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40}/>
              <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="avgIntensity" name="Avg Intensity (gCO₂/kWh)" radius={[3,3,0,0]}>
                {regionalData.map((_, i) => <Cell key={i} fill={REGION_COLORS[BW_REGIONS.indexOf(_.region) % REGION_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)} gCO₂/kWh`, "Avg Intensity"]}
                  contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(222,30%,15%)", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 min-w-[180px]">
              {pieData.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }}/>
                  <span className="text-muted-foreground truncate">{e.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RE% chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-3">Regional Renewable Energy %</span>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={regionalData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="region" tick={{ fontSize: 8, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40}/>
            <YAxis tick={{ fontSize: 9, fill: "#7a8898", fontFamily: "monospace" }} tickLine={false} axisLine={false} unit="%"/>
            <Tooltip content={<ChartTip/>}/>
            <Bar dataKey="avgRE" name="Renewable %" radius={[3,3,0,0]}>
              {regionalData.map((_, i) => <Cell key={i} fill={REGION_COLORS[BW_REGIONS.indexOf(_.region) % REGION_COLORS.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT — Scenario Selector + Routing
══════════════════════════════════════════════════════════════ */

const SCENARIOS: Array<{
  id: Scenario; label: string; sub: string; icon: React.ElementType; color: string;
}> = [
  { id: "regional",    label: "Regional Dataset",         sub: "Botswana · South Africa",  icon: Globe,          color: ENT.blue   },
  { id: "industrial",  label: "Industrial Facility",      sub: "Taurus Batteries",          icon: Factory,        color: ENT.amber  },
  { id: "campus",      label: "Institutional Campus",     sub: "Botho University",          icon: GraduationCap,  color: ENT.violet },
];

export default function TelemetryEngine() {
  const [scenario, setScenario] = useState<Scenario>("regional");
  const active = SCENARIOS.find(s => s.id === scenario)!;
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

  usePowamovSimulationBootstrap(mapboxToken);

  const simulation = usePowamovSimulationStore((state) => state.simulation);
  const nodeRuntimeById = usePowamovSimulationStore((state) => state.nodeRuntimeById);
  const livePowerKw = usePowamovSimulationStore((state) => state.livePowerKw);

  const powamovMetrics = useMemo(() => {
    const runtimes = Object.values(nodeRuntimeById);
    return {
      livePowerKw,
      energyKwh: runtimes.reduce((sum, runtime) => sum + runtime.liveEnergyWh / 1000, 0),
      carbonOffsetKg: runtimes.reduce((sum, runtime) => sum + runtime.liveCo2OffsetKg, 0),
      passes: runtimes.reduce((sum, runtime) => sum + runtime.liveVehiclePasses, 0),
      activeNodes: runtimes.filter((runtime) => runtime.liveCompressionEvents > 0 || runtime.liveVehiclePasses > 0).length,
      totalNodes: simulation?.totals.nodeCount ?? runtimes.length,
    };
  }, [livePowerKw, nodeRuntimeById, simulation]);

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded uppercase tracking-widest">
              Telemetry Engine
            </span>
            <span className="text-[9px] font-mono text-primary/60">v2.1</span>
          </div>
          <h1 className="text-xl font-bold font-mono text-foreground">Real-Time Emission Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Multi-scenario IoT simulation · Select a data source below</p>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "POWAMOV Live Power", value: `${powamovMetrics.livePowerKw.toFixed(3)} kW`, color: ENT.blue },
          { label: "Deployment Energy", value: `${powamovMetrics.energyKwh.toFixed(3)} kWh`, color: ENT.green },
          { label: "CO2 Offset", value: `${powamovMetrics.carbonOffsetKg.toFixed(3)} kg`, color: ENT.amber },
          { label: "Tracked Nodes", value: `${powamovMetrics.activeNodes}/${powamovMetrics.totalNodes}`, color: ENT.violet },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{item.label}</span>
            <span className="text-2xl font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
            <span className="text-[10px] text-muted-foreground">
              {item.label === "CO2 Offset"
                ? `${powamovMetrics.passes.toLocaleString()} simulated vehicle passes`
                : "Shared from the POWAMOV node-strip simulation store"}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Scenario selector */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCENARIOS.map((s) => {
          const isActive = scenario === s.id;
          return (
            <button key={s.id} onClick={() => setScenario(s.id)}
              className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all"
              style={isActive ? {
                borderColor: `${s.color}50`,
                background: `${s.color}0a`,
              } : {
                borderColor: "hsl(var(--border))",
              }}>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? `${s.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? s.color + "35" : "rgba(255,255,255,0.08)"}` }}>
                <s.icon className="h-4.5 w-4.5" style={{ color: isActive ? s.color : "#7a8898" }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono font-bold truncate" style={{ color: isActive ? s.color : "hsl(var(--foreground))" }}>
                  {s.label}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{s.sub}</div>
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: s.color }}/>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Scenario content */}
      <motion.div variants={fadeIn}>
        <AnimatePresence mode="wait">
          {scenario === "regional" && (
            <motion.div key="regional" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <RegionalView/>
            </motion.div>
          )}
          {scenario === "industrial" && (
            <motion.div key="industrial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <IndustrialView/>
            </motion.div>
          )}
          {scenario === "campus" && (
            <motion.div key="campus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <CampusView/>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
