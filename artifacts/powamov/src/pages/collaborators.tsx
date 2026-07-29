import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Users, Cpu, Zap, Activity, AlertTriangle,
  CheckCircle2, Clock, Plus, Search, Filter, Package,
  TreePine, Radio, BarChart3,
} from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

const DEPLOYMENTS = [
  {
    id: "DEP-001",
    name: "Gaborone–Francistown Highway",
    location: "A1 Highway, Botswana",
    country: "BW",
    nodes: 15,
    status: "operational",
    energyKwh: 2.3,
    priority: "high",
    updated: "12 min ago",
    team: "BW North Infrastructure",
    coords: "−22.9° S, 26.8° E",
    type: "Highway",
  },
  {
    id: "DEP-002",
    name: "Sir Seretse Khama Airport Access",
    location: "Airport Road, Gaborone",
    country: "BW",
    nodes: 8,
    status: "in-progress",
    energyKwh: 1.1,
    priority: "medium",
    updated: "1 hour ago",
    team: "BW North Infrastructure",
    coords: "−24.56° S, 25.91° E",
    type: "Airport Access",
  },
  {
    id: "DEP-003",
    name: "Cape Town N2 Gateway",
    location: "N2 Freeway, Western Cape",
    country: "ZA",
    nodes: 22,
    status: "operational",
    energyKwh: 4.1,
    priority: "high",
    updated: "5 min ago",
    team: "ZA Coastal Deployment",
    coords: "−33.93° S, 18.42° E",
    type: "Freeway",
  },
  {
    id: "DEP-004",
    name: "Johannesburg CBD Intersections",
    location: "Central Business District, Gauteng",
    country: "ZA",
    nodes: 6,
    status: "planning",
    energyKwh: 0,
    priority: "low",
    updated: "Yesterday",
    team: "ZA Urban Projects",
    coords: "−26.20° S, 28.04° E",
    type: "Urban Intersection",
  },
  {
    id: "DEP-005",
    name: "Francistown Commercial District",
    location: "Blue Jacket St, Francistown",
    country: "BW",
    nodes: 10,
    status: "operational",
    energyKwh: 1.8,
    priority: "medium",
    updated: "30 min ago",
    team: "Regional Maintenance",
    coords: "−21.17° S, 27.50° E",
    type: "Urban Road",
  },
];

const TEAMS = [
  {
    id: "T001",
    name: "BW North Infrastructure",
    status: "active",
    members: 8,
    location: "Gaborone, Botswana",
    specialty: "Node Installation",
    activeDeployments: 2,
    icon: Cpu,
    color: "#22d3ee",
  },
  {
    id: "T002",
    name: "ZA Coastal Deployment",
    status: "active",
    members: 12,
    location: "Cape Town, South Africa",
    specialty: "Highway Arrays",
    activeDeployments: 1,
    icon: Zap,
    color: "#4ade80",
  },
  {
    id: "T003",
    name: "Regional Maintenance Crew",
    status: "standby",
    members: 6,
    location: "Francistown, Botswana",
    specialty: "Predictive Maintenance",
    activeDeployments: 1,
    icon: Activity,
    color: "#f59e0b",
  },
  {
    id: "T004",
    name: "ZA Urban Projects",
    status: "planning",
    members: 9,
    location: "Johannesburg, South Africa",
    specialty: "Urban Intersections",
    activeDeployments: 1,
    icon: Radio,
    color: "#a78bfa",
  },
];

const RESOURCES = [
  { name: "POWAMOV Node Units", icon: Cpu, available: 45, deployed: 61, unit: "units", color: "#22d3ee" },
  { name: "Edge Controllers", icon: Radio, available: 12, deployed: 9, unit: "units", color: "#4ade80" },
  { name: "IoT Sensors", icon: Activity, available: 200, deployed: 147, unit: "units", color: "#f59e0b" },
  { name: "Battery Packs", icon: Zap, available: 34, deployed: 29, unit: "units", color: "#a78bfa" },
  { name: "Waterproof Enclosures", icon: Package, available: 80, deployed: 61, unit: "units", color: "#22d3ee" },
];

