import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { CaretDown, Play, Pause, ArrowsClockwise, Car, Lightning } from '@phosphor-icons/react';
import { getNodes, STATUS_COLORS, type PowamovNode } from '../../services/mockPowamov';

const SURFACE = '#071828';
const CARD = '#0A1F35';
const BORDER = '#1A4A6B';
const CYAN = '#00D9FF';
const GREEN = '#00FF88';
const AMBER = '#FFB800';
const TEXT = '#E2F4FF';
const MUTED = '#4D7EA8';

// ─── Compression SVG Animation ───────────────────────────────────────────────
function CompressionViz({ node, vehicleX, isCompressing }: {
  node: PowamovNode;
  vehicleX: number;
  isCompressing: boolean;
}) {
  const sc = STATUS_COLORS[node.status];
  const compress = isCompressing ? 8 : 0;
  const springH = isCompressing ? 18 : 28;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Cross-Section View — {node.id}
      </div>
      <svg viewBox="0 0 400 280" width="100%" height="100%" style={{ maxHeight: 260 }}>
        <defs>
          <filter id="cvGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3040" />
            <stop offset="100%" stopColor="#1A2030" />
          </linearGradient>
          <linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${CYAN}88`} />
            <stop offset="100%" stopColor={`${CYAN}22`} />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A2238" />
            <stop offset="100%" stopColor="#061520" />
          </linearGradient>
          <marker id="arrowDn" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={AMBER} />
          </marker>
        </defs>

        <rect x="0" y="0" width="400" height="100" fill="#020810" />
        <rect x="30" y="80" width="340" height="30" rx="2" fill="url(#roadGrad)" />
        <rect x="70" y="93" width="30" height="3" rx="1" fill="#2A3A4A" />
        <rect x="180" y="93" width="30" height="3" rx="1" fill="#2A3A4A" />
        <rect x="300" y="93" width="30" height="3" rx="1" fill="#2A3A4A" />

        {/* POWAMOV node panel */}
        <motion.rect
          x="150" y={90 + compress * 0.4} width="100" height={14 - compress * 0.5}
          rx="2" fill="url(#nodeGrad)" stroke={sc} strokeWidth="1.5" filter="url(#cvGlow)"
          animate={{ y: 90 + compress * 0.4, height: 14 - compress * 0.5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
        {isCompressing && (
          <motion.rect
            x="148" y="88" width="104" height="18" rx="3"
            fill="none" stroke={CYAN} strokeWidth="2"
            animate={{ opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        )}

        {/* Springs */}
        {[164, 182, 206, 228].map((sx, i) => (
          <motion.g
            key={i}
            animate={{ scaleY: isCompressing ? 0.65 : 1 }}
            style={{ transformOrigin: `${sx}px 110px` }}
            transition={{ type: 'spring', stiffness: 250, damping: 18 }}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <line
                key={j}
                x1={sx + (j % 2 === 0 ? -4 : 4)} y1={108 + j * (springH / 5)}
                x2={sx + (j % 2 === 0 ? 4 : -4)} y2={108 + (j + 1) * (springH / 5)}
                stroke="#2A5A7A" strokeWidth="1.5"
              />
            ))}
          </motion.g>
        ))}

        {/* Power chamber */}
        <motion.rect
          x="140" y={135 + compress * 0.2} width="120" height="45" rx="4"
          fill="#041628" stroke={isCompressing ? CYAN : BORDER} strokeWidth="1.5"
          animate={{ y: 135 + compress * 0.2 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
        {[150, 165, 180, 195, 210, 225, 240].map((lx) => (
          <motion.line
            key={lx}
            x1={lx} y1={142 + compress * 0.2} x2={lx} y2={172 + compress * 0.2}
            animate={{ stroke: isCompressing ? `${CYAN}88` : '#0D2A3E' }}
            strokeWidth="1"
          />
        ))}
        <text x="200" y={162 + compress * 0.2} textAnchor="middle"
          fill={isCompressing ? CYAN : '#2A5A7A'} fontSize="8"
          fontFamily="'Space Mono', monospace">POWAMOV GEN-3</text>

        {/* Energy cable */}
        <motion.path
          d={`M 260,${155 + compress * 0.2} C 300,${152 + compress * 0.2} 320,155 340,150`}
          fill="none" strokeWidth="2" strokeDasharray="4 3"
          filter={isCompressing ? 'url(#cvGlow)' : 'none'}
          animate={{ stroke: isCompressing ? GREEN : '#1A4A2A' }}
          transition={{ duration: 0.3 }}
        />

        {/* Battery */}
        <rect x="340" y="136" width="32" height="18" rx="3" fill={CARD}
          stroke={isCompressing ? GREEN : BORDER} strokeWidth="1.5" />
        <rect x="372" y="142" width="5" height="6" rx="1" fill={isCompressing ? GREEN : BORDER} />
        <motion.rect
          x="342" y="138" height="14" rx="2"
          fill={isCompressing ? GREEN : '#1A4A2A'}
          animate={{ width: isCompressing ? 28 : Math.floor(node.efficiency / 100 * 28) }}
          transition={{ duration: 0.5 }}
        />

        {/* Ground */}
        <rect x="30" y="185" width="340" height="50" rx="3" fill="url(#groundGrad)" opacity="0.6" />
        {[200, 215, 230, 245].map((ly) => (
          <line key={ly} x1="40" y1={ly} x2="360" y2={ly} stroke="#0A2030" strokeWidth="0.8" />
        ))}

        {/* Force arrows */}
        {isCompressing && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[170, 200, 230].map((ax) => (
              <g key={ax}>
                <line x1={ax} y1="55" x2={ax} y2="80" stroke={AMBER} strokeWidth="1.5" markerEnd="url(#arrowDn)" />
                <text x={ax} y="50" textAnchor="middle" fill={AMBER} fontSize="7"
                  fontFamily="'Space Mono', monospace">
                  {Math.floor(node.compressionForce / 3).toFixed(0)}kN
                </text>
              </g>
            ))}
          </motion.g>
        )}

        {/* Spark particles */}
        {isCompressing && (
          <AnimatePresence>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i} cx={175 + i * 18} r={2}
                fill={CYAN} filter="url(#cvGlow)"
                initial={{ cy: 130, opacity: 0 }}
                animate={{ cy: [130, 95, 65], opacity: [0, 1, 0] }}
                transition={{ duration: 0.9, delay: i * 0.12, repeat: Infinity }}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Vehicle */}
        <motion.g animate={{ x: vehicleX }} transition={{ ease: 'linear', duration: 0.05 }}>
          <rect x="0" y="48" width="56" height="26" rx="3" fill="#1A2535" stroke="#2A3545" strokeWidth="1" />
          <rect x="36" y="42" width="20" height="32" rx="3" fill="#1F2D3D" stroke="#2A3545" strokeWidth="1" />
          <rect x="40" y="44" width="12" height="10" rx="2" fill="#0A2038" stroke={MUTED} strokeWidth="0.5" />
          <circle cx="12" cy="78" r="7" fill="#111" stroke="#2A3545" strokeWidth="1.5" />
          <circle cx="12" cy="78" r="3" fill="#1A2535" />
          <circle cx="48" cy="78" r="7" fill="#111" stroke="#2A3545" strokeWidth="1.5" />
          <circle cx="48" cy="78" r="3" fill="#1A2535" />
        </motion.g>

        <text x="200" y="108" textAnchor="middle" fill={sc} fontSize="7"
          fontFamily="'Space Mono', monospace" opacity="0.9">POWAMOV NODE</text>
        <rect x="8" y="8" width="60" height="16" rx="3" fill={`${sc}22`} stroke={`${sc}55`} strokeWidth="1" />
        <text x="38" y="19" textAnchor="middle" fill={sc} fontSize="8"
          fontFamily="'Space Mono', monospace">{node.status.toUpperCase()}</text>
      </svg>
    </div>
  );
}

// ─── Health Gauge ─────────────────────────────────────────────────────────────
function HealthGauge({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ * 0.75;
  const offset = circ * 0.125;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#0D2030" strokeWidth="6"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={-offset}
          strokeLinecap="round" transform="rotate(-225 40 40)" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(-225 40 40)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <text x="40" y="44" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="700"
          fontFamily="'Space Mono', monospace">{value.toFixed(0)}</text>
        <text x="40" y="55" textAnchor="middle" fill={MUTED} fontSize="8">{unit}</text>
      </svg>
      <span style={{ fontSize: 10, color: MUTED, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DigitalTwin() {
  const allNodes = getNodes();
  const [selectedId, setSelectedId] = useState(allNodes[0].id);
  const [isRunning, setIsRunning] = useState(true);
  const [vehicleX, setVehicleX] = useState(-60);
  const [isCompressing, setIsCompressing] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [energyBuffer, setEnergyBuffer] = useState<{ t: number; v: number }[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: i, v: 0 }))
  );
  const [liveForce, setLiveForce] = useState(0);
  const [liveEnergy, setLiveEnergy] = useState(0);
  const vehicleXRef = useRef(-60);
  const runRef = useRef(true);
  const frameRef = useRef<number>(0);
  const node = allNodes.find((n) => n.id === selectedId)!;
  const sc = STATUS_COLORS[node.status];

  useEffect(() => { runRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    const animate = (ts: number) => {
      if (runRef.current) {
        vehicleXRef.current += 1.4;
        if (vehicleXRef.current > 460) vehicleXRef.current = -60;
        const vx = vehicleXRef.current;
        setVehicleX(vx);
        const inZone = vx > 110 && vx < 200;
        setIsCompressing(inZone);
        if (inZone) {
          const f = node.compressionForce * (0.85 + Math.random() * 0.3);
          const e = f * 0.05 * (Math.random() * 0.4 + 0.8);
          setLiveForce(f);
          setLiveEnergy(e);
          setEnergyBuffer((p) => [...p.slice(1), { t: p[p.length - 1].t + 1, v: e }]);
        } else {
          setLiveForce(0); setLiveEnergy(0);
          setEnergyBuffer((p) => {
            const last = p[p.length - 1];
            return last.v > 0.5 ? [...p.slice(1), { t: last.t + 1, v: 0 }] : p;
          });
        }
        if (Math.abs(vx - 145) < 2) setPassCount((c) => c + 1);
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [node]);

  const radarData = [
    { subject: 'Efficiency', A: node.efficiency },
    { subject: 'Thermal', A: Math.max(0, 100 - node.temperature) },
    { subject: 'Structural', A: Math.max(0, 100 - node.degradation) },
    { subject: 'Output', A: node.status === 'online' ? Math.min(100, (node.energyToday / 15000) * 100) : 0 },
    { subject: 'Uptime', A: node.status === 'online' ? 94 : node.status === 'degraded' ? 70 : 0 },
  ];

  return (
    <div className="flex flex-col h-full" style={{ padding: 16, gap: 14, background: '#030D1A', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: sc, boxShadow: `0 0 8px ${sc}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Node Simulation</span>
        </div>

        {/* Node selector */}
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              background: CARD, border: `1px solid ${BORDER}`, color: TEXT,
              fontSize: 12, padding: '6px 32px 6px 12px', borderRadius: 8,
              cursor: 'pointer', appearance: 'none', fontFamily: "'Space Mono', monospace",
            }}
          >
            {allNodes.map((n) => (
              <option key={n.id} value={n.id} style={{ background: '#0A1F35' }}>
                {n.id} — {n.zone}
              </option>
            ))}
          </select>
          <CaretDown size={12} color={MUTED} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={() => setIsRunning((r) => !r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
              background: isRunning ? `${AMBER}22` : `${GREEN}22`,
              border: `1px solid ${isRunning ? AMBER + '44' : GREEN + '44'}`,
              color: isRunning ? AMBER : GREEN, fontSize: 12, cursor: 'pointer',
            }}>
            {isRunning ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => { vehicleXRef.current = -60; setVehicleX(-60); setPassCount(0); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
              background: '#0A1F35', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 12, cursor: 'pointer',
            }}>
            <ArrowsClockwise size={13} />
            Reset
          </button>
        </div>

        {/* Live stats */}
        <div className="flex gap-3">
          {[
            { label: 'Passes', value: String(passCount), color: CYAN, Icon: Car },
            { label: 'Force', value: `${liveForce.toFixed(0)} kN`, color: AMBER, Icon: Lightning },
            { label: 'Energy', value: `${liveEnergy.toFixed(2)} Wh`, color: GREEN, Icon: Lightning },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
              <Icon size={12} color={color} weight="fill" />
              <span style={{ fontSize: 11, color: MUTED }}>{label}:</span>
              <span style={{ fontSize: 11, color, fontFamily: "'Space Mono', monospace" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-3" style={{ flex: 1, minHeight: 0 }}>
        <div className="flex-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: SURFACE, minWidth: 0 }}>
          <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Compression Simulation</span>
            <span style={{ fontSize: 11, color: MUTED, marginLeft: 12 }}>{node.name}</span>
          </div>
          <div style={{ height: 'calc(100% - 42px)' }}>
            <CompressionViz node={node} vehicleX={vehicleX} isCompressing={isCompressing} />
          </div>
        </div>

        <div className="flex flex-col gap-3" style={{ width: 310, flexShrink: 0 }}>
          {/* Energy chart */}
          <div className="rounded-xl" style={{ border: `1px solid ${BORDER}`, background: SURFACE, flex: 1, minHeight: 0 }}>
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Real-time Output</span>
            </div>
            <div style={{ height: 'calc(100% - 42px)', padding: '8px 4px 4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyBuffer} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D2030" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis stroke={BORDER} tick={{ fontSize: 9, fill: MUTED }} />
                  <Tooltip
                    contentStyle={{ background: '#071828', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(2)} Wh`, 'Energy']}
                  />
                  <Area type="monotone" dataKey="v" stroke={GREEN} fill="url(#eGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health gauges */}
          <div className="rounded-xl p-4" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 12 }}>Health Metrics</div>
            <div className="flex justify-around">
              <HealthGauge label="Efficiency" value={node.efficiency} max={100} unit="%"
                color={node.efficiency > 70 ? GREEN : AMBER} />
              <HealthGauge label="Temp" value={node.temperature} max={80} unit="°C"
                color={node.temperature > 60 ? '#FF3355' : node.temperature > 50 ? AMBER : CYAN} />
              <HealthGauge label="Degraded" value={node.degradation} max={100} unit="%"
                color={node.degradation > 50 ? '#FF3355' : node.degradation > 25 ? AMBER : GREEN} />
            </div>
          </div>

          {/* Radar */}
          <div className="rounded-xl p-3" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Health Radar</div>
            <ResponsiveContainer width="100%" height={145}>
              <RadarChart data={radarData} margin={{ top: 8, right: 22, bottom: 8, left: 22 }}>
                <PolarGrid stroke="#0D2030" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: MUTED }} />
                <Radar dataKey="A" stroke={CYAN} fill={CYAN} fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
