import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, Cpu, Zap, Activity, AlertTriangle,
  Car, MapPin, CheckCircle2, WifiOff, Clock, ShieldAlert, ShieldCheck,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & PALETTE
══════════════════════════════════════════════════════════════ */
const ENT = {
  blue:   "#4a90b8",
  green:  "#3d8a5e",
  amber:  "#c07a16",
  violet: "#7c6db5",
  red:    "#b84a4a",
  slate:  "#5a7080",
};

/* Node-simulation corridors — 5 routes */
const CORRIDORS = [
  { id: "a1-north",    label: "A1 North",    sub: "Rasesa → Gaborone",    speedBase: 105, speedPx: 4.2 },
  { id: "a1-south",    label: "A1 South",    sub: "Ramotswa → Gaborone",  speedBase: 98,  speedPx: 3.8 },
  { id: "tlokweng",    label: "Tlokweng",    sub: "Tlokweng Corridor",     speedBase: 72,  speedPx: 2.8 },
  { id: "gabane",      label: "Gabane",      sub: "Gabane → Gaborone",     speedBase: 85,  speedPx: 3.2 },
  { id: "molepolole",  label: "Molepolole",  sub: "Molepolole Highway",    speedBase: 90,  speedPx: 3.5 },
] as const;
type CorridorId = (typeof CORRIDORS)[number]["id"];

/* Fleet-monitor arteries (unchanged — preserve existing corridor logic) */
const ARTERIES = [
  { id: "a1-north",    label: "A1 North",       sub: "Rasesa → Gaborone",   speedBase: 105, svgX: 38, svgY: 14, speedPx: 4.0 },
  { id: "a1-south",    label: "A1 South",        sub: "Ramotswa → Gaborone", speedBase: 98,  svgX: 52, svgY: 82, speedPx: 3.5 },
  { id: "tlokweng",    label: "Tlokweng Border", sub: "Tlokweng Corridor",   speedBase: 72,  svgX: 80, svgY: 44, speedPx: 2.5 },
  { id: "tsolamosese", label: "Tsolamosese",     sub: "West Corridor",       speedBase: 55,  svgX: 16, svgY: 50, speedPx: 2.0 },
] as const;
type ArteryId = (typeof ARTERIES)[number]["id"];

/* Random vehicle types */
const VEHICLE_TYPES = [
  { type: "Passenger Car", minKg: 1000,  maxKg: 1800,  cls: "light"  as const, color: ENT.blue   },
  { type: "SUV",           minKg: 1800,  maxKg: 2800,  cls: "light"  as const, color: ENT.blue   },
  { type: "Light Truck",   minKg: 2500,  maxKg: 5500,  cls: "medium" as const, color: ENT.amber  },
  { type: "Heavy Truck",   minKg: 6000,  maxKg: 12000, cls: "heavy"  as const, color: ENT.violet },
  { type: "Bus",           minKg: 8000,  maxKg: 15000, cls: "heavy"  as const, color: ENT.violet },
];

/* Degradation per full-compression pass, by class */
const DEGRADE = { light: 0.003, medium: 0.009, heavy: 0.020 } as const;
const HEALTH_THRESHOLD = 70;

/* SVG vertical engineering layout */
const SVG_W = 700;
const ROAD_TOP    = 78;
const ROAD_H      = 50;
const ROAD_BOTTOM = ROAD_TOP + ROAD_H;          // 128
const PLATE_H     = 14;
const SPRING_BOT  = ROAD_BOTTOM + 52;           // 180  (spring area height = 52)
const CHAMBER_Y   = SPRING_BOT + 2;             // 182
const CHAMBER_H   = 52;
const CHAMBER_BOT = CHAMBER_Y + CHAMBER_H;      // 234
const CABLE_H     = 18;
const BATTERY_Y   = CHAMBER_BOT + CABLE_H + 4;  // 256
const BATTERY_H   = 58;
const SVG_H       = BATTERY_Y + BATTERY_H + 12; // 326

const STRIP_CENTERS = [75, 175, 275, 375, 475, 575];
const STRIP_W = 52;

interface ArterialMetrics {
  vehiclesPerMin: number; avgSpeedKmh: number; energyKw: number;
  heavyPct: number; health: "healthy" | "degrading" | "offline"; lastVehicle: number;
}

interface StripState {
  id: number;
  compression: number;
  forceKn: number;
  energyWh: number;
  health: number;
}

interface VehicleSpec {
  type: string;
  kg: number;
  cls: "light" | "medium" | "heavy";
  color: string;
  speedPx: number;
  maxForceKn: number;
  whPerStrip: number;
  w: number;
  h: number;
}

const HEALTH_DISPLAY = {
  healthy:   { dot: ENT.green,  label: "Healthy"  },
  degrading: { dot: ENT.amber,  label: "Degrading"},
  offline:   { dot: ENT.red,    label: "Offline"  },
};

const MAINT_ALERTS = [
  { node: "A1 North — Node 3", drop: 8,  cause: "Spring fatigue", window: "3 weeks", color: ENT.amber },
  { node: "Tlokweng — Node 1", drop: 14, cause: "Seal wear",       window: "1 week",  color: ENT.red   },
  { node: "A1 South — Node 5", drop: 4,  cause: "Minor debris",    window: "6 weeks", color: ENT.green  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function getVehDims(cls: "light" | "medium" | "heavy") {
  if (cls === "light")  return { w: 90,  h: 32, wheelR: 7  };
  if (cls === "medium") return { w: 122, h: 41, wheelR: 8  };
  return                       { w: 160, h: 50, wheelR: 10 };
}

function makeSpring(cx: number, topY: number, botY: number, amp = 5.5, n = 9): string {
  const h = botY - topY;
  if (h < 4) return `M ${cx},${topY} L ${cx},${botY}`;
  let d = `M ${cx},${topY}`;
  for (let i = 1; i <= n; i++) {
    const y = topY + (i / n) * h;
    const x = cx + (i % 2 === 0 ? -amp : amp);
    d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + ` L ${cx},${botY}`;
}

function randomVehicle(corridorSpeedPx: number): VehicleSpec {
  const vt = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
  const kg = Math.round(vt.minKg + Math.random() * (vt.maxKg - vt.minKg));
  const speedMult = 0.75 + Math.random() * 0.4;
  const { w, h } = getVehDims(vt.cls);
  return {
    type:       vt.type,
    kg,
    cls:        vt.cls,
    color:      vt.color,
    speedPx:    corridorSpeedPx * speedMult,
    maxForceKn: kg * 0.006,
    whPerStrip: kg * 1.16e-5,
    w, h,
  };
}

function initStrips(): StripState[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1, compression: 0, forceKn: 0, energyWh: 0, health: 100,
  }));
}