const ENV_PROJECTS = [
  {
    id: "EP-001",
    name: "Okavango Reforestation Initiative",
    location: "Okavango Delta, BW",
    type: "Reforestation",
    status: "ongoing",
    icon: TreePine,
    color: "#4ade80",
    impact: "2,400 trees planted",
    linked: "POWAMOV energy offset",
  },
  {
    id: "EP-002",
    name: "Solar Integration Pilot",
    location: "Gaborone, BW",
    type: "Renewable Energy",
    status: "in-progress",
    icon: Zap,
    color: "#f59e0b",
    impact: "120 kWh/day capacity",
    linked: "Grid displacement analytics",
  },
  {
    id: "EP-003",
    name: "Urban Carbon Audit 2026",
    location: "Cape Town, ZA",
    type: "Carbon Accounting",
    status: "planned",
    icon: BarChart3,
    color: "#22d3ee",
    impact: "City-wide Scope 1–3",
    linked: "Ecosphere Calculator",
  },
];

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  operational: { label: "Operational", color: "#4ade80", bg: "#4ade8018", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", color: "#f59e0b", bg: "#f59e0b18", icon: Clock },
  planning: { label: "Planning", color: "#a78bfa", bg: "#a78bfa18", icon: Clock },
  active: { label: "Active", color: "#4ade80", bg: "#4ade8018", icon: CheckCircle2 },
  standby: { label: "Standby", color: "#f59e0b", bg: "#f59e0b18", icon: Clock },
  ongoing: { label: "Ongoing", color: "#4ade80", bg: "#4ade8018", icon: CheckCircle2 },
  "in-progress-env": { label: "In Progress", color: "#f59e0b", bg: "#f59e0b18", icon: Clock },
  planned: { label: "Planned", color: "#a78bfa", bg: "#a78bfa18", icon: Clock },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["planning"];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}

