import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Calculator, Flame, Zap, Plane, Trash2, Save, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

const FACTORS = {
  diesel: 2.70,
  water: 0.002,
  electricity: {
    SOUTHERN_AFRICA: 0.920,
    MIDDLE_AFRICA: 0.850,
    EASTERN_AFRICA: 0.740,
    WESTERN_AFRICA: 0.880,
    NORTHERN_AFRICA: 0.610,
  } as Record<string, number>,
  flights: 0.18,
  commuting: 0.12,
  waste: 0.1,
  packaging: 0.25,
};

type Region = keyof typeof FACTORS.electricity;

const REGIONS: { value: Region; label: string }[] = [
  { value: "SOUTHERN_AFRICA", label: "Southern Africa" },
  { value: "MIDDLE_AFRICA", label: "Middle Africa" },
  { value: "EASTERN_AFRICA", label: "Eastern Africa" },
  { value: "WESTERN_AFRICA", label: "Western Africa" },
  { value: "NORTHERN_AFRICA", label: "Northern Africa" },
];

interface Results {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  breakdown: { name: string; value: number; color: string }[];
}

function ScopeSection({ title, icon: Icon, color, children, open, onToggle }: {
  title: string; icon: React.ElementType; color: string;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-sidebar-accent/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="font-mono font-medium text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 border-t border-border"
        >
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InputField({ label, name, value, unit, onChange }: {
  label: string; name: string; value: number; unit: string;
  onChange: (name: string, value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        <input
          type="number"
          min="0"
          value={value || ""}
          onChange={e => onChange(name, parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors pr-14"
        />
        <span className="absolute right-3 text-xs font-mono text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export default function CarbonCalculator() {
  const [openScope, setOpenScope] = useState<number>(1);
  const [region, setRegion] = useState<Region>("SOUTHERN_AFRICA");
  const [inputs, setInputs] = useState({
    dieselLitres: 0,
    waterConsumption: 0,
    electricityKwh: 0,
    businessTravelKm: 0,
    employeeCommutingKm: 0,
    wasteKg: 0,
    packagingKg: 0,
  });
  const [results, setResults] = useState<Results | null>(null);
  const [scenarios, setScenarios] = useState<{ name: string; date: string; total: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("e2_calculator_scenarios") || "[]"); } catch { return []; }
  });

  const handleChange = (name: string, value: number) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const calculate = () => {
    const scope1 = inputs.dieselLitres * FACTORS.diesel + inputs.waterConsumption * FACTORS.water;
    const scope2 = inputs.electricityKwh * FACTORS.electricity[region];
    const scope3 =
      inputs.businessTravelKm * FACTORS.flights +
      inputs.employeeCommutingKm * FACTORS.commuting +
      inputs.wasteKg * FACTORS.waste +
      inputs.packagingKg * FACTORS.packaging;
    const total = scope1 + scope2 + scope3;

    setResults({
      scope1: Number(scope1.toFixed(2)),
      scope2: Number(scope2.toFixed(2)),
      scope3: Number(scope3.toFixed(2)),
      total: Number(total.toFixed(2)),
      breakdown: [
        { name: "Diesel", value: Number((inputs.dieselLitres * FACTORS.diesel).toFixed(2)), color: "#f59e0b" },
        { name: "Water", value: Number((inputs.waterConsumption * FACTORS.water).toFixed(2)), color: "#fcd34d" },
        { name: "Electricity", value: Number(scope2.toFixed(2)), color: "#22d3ee" },
        { name: "Business Travel", value: Number((inputs.businessTravelKm * FACTORS.flights).toFixed(2)), color: "#a78bfa" },
        { name: "Commuting", value: Number((inputs.employeeCommutingKm * FACTORS.commuting).toFixed(2)), color: "#c084fc" },
        { name: "Waste", value: Number((inputs.wasteKg * FACTORS.waste).toFixed(2)), color: "#6ee7b7" },
        { name: "Packaging", value: Number((inputs.packagingKg * FACTORS.packaging).toFixed(2)), color: "#34d399" },
      ].filter(d => d.value > 0),
    });
  };

  const saveScenario = () => {
    if (!results) return;
    const name = `Scenario ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
    const updated = [{ name, date: new Date().toLocaleDateString(), total: results.total }, ...scenarios].slice(0, 8);
    setScenarios(updated);
    localStorage.setItem("e2_calculator_scenarios", JSON.stringify(updated));
  };

  const reset = () => {
    setInputs({ dieselLitres: 0, waterConsumption: 0, electricityKwh: 0, businessTravelKm: 0, employeeCommutingKm: 0, wasteKg: 0, packagingKg: 0 });
    setResults(null);
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-foreground tracking-wide">Manual Calculator</h1>
          <p className="text-sm text-muted-foreground">Scope 1, 2 & 3 emissions — African regional factors</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="flex items-center gap-2 px-3 py-2 text-xs font-mono border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          {results && (
            <button onClick={saveScenario} className="flex items-center gap-2 px-3 py-2 text-xs font-mono border border-primary/40 rounded-md text-primary hover:bg-primary/10 transition-colors">
              <Save className="h-3.5 w-3.5" />
              Save Scenario
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <ScopeSection
            title="Scope 1 — Direct Emissions"
            icon={Flame}
            color="#f59e0b"
            open={openScope === 1}
            onToggle={() => setOpenScope(openScope === 1 ? 0 : 1)}
          >
            <InputField label="Diesel Consumption" name="dieselLitres" value={inputs.dieselLitres} unit="litres" onChange={handleChange} />
            <InputField label="Water Consumption" name="waterConsumption" value={inputs.waterConsumption} unit="litres" onChange={handleChange} />
          </ScopeSection>

          <ScopeSection
            title="Scope 2 — Indirect Energy"
            icon={Zap}
            color="#22d3ee"
            open={openScope === 2}
            onToggle={() => setOpenScope(openScope === 2 ? 0 : 2)}
          >
            <InputField label="Electricity Usage" name="electricityKwh" value={inputs.electricityKwh} unit="kWh" onChange={handleChange} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">African Region</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value as Region)}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {FACTORS.electricity[r.value]} kgCO₂e/kWh</option>
                ))}
              </select>
            </div>
          </ScopeSection>

          <ScopeSection
            title="Scope 3 — Value Chain Emissions"
            icon={Plane}
            color="#a78bfa"
            open={openScope === 3}
            onToggle={() => setOpenScope(openScope === 3 ? 0 : 3)}
          >
            <InputField label="Business Travel" name="businessTravelKm" value={inputs.businessTravelKm} unit="km" onChange={handleChange} />
            <InputField label="Employee Commuting" name="employeeCommutingKm" value={inputs.employeeCommutingKm} unit="km" onChange={handleChange} />
            <InputField label="Waste to Landfill" name="wasteKg" value={inputs.wasteKg} unit="kg" onChange={handleChange} />
            <InputField label="Packaging Materials" name="packagingKg" value={inputs.packagingKg} unit="kg" onChange={handleChange} />
          </ScopeSection>

          <motion.button
            variants={fadeIn}
            onClick={calculate}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Calculator className="h-4 w-4" />
            Calculate Emissions
          </motion.button>
        </div>

        <div className="space-y-4">
          {results ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Results</span>
                <div className="text-3xl font-bold font-mono text-primary mb-1">{results.total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mb-4">kg CO₂ equivalent</div>
                <div className="space-y-2">
                  {[
                    { label: "Scope 1", value: results.scope1, color: "#f59e0b" },
                    { label: "Scope 2", value: results.scope2, color: "#22d3ee" },
                    { label: "Scope 3", value: results.scope3, color: "#a78bfa" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-muted-foreground">{s.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: s.color }}>{s.value.toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {results.breakdown.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Emissions Breakdown</span>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={results.breakdown} layout="vertical" barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip
                        formatter={(v: number) => [`${v.toFixed(2)} kg CO₂e`, "Emissions"]}
                        contentStyle={{ background: "hsl(222,47%,8%)", border: "1px solid hsl(222,30%,15%)", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}
                      />
                      <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                        {results.breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-card border border-primary/20 rounded-lg p-4 border-l-2 border-l-primary">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">POWAMOV Offset Potential</span>
                <p className="text-xs text-muted-foreground">
                  At current POWAMOV network output (~69 MWh), your{" "}
                  <span className="text-primary font-mono font-bold">{results.total.toFixed(0)} kg</span> footprint could be{" "}
                  <span className="text-accent font-mono font-bold">
                    {Math.min(100, ((69000 * 0.644) / (results.total || 1)) * 100).toFixed(1)}%
                  </span>{" "}
                  offset by scaling POWAMOV infrastructure in the SA grid context.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
              <Calculator className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Fill in your emissions inputs and click Calculate</p>
            </div>
          )}

          {scenarios.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Saved Scenarios</span>
              <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <div className="text-foreground font-medium">{s.name}</div>
                      <div className="text-muted-foreground">{s.date}</div>
                    </div>
                    <span className="text-primary font-bold">{s.total.toFixed(0)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <motion.div variants={fadeIn} className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Emission Factors Reference</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { label: "Diesel", factor: "2.70 kgCO₂e/L", color: "#f59e0b" },
            { label: "Water", factor: "0.002 kgCO₂e/L", color: "#fcd34d" },
            { label: "S. Africa Electricity", factor: "0.920 kgCO₂e/kWh", color: "#22d3ee" },
            { label: "Business Flights", factor: "0.18 kgCO₂e/km", color: "#a78bfa" },
            { label: "Commuting (car)", factor: "0.12 kgCO₂e/km", color: "#c084fc" },
            { label: "Waste (landfill)", factor: "0.10 kgCO₂e/kg", color: "#6ee7b7" },
            { label: "Packaging", factor: "0.25 kgCO₂e/kg", color: "#34d399" },
            { label: "E. Africa Electricity", factor: "0.74 kgCO₂e/kWh", color: "#22d3ee" },
          ].map(item => (
            <div key={item.label} className="border border-border rounded-md p-2.5">
              <div className="text-muted-foreground mb-0.5">{item.label}</div>
              <div style={{ color: item.color }} className="font-bold">{item.factor}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