/* ═══════════════════════════════════════════════════════════════
   VEHICLE SVG — inline, side profile, sits on ROAD_TOP
══════════════════════════════════════════════════════════════ */
function VehicleSVG({ vx, vehicle }: { vx: number; vehicle: VehicleSpec }) {
  const { cls, color, w, h } = vehicle;
  const { wheelR } = getVehDims(cls);
  const wheelCY = ROAD_TOP - wheelR;
  const VY      = wheelCY - h + wheelR * 0.5;

  const body   = "#1c2535";
  const dark   = "#141e2c";
  const stroke = "#253040";
  const glass  = "rgba(130,165,210,0.10)";
  const glassS = "#2a3e55";

  if (cls === "light") {
    const bodyY  = VY + h * 0.38;
    const bodyH2 = h * 0.52;
    const cabX   = vx + w * 0.12;
    const cabW   = w * 0.58;
    return (
      <g>
        <rect x={vx} y={bodyY} width={w} height={bodyH2} rx="3" fill={body} stroke={stroke} strokeWidth="1"/>
        <rect x={cabX} y={VY} width={cabW} height={h * 0.68} rx="3" fill={dark} stroke={stroke} strokeWidth="1"/>
        <rect x={cabX + 3} y={VY + 4} width={cabW * 0.30} height={h * 0.42} rx="1" fill={glass} stroke={glassS} strokeWidth="0.5"/>
        <rect x={cabX + cabW * 0.44} y={VY + 4} width={cabW * 0.30} height={h * 0.42} rx="1" fill={glass} stroke={glassS} strokeWidth="0.5"/>
        <rect x={vx + w - 5} y={bodyY + 3} width={4} height={h * 0.18} rx="1" fill="#ddd060" opacity="0.8"/>
        <rect x={vx + 1} y={bodyY + 3} width={3} height={h * 0.15} rx="0.5" fill="#c04242" opacity="0.7"/>
        {[vx + w * 0.18, vx + w * 0.80].map((wx, i) => (
          <g key={i}>
            <ellipse cx={wx} cy={wheelCY} rx={wheelR + 1} ry={wheelR * 0.52} fill="#0e141c" stroke={stroke} strokeWidth="0.8"/>
            <ellipse cx={wx} cy={wheelCY} rx={4} ry={2.2} fill="#1a2535"/>
          </g>
        ))}
        <text x={vx + w / 2} y={VY - 6} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace" opacity="0.75">{vehicle.type}</text>
        <text x={vx + w / 2} y={VY - 14} textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="7" fontFamily="monospace">{vehicle.kg.toLocaleString()} kg</text>
      </g>
    );
  }

  if (cls === "medium") {
    const bY  = VY + h * 0.22;
    const bH  = h * 0.70;
    return (
      <g>
        <rect x={vx} y={bY} width={w} height={bH} rx="2" fill={body} stroke={stroke} strokeWidth="1"/>
        <rect x={vx + 4} y={VY} width={w - 8} height={h * 0.30} rx="2" fill={dark} stroke={stroke} strokeWidth="1"/>
        <rect x={vx + 6} y={VY + 4} width={w * 0.20} height={h * 0.21} rx="1" fill={glass} stroke={glassS} strokeWidth="0.5"/>
        <rect x={vx + w * 0.58} y={VY + 4} width={w * 0.22} height={h * 0.21} rx="1" fill={glass} stroke={glassS} strokeWidth="0.5"/>
        <rect x={vx + w - 4} y={bY + 6} width={3} height={bH * 0.50} rx="1" fill="#ddd060" opacity="0.8"/>
        <rect x={vx + 1} y={bY + 6} width={3} height={bH * 0.44} rx="0.5" fill="#c04242" opacity="0.7"/>
        {[vx + w * 0.14, vx + w * 0.56, vx + w * 0.85].map((wx, i) => (
          <g key={i}>
            <ellipse cx={wx} cy={wheelCY} rx={wheelR + 1} ry={wheelR * 0.54} fill="#0e141c" stroke={stroke} strokeWidth="0.8"/>
            <ellipse cx={wx} cy={wheelCY} rx={4.5} ry={2.4} fill="#1a2535"/>
          </g>
        ))}
        <text x={vx + w / 2} y={VY - 6} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace" opacity="0.75">{vehicle.type}</text>
        <text x={vx + w / 2} y={VY - 14} textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="7" fontFamily="monospace">{vehicle.kg.toLocaleString()} kg</text>
      </g>
    );
  }

  /* Heavy */
  const trailerY = VY + h * 0.10;
  const trailerH = h * 0.76;
  const cabX     = vx + w * 0.67;
  const cabW     = w * 0.33;
  return (
    <g>
      <rect x={vx} y={trailerY} width={w * 0.69} height={trailerH} rx="1" fill={body} stroke={stroke} strokeWidth="1"/>
      {[0.20, 0.38, 0.56].map((t, i) => (
        <line key={i} x1={vx + w * t} y1={trailerY + 4} x2={vx + w * t} y2={trailerY + trailerH - 4} stroke={stroke} strokeWidth="0.5" opacity="0.3"/>
      ))}
      <rect x={cabX} y={VY} width={cabW} height={h * 0.87} rx="2" fill={dark} stroke={stroke} strokeWidth="1"/>
      <rect x={cabX + 4} y={VY + 4} width={cabW * 0.52} height={h * 0.27} rx="1" fill={glass} stroke={glassS} strokeWidth="0.5"/>
      <rect x={cabX + cabW * 0.72} y={VY - 8} width={3} height={12} rx="1" fill={dark}/>
      <rect x={vx + w - 5} y={VY + h * 0.44} width={4} height={h * 0.22} rx="1" fill="#ddd060" opacity="0.75"/>
      <rect x={vx + 2} y={trailerY + 6} width={4} height={h * 0.18} rx="0.5" fill="#c04242" opacity="0.7"/>
      {[vx + w * 0.08, vx + w * 0.27, vx + w * 0.53, vx + w * 0.72, vx + w - 14].map((wx, i) => (
        <g key={i}>
          <ellipse cx={wx} cy={wheelCY} rx={wheelR + 1} ry={wheelR * 0.52} fill="#0e141c" stroke={stroke} strokeWidth="0.8"/>
          <ellipse cx={wx} cy={wheelCY} rx={5} ry={2.6} fill="#1a2535"/>
        </g>
      ))}
      <text x={vx + w / 2} y={VY - 6} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace" opacity="0.75">{vehicle.type}</text>
      <text x={vx + w / 2} y={VY - 14} textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="7" fontFamily="monospace">{vehicle.kg.toLocaleString()} kg</text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VERTICAL ENGINEERING CROSS-SECTION SVG
══════════════════════════════════════════════════════════════ */
function VerticalEngineeringViz({
  vehicleX,
  vehicle,
  strips,
  totalEnergyWh,
}: {
  vehicleX: number;
  vehicle: VehicleSpec;
  strips: StripState[];
  totalEnergyWh: number;
}) {
  const anyActive = strips.some((s) => s.compression > 0.04);
  const batFill   = Math.min(1, totalEnergyWh / 0.45);
  const batColor  = batFill > 0.7 ? ENT.green : batFill > 0.3 ? ENT.amber : ENT.slate;
  const batW      = 200;
  const batX      = (SVG_W - batW) / 2;
  const batFillW  = batFill * (batW - 12);

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" className="block select-none">
      <defs>
        <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#04090f"/>
          <stop offset="100%" stopColor="#0a1520"/>
        </linearGradient>
        <linearGradient id="vRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1c2c3e"/>
          <stop offset="100%" stopColor="#111d2d"/>
        </linearGradient>
        <linearGradient id="vSubsoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#080f18"/>
          <stop offset="100%" stopColor="#05090f"/>
        </linearGradient>
        <linearGradient id="vChamber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#0d1e30"/>
          <stop offset="100%" stopColor="#091520"/>
        </linearGradient>
      </defs>

      {/* ── SKY / ATMOSPHERE ── */}
      <rect x="0" y="0" width={SVG_W} height={ROAD_TOP} fill="url(#vSky)"/>

      {/* Specs labels */}
      <text x="12" y="14" fill="rgba(255,255,255,0.14)" fontSize="7.5" fontFamily="monospace">→ DIRECTION OF TRAVEL</text>
      <text x={SVG_W - 12} y="14" textAnchor="end" fill="rgba(100,140,180,0.30)" fontSize="7.5" fontFamily="monospace">
        6-STRIP NODE · 2m DEPLOYMENT · 350m SPACING
      </text>
      <text x="12" y="26" fill="rgba(100,140,180,0.22)" fontSize="7" fontFamily="monospace">NODE-01</text>

      {/* ── VEHICLE ── */}
      {vehicleX > -vehicle.w - 20 && vehicleX < SVG_W + 20 && (
        <VehicleSVG vx={vehicleX} vehicle={vehicle} />
      )}

      {/* ── ROAD BODY ── */}
      <rect x="0" y={ROAD_TOP} width={SVG_W} height={ROAD_H} fill="url(#vRoad)"/>
      {/* Top surface line */}
      <rect x="0" y={ROAD_TOP} width={SVG_W} height="2" fill="rgba(240,240,220,0.45)"/>
      {/* Center line dashes */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={i * 52 + 6} y={ROAD_TOP + ROAD_H / 2 - 1} width="28" height="2"
          fill="rgba(200,185,60,0.16)"/>
      ))}
      {/* Road bottom */}
      <rect x="0" y={ROAD_BOTTOM} width={SVG_W} height="1.5" fill="rgba(100,120,140,0.18)"/>

      {/* ── SUBSOIL BACKGROUND ── */}
      <rect x="0" y={ROAD_BOTTOM} width={SVG_W} height={SVG_H - ROAD_BOTTOM} fill="url(#vSubsoil)"/>

      {/* ── STRIPS, SPRINGS, CHAMBER CELLS ── */}
      {strips.map((strip, i) => {
        const cx       = STRIP_CENTERS[i];
        const sx       = cx - STRIP_W / 2;
        const comp     = strip.compression;
        const isActive = comp > 0.04;
        const plateDepression = comp * 11; // px the plate sinks
        const plateTopY  = ROAD_TOP + plateDepression;
        const plateBotY  = plateTopY + PLATE_H;
        const springTopY = plateBotY;
        const springBotY = SPRING_BOT;
        const col = vehicle.color;
        const healthCol = strip.health >= HEALTH_THRESHOLD ? ENT.green : strip.health >= 50 ? ENT.amber : ENT.red;

        return (
          <g key={i}>
            {/* Strip housing channel in road */}
            <rect x={sx} y={ROAD_TOP} width={STRIP_W} height={ROAD_H}
              fill={isActive ? `${col}12` : "rgba(255,255,255,0.016)"}
              stroke={isActive ? col : "rgba(255,255,255,0.08)"}
              strokeWidth={isActive ? "1.4" : "0.5"}
              rx="1.5"
            />

            {/* S-label above road */}
            <text x={cx} y={ROAD_TOP - 8} textAnchor="middle"
              fill={isActive ? col : "rgba(255,255,255,0.25)"}
              fontSize="9" fontFamily="monospace" fontWeight={isActive ? "700" : "400"}>
              S{i + 1}
            </text>

            {/* Strip actuator plate (compresses down) */}
            <rect x={sx + 2} y={plateTopY} width={STRIP_W - 4} height={PLATE_H}
              rx="1.5"
              fill={isActive ? `${col}30` : "rgba(40,80,120,0.45)"}
              stroke={isActive ? col : "rgba(80,130,180,0.30)"}
              strokeWidth={isActive ? "1.2" : "0.7"}
            />
            {/* Plate surface detail lines */}
            {[0.3, 0.6].map((t) => (
              <line key={t}
                x1={sx + 5} y1={plateTopY + PLATE_H * t}
                x2={sx + STRIP_W - 5} y2={plateTopY + PLATE_H * t}
                stroke={isActive ? `${col}45` : "rgba(100,150,200,0.12)"}
                strokeWidth="0.7"
              />
            ))}

            {/* Strip health bar at bottom of road slot */}
            <rect x={sx + 3} y={ROAD_BOTTOM - 7} width={STRIP_W - 6} height={4} rx="1" fill="rgba(255,255,255,0.04)"/>
            <rect x={sx + 3} y={ROAD_BOTTOM - 7}
              width={(STRIP_W - 6) * strip.health / 100} height={4} rx="1"
              fill={healthCol} opacity="0.65"
            />

            {/* Spring */}
            <path
              d={makeSpring(cx, springTopY, springBotY)}
              fill="none"
              stroke={isActive ? col : "rgba(60,100,150,0.50)"}
              strokeWidth={isActive ? "1.5" : "1.0"}
              opacity={isActive ? 1 : 0.6}
            />

            {/* Power chamber cell */}
            <rect x={sx + 3} y={CHAMBER_Y + 4} width={STRIP_W - 6} height={CHAMBER_H - 8}
              rx="2"
              fill={isActive ? `${col}1a` : "rgba(20,40,60,0.5)"}
              stroke={isActive ? col : "rgba(40,80,120,0.14)"}
              strokeWidth={isActive ? "1.1" : "0.5"}
            />
            {isActive && (
              <>
                {/* Horizontal circuit lines inside cell */}
                {[0.3, 0.5, 0.7].map((t) => (
                  <line key={t}
                    x1={sx + 7} y1={CHAMBER_Y + 4 + (CHAMBER_H - 8) * t}
                    x2={sx + STRIP_W - 7} y2={CHAMBER_Y + 4 + (CHAMBER_H - 8) * t}
                    stroke={`${col}40`} strokeWidth="0.7"
                  />
                ))}
                {/* Energy output label */}
                <text x={cx} y={CHAMBER_Y + CHAMBER_H / 2 + 1} textAnchor="middle"
                  fill={col} fontSize="6" fontFamily="monospace" opacity="0.82">
                  {(strip.energyWh * 1000).toFixed(1)}mWh
                </text>
              </>
            )}

            {/* Energy cable from cell to battery bus */}
            <line x1={cx} y1={CHAMBER_BOT} x2={cx} y2={BATTERY_Y - CABLE_H + 4}
              stroke={isActive ? ENT.green : "rgba(40,80,60,0.25)"}
              strokeWidth={isActive ? "1.5" : "0.7"}
              strokeDasharray={isActive ? "none" : "2 4"}
              opacity={isActive ? 0.85 : 0.5}
            />
          </g>
        );
      })}

      {/* ── POWER CHAMBER HOUSING ── */}
      <rect x="18" y={CHAMBER_Y} width={SVG_W - 36} height={CHAMBER_H}
        fill="url(#vChamber)"
        stroke="rgba(60,100,150,0.30)"
        strokeWidth="1.5"
        rx="5"
      />
      {/* Chamber label */}
      <text x={SVG_W / 2} y={CHAMBER_Y + CHAMBER_H - 8} textAnchor="middle"
        fill="rgba(74,144,184,0.40)" fontSize="7" fontFamily="monospace" letterSpacing="0.08em">
        POWAMOV GEN-3 · POWER CHAMBER · 6-CELL ARRAY
      </text>
      {/* Cell dividers */}
      {STRIP_CENTERS.slice(0, 5).map((cx, i) => {
        const divX = (cx + STRIP_CENTERS[i + 1]) / 2;
        return (
          <line key={i} x1={divX} y1={CHAMBER_Y + 6} x2={divX} y2={CHAMBER_Y + CHAMBER_H - 6}
            stroke="rgba(60,100,150,0.14)" strokeWidth="0.8"/>
        );
      })}

      {/* ── BUS CABLE COLLECTOR ── */}
      <line x1={STRIP_CENTERS[0]} y1={BATTERY_Y - CABLE_H + 4} x2={STRIP_CENTERS[5]} y2={BATTERY_Y - CABLE_H + 4}
        stroke={anyActive ? ENT.green : "rgba(40,80,60,0.2)"}
        strokeWidth={anyActive ? "2" : "1"}
        opacity="0.6"
      />
      {/* Bus label */}
      {anyActive && (
        <text x={SVG_W / 2} y={BATTERY_Y - CABLE_H + 2} textAnchor="middle"
          fill={ENT.green} fontSize="7" fontFamily="monospace" opacity="0.55">
          ENERGY BUS
        </text>
      )}

      {/* ── BATTERY ── */}
      <rect x={batX} y={BATTERY_Y} width={batW} height={BATTERY_H}
        rx="6"
        fill="rgba(6,12,20,0.95)"
        stroke="rgba(60,100,140,0.40)"
        strokeWidth="1.8"
      />
      {/* Positive terminal */}
      <rect x={batX + batW} y={BATTERY_Y + BATTERY_H / 2 - 7} width="7" height="14" rx="2"
        fill="rgba(60,100,140,0.35)" stroke="rgba(60,100,140,0.40)" strokeWidth="1"/>
      {/* Fill track */}
      <rect x={batX + 6} y={BATTERY_Y + 8} width={batW - 12} height={BATTERY_H - 16} rx="3"
        fill="rgba(255,255,255,0.03)"/>
      {/* Fill */}
      {batFillW > 0 && (
        <rect x={batX + 6} y={BATTERY_Y + 8} width={batFillW} height={BATTERY_H - 16} rx="3"
          fill={batColor} opacity="0.72"/>
      )}
      {/* Battery text */}
      <text x={batX + batW / 2} y={BATTERY_Y + 19} textAnchor="middle"
        fill="rgba(255,255,255,0.40)" fontSize="7" fontFamily="monospace" letterSpacing="0.06em">
        HARVEST BATTERY
      </text>
      <text x={batX + batW / 2} y={BATTERY_Y + BATTERY_H - 10} textAnchor="middle"
        fill={batColor} fontSize="8.5" fontFamily="monospace" fontWeight="700" opacity="0.85">
        {(batFill * 100).toFixed(1)}%  ·  {(totalEnergyWh * 1000).toFixed(2)} mWh
      </text>

      {/* ── LAYER ANNOTATIONS (right side) ── */}
      {[
        { y: ROAD_TOP + ROAD_H / 2, label: "ROAD SURFACE" },
        { y: ROAD_BOTTOM + (CHAMBER_Y - ROAD_BOTTOM) / 2, label: "SPRINGS" },
        { y: CHAMBER_Y + CHAMBER_H / 2, label: "POWER CHAMBER" },
        { y: BATTERY_Y + BATTERY_H / 2, label: "ENERGY STORAGE" },
      ].map(({ y, label }) => (
        <g key={label}>
          <line x1={SVG_W - 24} y1={y} x2={SVG_W - 4} y2={y}
            stroke="rgba(100,140,180,0.18)" strokeWidth="0.8"/>
          <text x={SVG_W - 26} y={y + 2.5} textAnchor="end"
            fill="rgba(100,140,180,0.32)" fontSize="7" fontFamily="monospace">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STRIP HEALTH ROW
══════════════════════════════════════════════════════════════ */
function StripHealthRow({ strips, vehColor }: { strips: StripState[]; vehColor: string }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {strips.map((strip) => {
        const isActive = strip.compression > 0.05;
        const hc = strip.health >= HEALTH_THRESHOLD ? ENT.green : strip.health >= 50 ? ENT.amber : ENT.red;
        const statusLabel = strip.health >= HEALTH_THRESHOLD ? "OK" : strip.health >= 50 ? "WARN" : "CRIT";
        return (
          <div key={strip.id}
            className="bg-card border border-border rounded-lg p-2.5 flex flex-col gap-1.5 transition-colors duration-75"
            style={{ borderColor: isActive ? `${vehColor}35` : undefined, background: isActive ? `${vehColor}06` : undefined }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-foreground">S{strip.id}</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: hc }}/>
                <span className="text-[8px] font-mono" style={{ color: hc }}>{statusLabel}</span>
              </div>
            </div>
            {/* Health bar */}
            <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200"
                style={{ width: `${strip.health}%`, background: hc }}/>
            </div>
            <div className="text-[9px] font-mono text-center" style={{ color: hc }}>
              {strip.health.toFixed(1)}%
            </div>
            {/* Live compression */}
            {isActive && (
              <div className="text-[8px] font-mono text-center" style={{ color: vehColor }}>
                {Math.round(strip.compression * 100)}% comp
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NODE SIMULATION  (TAB 1) — engineering cross-section
══════════════════════════════════════════════════════════════ */
function NodeSimulation() {
  const [corridor, setCorridor] = useState<CorridorId>("a1-north");
  const [isRunning, setIsRunning] = useState(true);
  const [vehicleX, setVehicleX] = useState(-200);
  const [vehicle, setVehicle] = useState<VehicleSpec>(() =>
    randomVehicle(CORRIDORS[0].speedPx)
  );
  const [strips, setStrips] = useState<StripState[]>(initStrips);
  const [nodeHealth, setNodeHealth] = useState(100);
  const [maintenanceStatus, setMaintenanceStatus] = useState<"normal" | "warning" | "critical">("normal");
  const [passCount, setPassCount] = useState(0);
  const [totalEnergyWh, setTotalEnergyWh] = useState(0);
  const [energyHistory, setEnergyHistory] = useState<{ t: number; v: number }[]>(
    Array.from({ length: 50 }, (_, i) => ({ t: i, v: 0 }))
  );
  const [vehiclesPerMin, setVehiclesPerMin] = useState(0);

  /* Refs */
  const runRef        = useRef(true);
  const frameRef      = useRef(0);
  const vehicleXRef   = useRef(-200);
  const vehicleRef    = useRef(vehicle);
  const corridorRef   = useRef<(typeof CORRIDORS)[number]>(CORRIDORS[0]);
  const awaitingRef   = useRef(false);
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stripHealthRef = useRef<number[]>(Array(6).fill(100));
  const stripMaxCompRef = useRef<number[]>(Array(6).fill(0));
  const energyAccRef  = useRef(0);
  const passCountRef  = useRef(0);
  const histFrameRef  = useRef(0);
  const passTimesRef  = useRef<number[]>([]);

  /* Sync refs */
  useEffect(() => { runRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    const c = CORRIDORS.find((c) => c.id === corridor)!;
    corridorRef.current = c;
  }, [corridor]);

  /* Apply degradation after each pass */
  const applyDegradation = () => {
    const cls = vehicleRef.current.cls;
    const factor = DEGRADE[cls];
    const newHealth = stripHealthRef.current.map((h, i) => {
      const maxComp = stripMaxCompRef.current[i];
      return Math.max(0, h - factor * maxComp * 100);
    });
    stripHealthRef.current = newHealth;
    stripMaxCompRef.current = Array(6).fill(0);
    const degraded = newHealth.filter((h) => h < HEALTH_THRESHOLD).length;
    const status = degraded >= 4 ? "critical" : degraded >= 3 ? "warning" : "normal";
    const avgH = newHealth.reduce((a, b) => a + b, 0) / 6;
    setNodeHealth(avgH);
    setMaintenanceStatus(status);
    setStrips((prev) => prev.map((s, i) => ({ ...s, health: newHealth[i] })));
  };

  /* Spawn next vehicle after delay */
  const spawnNext = () => {
    const delay = 1000 + Math.random() * 2000;
    timeoutRef.current = setTimeout(() => {
      awaitingRef.current = false;
      const nv = randomVehicle(corridorRef.current.speedPx);
      vehicleRef.current = nv;
      vehicleXRef.current = -nv.w - 10;
      setVehicle(nv);
      setVehicleX(vehicleXRef.current);
    }, delay);
  };

  /* Main animation loop */
  useEffect(() => {
    const tick = () => {
      if (runRef.current && !awaitingRef.current) {
        const veh = vehicleRef.current;
        vehicleXRef.current += veh.speedPx;
        const vx = vehicleXRef.current;

        /* Vehicle exited — apply degradation, schedule next */
        if (vx > SVG_W + veh.w + 10) {
          applyDegradation();
          passCountRef.current++;
          setPassCount(passCountRef.current);
          const now = Date.now();
          passTimesRef.current = [...passTimesRef.current.filter((t) => now - t < 60000), now];
          setVehiclesPerMin(passTimesRef.current.length);
          awaitingRef.current = true;
          spawnNext();
        } else {
          const vCenter = vx + veh.w / 2;
          const halfRange = veh.w / 2 + 28;
          const newStrips: StripState[] = STRIP_CENTERS.map((cx, i) => {
            const comp = Math.max(0, 1 - Math.abs(vCenter - cx) / halfRange);
            const forceKn  = comp * veh.maxForceKn;
            const energyWh = comp > 0.04 ? comp * veh.whPerStrip : 0;
            /* track max compression for degradation */
            stripMaxCompRef.current[i] = Math.max(stripMaxCompRef.current[i], comp);
            return { id: i + 1, compression: comp, forceKn, energyWh, health: stripHealthRef.current[i] };
          });
          setStrips(newStrips);
          setVehicleX(vx);
          const totalE = newStrips.reduce((s, st) => s + st.energyWh, 0);
          energyAccRef.current += totalE * (veh.speedPx / 80);
          setTotalEnergyWh(energyAccRef.current);
          histFrameRef.current++;
          if (histFrameRef.current % 8 === 0) {
            setEnergyHistory((h) => [...h.slice(1), { t: h[h.length - 1].t + 1, v: totalE * 1000 }]);
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = () => {
    cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    awaitingRef.current = false;
    stripHealthRef.current = Array(6).fill(100);
    stripMaxCompRef.current = Array(6).fill(0);
    energyAccRef.current = 0;
    passCountRef.current = 0;
    passTimesRef.current = [];
    const nv = randomVehicle(corridorRef.current.speedPx);
    vehicleRef.current = nv;
    vehicleXRef.current = -nv.w - 10;
    setVehicle(nv);
    setVehicleX(vehicleXRef.current);
    setStrips(initStrips());
    setNodeHealth(100);
    setMaintenanceStatus("normal");
    setPassCount(0);
    setTotalEnergyWh(0);
    setVehiclesPerMin(0);
    setEnergyHistory(Array.from({ length: 50 }, (_, i) => ({ t: i, v: 0 })));
    const tick = () => {
      if (runRef.current && !awaitingRef.current) {
        const veh = vehicleRef.current;
        vehicleXRef.current += veh.speedPx;
        const vx = vehicleXRef.current;
        if (vx > SVG_W + veh.w + 10) {
          applyDegradation();
          passCountRef.current++;
          setPassCount(passCountRef.current);
          const now = Date.now();
          passTimesRef.current = [...passTimesRef.current.filter((t) => now - t < 60000), now];
          setVehiclesPerMin(passTimesRef.current.length);
          awaitingRef.current = true;
          spawnNext();
        } else {
          const vCenter = vx + veh.w / 2;
          const halfRange = veh.w / 2 + 28;
          const newStrips: StripState[] = STRIP_CENTERS.map((cx, i) => {
            const comp = Math.max(0, 1 - Math.abs(vCenter - cx) / halfRange);
            stripMaxCompRef.current[i] = Math.max(stripMaxCompRef.current[i], comp);
            return { id: i + 1, compression: comp, forceKn: comp * veh.maxForceKn, energyWh: comp > 0.04 ? comp * veh.whPerStrip : 0, health: stripHealthRef.current[i] };
          });
          setStrips(newStrips);
          setVehicleX(vx);
          const totalE = newStrips.reduce((s, st) => s + st.energyWh, 0);
          energyAccRef.current += totalE * (veh.speedPx / 80);
          setTotalEnergyWh(energyAccRef.current);
          histFrameRef.current++;
          if (histFrameRef.current % 8 === 0) {
            setEnergyHistory((h) => [...h.slice(1), { t: h[h.length - 1].t + 1, v: totalE * 1000 }]);
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const corr = CORRIDORS.find((c) => c.id === corridor)!;
  const totalForceKn = strips.reduce((s, st) => s + st.forceKn, 0);
  const totalStripE  = strips.reduce((s, st) => s + st.energyWh, 0);
  const degradedCount = strips.filter((s) => s.health < HEALTH_THRESHOLD).length;

  const maintColor =
    maintenanceStatus === "critical" ? ENT.red :
    maintenanceStatus === "warning"  ? ENT.amber :
    ENT.green;

  const MaintIcon =
    maintenanceStatus === "critical" ? ShieldAlert :
    maintenanceStatus === "warning"  ? AlertTriangle :
    ShieldCheck;

  return (
    <div className="space-y-4">

      {/* ── Corridor selector + controls ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 flex-wrap">
          {CORRIDORS.map((c) => (
            <button key={c.id} onClick={() => setCorridor(c.id)}
              className={`px-3 py-1.5 text-[10px] font-mono rounded transition-all ${
                corridor === c.id ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsRunning((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[10px] font-mono text-foreground rounded hover:bg-muted/50 transition-colors">
            {isRunning ? <Pause className="h-3 w-3"/> : <Play className="h-3 w-3"/>}
            {isRunning ? "Pause" : "Resume"}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-[10px] font-mono text-muted-foreground rounded hover:bg-muted/50 transition-colors">
            <RotateCcw className="h-3 w-3"/>Reset
          </button>
        </div>
      </div>

      {/* ── Corridor metadata ── */}
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-foreground">{corr.label}</span>
            <span className="text-xs text-muted-foreground">{corr.sub}</span>
            <span className="text-[9px] font-mono text-primary bg-primary/8 border border-primary/22 px-1.5 py-0.5 rounded">{corr.speedBase} km/h</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Current vehicle badge */}
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Current Vehicle</div>
            <div className="font-mono text-xs font-bold mt-0.5" style={{ color: vehicle.color }}>
              {vehicle.type} · {vehicle.kg.toLocaleString()} kg
            </div>
          </div>
          {/* Maintenance status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-semibold"
            style={{ color: maintColor, borderColor: `${maintColor}28`, background: `${maintColor}08` }}>
            <MaintIcon className="h-3 w-3"/>
            {maintenanceStatus === "critical" ? "CRITICAL" : maintenanceStatus === "warning" ? "WARNING" : "NOMINAL"}
            {degradedCount > 0 && <span className="opacity-60 ml-1">{degradedCount}/6 strips</span>}
          </div>
        </div>
      </div>

      {/* ── VERTICAL ENGINEERING SVG ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground"/>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Engineering Cross-Section · {corr.label} · NODE-01
            </span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/50">
            VEHICLE: {vehicle.type.toUpperCase()} · {vehicle.cls.toUpperCase()}
          </span>
        </div>
        <div className="bg-[#04090f] px-1 py-1">
          <VerticalEngineeringViz
            vehicleX={vehicleX}
            vehicle={vehicle}
            strips={strips}
            totalEnergyWh={totalEnergyWh}
          />
        </div>
      </div>

      {/* ── Strip health row ── */}
      <div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
          <Activity className="h-3 w-3"/>Strip Health — Individual Degradation Tracking
        </div>
        <StripHealthRow strips={strips} vehColor={vehicle.color}/>
      </div>

      {/* ── Live metrics row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vehicles / min",   value: vehiclesPerMin.toString(),          sub: "last 60s",       color: vehicle.color },
          { label: "Strip Energy",     value: `${(totalStripE * 1000).toFixed(2)} mWh`, sub: "live array output", color: ENT.green },
          { label: "Node Health",      value: `${nodeHealth.toFixed(1)}%`,         sub: "avg strip health",color: nodeHealth >= HEALTH_THRESHOLD ? ENT.green : nodeHealth >= 50 ? ENT.amber : ENT.red },
          { label: "Array Force",      value: `${totalForceKn.toFixed(1)} kN`,     sub: "total compression",color: ENT.slate },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-mono font-bold" style={{ color }}>{value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Pass counter + energy chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-3 w-3"/>Session Summary
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Vehicles Passed",   value: passCount.toString(),                       color: vehicle.color },
              { label: "Corridor Speed",    value: `${corr.speedBase} km/h`,                   color: ENT.blue },
              { label: "Acc. Energy",       value: `${(totalEnergyWh / 1000).toFixed(5)} kWh`, color: ENT.green },
              { label: "Degraded Strips",   value: `${degradedCount} / 6`,                     color: degradedCount >= 3 ? ENT.red : degradedCount > 0 ? ENT.amber : ENT.green },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-background/50 rounded-lg px-3 py-2.5">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
                <div className="text-sm font-mono font-bold mt-0.5" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Vehicle mix info */}
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Vehicle Mix (Random)</div>
            {[
              { label: "Passenger / SUV", pct: 40, color: ENT.blue   },
              { label: "Light Truck",     pct: 30, color: ENT.amber  },
              { label: "Heavy / Bus",     pct: 30, color: ENT.violet },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-22 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rolling strip energy chart */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="h-3 w-3"/>Rolling Strip Energy Output (mWh)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={energyHistory}>
              <defs>
                <linearGradient id="simEG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={vehicle.color} stopOpacity={0.22}/>
                  <stop offset="95%" stopColor={vehicle.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 9, fill: "#7a8898" }} tickLine={false} axisLine={false} width={30}/>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-card border border-border rounded px-2.5 py-1.5 text-[10px] font-mono shadow-lg">
                  <div style={{ color: vehicle.color }}>{Number(payload[0].value).toFixed(3)} mWh</div>
                </div>
              ) : null}/>
              <Area type="monotone" dataKey="v" stroke={vehicle.color} fill="url(#simEG)" strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — FLEET MONITOR (city grid — unchanged, corridor logic preserved)
══════════════════════════════════════════════════════════════ */

function StripStatusBar({ active, health }: { active: boolean; health: "healthy" | "degrading" | "offline" }) {
  const color = HEALTH_DISPLAY[health].dot;
  return (
    <div className="flex gap-1 items-end">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5">
          <div className="h-7 rounded-sm border"
            style={{
              background: active ? `${color}12` : "rgba(255,255,255,0.02)",
              borderColor: active ? `${color}35` : "rgba(255,255,255,0.06)",
            }}/>
          <div className="text-[8px] font-mono text-center text-muted-foreground/40">S{i + 1}</div>
        </div>
      ))}
    </div>
  );
}

function GaboroneMap({ metrics, activeArtery, onSelect }: {
  metrics: Record<ArteryId, ArterialMetrics>; activeArtery: ArteryId | null; onSelect: (id: ArteryId) => void;
}) {
  return (
    <div className="relative w-full h-full select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" fill="rgba(10,15,22,0.92)" rx="6"/>
        {[25, 50, 75].map((v) => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(100,130,160,0.05)" strokeWidth="0.3"/>
            <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(100,130,160,0.05)" strokeWidth="0.3"/>
          </g>
        ))}
        <path d="M 38 0 L 45 30 L 50 50" stroke="rgba(90,112,128,0.35)" strokeWidth="1.2" fill="none"/>
        <path d="M 52 100 L 50 70 L 50 50" stroke="rgba(90,112,128,0.35)" strokeWidth="1.2" fill="none"/>
        <path d="M 100 44 L 75 46 L 50 50" stroke="rgba(90,112,128,0.35)" strokeWidth="1.2" fill="none"/>
        <path d="M 0 50 L 25 50 L 50 50"   stroke="rgba(90,112,128,0.35)" strokeWidth="1.2" fill="none"/>
        <circle cx="50" cy="50" r="2.5" fill="rgba(74,144,184,0.35)"/>
        <circle cx="50" cy="50" r="1.2" fill="rgba(74,144,184,0.70)"/>
        <text x="50" y="58" textAnchor="middle" fontSize="2.5" fill="rgba(74,144,184,0.45)" fontFamily="monospace">CBD</text>
        {ARTERIES.map((artery) => {
          const m = metrics[artery.id]; const h = HEALTH_DISPLAY[m.health];
          const isSelected = activeArtery === artery.id;
          return (
            <g key={artery.id} onClick={() => onSelect(artery.id)} style={{ cursor: "pointer" }}>
              {isSelected && <circle cx={artery.svgX} cy={artery.svgY} r="6" fill="none" stroke={h.dot} strokeWidth="0.5" opacity="0.45"/>}
              <circle cx={artery.svgX} cy={artery.svgY} r="3.5" fill={`${h.dot}18`} stroke={h.dot} strokeWidth="0.7" opacity="0.9"/>
              <circle cx={artery.svgX} cy={artery.svgY} r="1.4" fill={h.dot} opacity="0.85"/>
              <text x={artery.svgX} y={artery.svgY - 6} textAnchor="middle" fontSize="2.6"
                fill={isSelected ? h.dot : "rgba(255,255,255,0.52)"} fontFamily="monospace" fontWeight={isSelected ? "600" : "400"}>
                {artery.label}
              </text>
              <text x={artery.svgX} y={artery.svgY + 7} textAnchor="middle" fontSize="2.2"
                fill="rgba(74,144,184,0.65)" fontFamily="monospace">{m.energyKw.toFixed(1)}kW</text>
            </g>
          );
        })}
        <text x="2" y="5" fontSize="2.2" fill="rgba(255,255,255,0.14)" fontFamily="monospace">GABORONE</text>
      </svg>
    </div>
  );
}

function ArterialPanel({ artery, metrics, selected, onSelect }: {
  artery: (typeof ARTERIES)[number]; metrics: ArterialMetrics; selected: boolean; onSelect: () => void;
}) {
  const h = HEALTH_DISPLAY[metrics.health];
  const HealthIcon = metrics.health === "offline" ? WifiOff : metrics.health === "degrading" ? AlertTriangle : CheckCircle2;
  return (
    <div onClick={onSelect}
      className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${selected ? "border-primary/35" : "border-border hover:border-border/70"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: h.dot }}/>
            <span className="text-sm font-mono font-bold text-foreground">{artery.label}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{artery.sub}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono font-semibold" style={{ color: h.dot }}>
          <HealthIcon className="h-3 w-3"/>{h.label}
        </div>
      </div>
      <div className="mb-3">
        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5">Strip Array Status</div>
        <StripStatusBar active={metrics.health !== "offline"} health={metrics.health}/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Vehicles/min", value: metrics.vehiclesPerMin.toFixed(1),       color: ENT.blue  },
          { label: "Avg Speed",    value: `${metrics.avgSpeedKmh.toFixed(0)} km/h`, color: ENT.green },
          { label: "Harvest",      value: `${metrics.energyKw.toFixed(2)} kW`,      color: ENT.amber },
          { label: "Heavy %",      value: `${metrics.heavyPct.toFixed(0)}%`,        color: ENT.slate },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-background/40 rounded-lg px-2.5 py-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-xs font-mono font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-2.5 py-1.5 text-[10px] font-mono shadow-lg">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

function CityGrid() {
  const [selectedArtery, setSelectedArtery] = useState<ArteryId>("a1-north");
  const [metrics, setMetrics] = useState<Record<ArteryId, ArterialMetrics>>(() => {
    const init: Record<string, ArterialMetrics> = {};
    for (const a of ARTERIES) {
      init[a.id] = { vehiclesPerMin: 2 + Math.random() * 6, avgSpeedKmh: a.speedBase + (Math.random() - 0.5) * 10, energyKw: 0.8 + Math.random() * 2.5, heavyPct: 8 + Math.random() * 20, health: a.id === "tsolamosese" ? "degrading" : "healthy", lastVehicle: Date.now() };
    }
    return init as Record<ArteryId, ArterialMetrics>;
  });
  const [chartHistory, setChartHistory] = useState<{ t: string; energy: number; vehicles: number; co2: number }[]>(() => {
    const seed = seededRand(42); const now = Date.now();
    return Array.from({ length: 30 }, (_, i) => ({
      t: new Date(now - (29 - i) * 5000).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      energy: 3 + seed() * 4, vehicles: 15 + seed() * 20, co2: 0.5 + seed() * 1.5,
    }));
  });
  const co2Ref = useRef(chartHistory.reduce((s, d) => s + d.co2, 0));

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setMetrics((prev) => {
        const next = { ...prev } as Record<ArteryId, ArterialMetrics>;
        for (const a of ARTERIES) {
          const m = prev[a.id]; const drift = (Math.random() - 0.48) * 0.5;
          next[a.id] = { vehiclesPerMin: Math.max(0.5, Math.min(12, m.vehiclesPerMin + drift)), avgSpeedKmh: Math.max(30, Math.min(130, m.avgSpeedKmh + (Math.random() - 0.48) * 3)), energyKw: Math.max(0.1, Math.min(6, m.energyKw + drift * 0.8)), heavyPct: Math.max(5, Math.min(45, m.heavyPct + (Math.random() - 0.5))), health: m.health, lastVehicle: Math.random() > 0.55 ? now : m.lastVehicle };
        }
        return next;
      });
      setChartHistory((prev) => {
        const totalEnergy = Object.values(metrics).reduce((s, m) => s + m.energyKw, 0);
        co2Ref.current += totalEnergy * 0.092 * 0.025;
        return [...prev.slice(1), { t: new Date(now).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), energy: totalEnergy + (Math.random() - 0.5) * 0.4, vehicles: Object.values(metrics).reduce((s, m) => s + m.vehiclesPerMin * 5, 0), co2: co2Ref.current }];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const totalVehicles = Math.round(Object.values(metrics).reduce((s, m) => s + m.vehiclesPerMin * 60, 0));
  const totalEnergy   = Object.values(metrics).reduce((s, m) => s + m.energyKw, 0);
  const totalCo2      = totalEnergy * 0.092 * 0.5;
  const activeNodes   = ARTERIES.filter((a) => metrics[a.id].health !== "offline").length * 6;
  const avgSpeed      = Object.values(metrics).reduce((s, m) => s + m.avgSpeedKmh, 0) / ARTERIES.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Vehicles",   value: totalVehicles.toLocaleString(), sub: "per hour",   icon: Car,      color: ENT.blue   },
          { label: "Energy Harvested", value: `${totalEnergy.toFixed(2)} kW`, sub: "live",       icon: Zap,      color: ENT.amber  },
          { label: "CO₂ Offset",       value: `${totalCo2.toFixed(2)} kg`,   sub: "avoided/hr", icon: Activity, color: ENT.green  },
          { label: "Active Nodes",     value: `${activeNodes}/24`,            sub: "strips",     icon: Cpu,      color: ENT.violet },
          { label: "Network Speed",    value: `${avgSpeed.toFixed(0)} km/h`, sub: "avg",        icon: MapPin,   color: ENT.blue   },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground/40"/>
            </div>
            <span className="text-xl font-mono font-bold" style={{ color }}>{value}</span>
            <span className="text-[9px] text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_270px] gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ARTERIES.map((artery) => (
            <ArterialPanel key={artery.id} artery={artery} metrics={metrics[artery.id]} selected={selectedArtery === artery.id} onSelect={() => setSelectedArtery(artery.id)}/>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">Gaborone Arterial Grid</span>
              <span className="text-[9px] font-mono text-muted-foreground/50">LIVE</span>
            </div>
            <div className="aspect-square w-full rounded-lg border border-border/40 overflow-hidden">
              <GaboroneMap metrics={metrics} activeArtery={selectedArtery} onSelect={setSelectedArtery}/>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              {(["healthy", "degrading", "offline"] as const).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: HEALTH_DISPLAY[s].dot }}/>
                  {HEALTH_DISPLAY[s].label}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" style={{ color: ENT.amber }}/>Service Alerts
            </div>
            {MAINT_ALERTS.map((alert) => (
              <div key={alert.node} className="rounded border px-3 py-2.5 space-y-1"
                style={{ borderColor: `${alert.color}22`, background: `${alert.color}05` }}>
                <div className="text-xs font-mono font-bold text-foreground">{alert.node}</div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Efficiency drop</span>
                  <span className="font-mono font-bold" style={{ color: alert.color }}>−{alert.drop}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Cause</span>
                  <span className="font-mono text-foreground">{alert.cause}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5"/>Window: {alert.window}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { key: "energy",   label: "City-Wide Energy Harvest",   icon: Zap,      color: ENT.blue,   name: "kW",          grad: "eGC"  },
          { key: "vehicles", label: "Vehicle Inbound Traffic",    icon: Car,      color: ENT.violet, name: "vehicles/5s", grad: "vGC"  },
          { key: "co2",      label: "Carbon Offset Accumulation", icon: Activity, color: ENT.green,  name: "kg CO₂",      grad: "cGC"  },
        ].map(({ key, label, icon: Icon, color, name, grad }) => (
          <div key={key} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon className="h-3 w-3 text-muted-foreground/50"/>{label}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartHistory}>
                <defs>
                  <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#7a8898" }} tickLine={false} axisLine={false} interval={9}/>
                <YAxis tick={{ fontSize: 8, fill: "#7a8898" }} tickLine={false} axisLine={false} width={28}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey={key} name={name} stroke={color} fill={`url(#${grad})`} strokeWidth={1.5} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } };

export default function DigitalTwin() {
  const [activeTab, setActiveTab] = useState<"simulation" | "city">("simulation");
  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeIn}>
        <h1 className="text-xl font-bold font-mono text-foreground tracking-wide">Digital Twin</h1>
        <p className="text-sm text-muted-foreground">Engineering cross section simulation with node strip architecture</p>
      </motion.div>

      <motion.div variants={fadeIn} className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
        {([
          { id: "simulation", label: "Engineering Simulation" },
          { id: "city",       label: "Fleet Monitor" },
        ] as const).map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 text-[11px] font-mono rounded transition-all ${
              activeTab === id ? "bg-muted text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeIn}>
        {activeTab === "simulation" ? <NodeSimulation /> : <CityGrid />}
      </motion.div>
    </motion.div>
  );
}