function CountryBadge({ country }: { country: string }) {
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
      country === "BW"
        ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
        : "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"
    }`}>
      {country}
    </span>
  );
}

export default function Collaborators() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"deployments" | "teams" | "resources" | "projects">("deployments");

  const filtered = DEPLOYMENTS.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalEnergy = DEPLOYMENTS.filter((d) => d.status === "operational").reduce((s, d) => s + d.energyKwh, 0);
  const totalNodes = DEPLOYMENTS.reduce((s, d) => s + d.nodes, 0);
  const activeNodes = DEPLOYMENTS.filter((d) => d.status === "operational").reduce((s, d) => s + d.nodes, 0);

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">OPERATIONS HUB</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-foreground tracking-wide">Infrastructure Operations</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-mono rounded-lg hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Deployment
        </button>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Deployments", value: DEPLOYMENTS.length, icon: MapPin, color: "#22d3ee" },
          { label: "Active Nodes", value: `${activeNodes}/${totalNodes}`, icon: Cpu, color: "#4ade80" },
          { label: "Daily Energy (kWh)", value: totalEnergy.toFixed(1), icon: Zap, color: "#f59e0b" },
          { label: "Field Teams", value: TEAMS.filter(t => t.status === "active").length, icon: Users, color: "#a78bfa" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeIn} className="flex gap-1 bg-card border border-border rounded-lg p-1">
        {(["deployments", "teams", "resources", "projects"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-md transition-all capitalize ${
              tab === t ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "projects" ? "Env. Projects" : t}
          </button>
        ))}
      </motion.div>

      {/* Deployments */}
      {tab === "deployments" && (
        <motion.div variants={stagger} animate="animate" initial="initial" className="space-y-4">
          <motion.div variants={fadeIn} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deployments..."
                className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </motion.div>

          {filtered.map((dep) => (
            <motion.div key={dep.id} variants={fadeIn} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-foreground">{dep.name}</span>
                    <CountryBadge country={dep.country} />
                    <StatusBadge status={dep.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {dep.location}
                    <span className="text-muted-foreground/40">·</span>
                    <span>{dep.coords}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Energy/day</div>
                  <div className="font-mono font-bold text-lg text-primary">{dep.energyKwh > 0 ? `${dep.energyKwh} kWh` : "—"}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Nodes</div>
                  <div className="font-mono font-bold text-sm text-foreground">{dep.nodes}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Type</div>
                  <div className="font-mono font-bold text-sm text-foreground">{dep.type}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Team</div>
                  <div className="font-mono font-bold text-sm text-foreground truncate">{dep.team}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground/60">{dep.id} · Updated {dep.updated}</span>
                {dep.status === "operational" && dep.energyKwh > 0 && (
                  <span className="text-[10px] font-mono text-accent">
                    ≈ {(dep.energyKwh * 734 * 0.001).toFixed(2)} kg CO₂ avoided/day
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Teams */}
      {tab === "teams" && (
        <motion.div variants={stagger} animate="animate" initial="initial" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEAMS.map((team) => {
            const Icon = team.icon;
            return (
              <motion.div key={team.id} variants={fadeIn} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${team.color}18`, border: `1px solid ${team.color}30` }}>
                    <Icon className="h-5 w-5" style={{ color: team.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-medium text-foreground text-sm">{team.name}</span>
                      <StatusBadge status={team.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {team.location}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="text-center bg-background/40 rounded-lg p-2">
                    <div className="text-lg font-mono font-bold text-foreground">{team.members}</div>
                    <div className="text-[10px] text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center bg-background/40 rounded-lg p-2">
                    <div className="text-lg font-mono font-bold" style={{ color: team.color }}>{team.activeDeployments}</div>
                    <div className="text-[10px] text-muted-foreground">Deployments</div>
                  </div>
                  <div className="text-center bg-background/40 rounded-lg p-2 col-span-1">
                    <div className="text-[10px] font-mono font-bold text-foreground leading-tight mt-1">{team.specialty}</div>
                    <div className="text-[10px] text-muted-foreground">Specialty</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Resources */}
      {tab === "resources" && (
        <motion.div variants={stagger} animate="animate" initial="initial" className="space-y-3">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            const pct = Math.round((r.deployed / (r.available + r.deployed)) * 100);
            return (
              <motion.div key={r.name} variants={fadeIn} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: `${r.color}18`, border: `1px solid ${r.color}30` }}>
                      <Icon className="h-4 w-4" style={{ color: r.color }} />
                    </div>
                    <div>
                      <div className="font-mono font-medium text-sm text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.deployed} deployed · {r.available} in stock</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl" style={{ color: r.color }}>{pct}%</div>
                    <div className="text-[10px] text-muted-foreground">deployed</div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: r.color }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Summary */}
          <motion.div variants={fadeIn} className="bg-card border border-border rounded-xl p-5 mt-4">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Stock Summary</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono font-bold text-primary">{RESOURCES.reduce((s, r) => s + r.deployed, 0)}</div>
                <div className="text-xs text-muted-foreground">Total Deployed</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-accent">{RESOURCES.reduce((s, r) => s + r.available, 0)}</div>
                <div className="text-xs text-muted-foreground">In Stock</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-amber-400">{RESOURCES.length}</div>
                <div className="text-xs text-muted-foreground">Resource Types</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Environmental Projects */}
      {tab === "projects" && (
        <motion.div variants={stagger} animate="animate" initial="initial" className="space-y-4">
          {ENV_PROJECTS.map((p) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.id} variants={fadeIn} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                    <Icon className="h-5 w-5" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-medium text-foreground">{p.name}</span>
                      <StatusBadge status={p.status === "in-progress" ? "in-progress" : p.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs font-mono text-muted-foreground">{p.type}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded-lg p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Impact</div>
                    <div className="font-mono text-sm font-medium text-foreground">{p.impact}</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Linked To</div>
                    <div className="font-mono text-sm font-medium" style={{ color: p.color }}>{p.linked}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <motion.div variants={fadeIn} className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
            <TreePine className="h-8 w-8 text-accent mx-auto mb-3 opacity-60" />
            <div className="text-sm text-muted-foreground">
              Environmental projects are linked to Ecosphere data flows — calculator outputs, tracker entries, and POWAMOV offsets feed directly into project impact metrics.
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
