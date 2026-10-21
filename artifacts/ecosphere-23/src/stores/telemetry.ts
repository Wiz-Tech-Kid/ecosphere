import { writable, derived } from 'svelte/store';
import type { DataOrigin, DataQuality, NormalizedTelemetry, TelemetryMessage, ConnectionStatus } from '../types/telemetry';
import type { RoomSnapshot } from '../types/hierarchy';
import { normalizeTelemetry } from '../services/telemetry/telemetryNormalizer';
import { integrateEnergyKwh, sumRoomDirectPower } from '../services/telemetry/energyAccounting';
import { makeDemoMessage, NodeRedWebSocketProvider } from '../services/telemetry/telemetryProvider';
import { recordRoomTelemetry, resetRoomTelemetry } from './hierarchy';

type DemoScenario = 'normal' | 'hvac-reduced' | 'hvac-off' | 'high-cooling';
type TrendPoint = { time: number; total: number | null; hvac: number | null; lighting: number | null; socket: number | null; ict: number | null };
type ConnectionState = { status: ConnectionStatus; error: string; endpoint: string };

const freshSnapshot = (): RoomSnapshot => ({
  roomId: 'S1_02',
  powerW: null,
  energyKwh: null,
  components: { hvac: null, lighting: null, socket: null, ict: null },
  timestamp: '',
  occupancy: null,
  status: 'UNKNOWN',
  quality: 'unknown',
  origin: 'unknown'
});
const powerFor = (message: TelemetryMessage): number | null => {
  const measurements = message.measurements;
  if (!measurements) return null;
  if (measurements.active_power_w !== undefined) return measurements.active_power_w;
  return measurements.real_power_w ?? null;
};
const energyFor = (message: TelemetryMessage): number | null => {
  const measurements = message.measurements;
  if (!measurements) return null;
  if (measurements.active_energy_kwh !== undefined) return measurements.active_energy_kwh;
  return measurements.energy_kwh ?? null;
};

export const mode = writable<'DEMO' | 'LIVE'>('DEMO');
export const connection = writable<ConnectionState>({
  status: 'DEMO',
  error: '',
  endpoint: localStorage.getItem('ecosphere-ws-url') || import.meta.env.VITE_NODE_RED_WS_URL || ''
});
export const telemetry = writable<Record<string, NormalizedTelemetry>>({});
export const latestEvent = writable<string | null>(null);
export const lastMessageAt = writable<string | null>(null);
export const eventCount = writable(0);
export const history = writable<TrendPoint[]>([]);
export const snapshot = writable<RoomSnapshot>(freshSnapshot());
export const demoScenario = writable<DemoScenario>('normal');

const provider = new NodeRedWebSocketProvider();
let demoTimer: ReturnType<typeof setInterval> | undefined;
let ictTimer: ReturnType<typeof setInterval> | undefined;
let simulationStep = 0;
let lastDemoTick = 0;
let currentScenario: DemoScenario = 'normal';
const demoEnergy: Record<string, number> = {};
const demoPower: Record<string, number> = {};
const demoBase: Record<string, { watts: number; device: string; boundary: string; room: string }> = {
  HVAC: { watts: 1148.7, device: 'HVAC_S1_02', boundary: 'system', room: 'S1_02' },
  Lighting: { watts: 288, device: 'LIGHTING_S1_02', boundary: 'system', room: 'S1_02' },
  Socket: { watts: 280, device: 'NT_SOCKET_001', boundary: 'system', room: 'S1_02' },
  ICT: { watts: 273.5, device: 'DBR_RACK_S1', boundary: 'floor_shared_rack', room: 'S1' },
  Camera: { watts: 3.7, device: 'CAM_S1_02', boundary: 'endpoint_attribution', room: 'S1_02' },
  AP: { watts: 18.18, device: 'AP_S1_02', boundary: 'endpoint_attribution', room: 'S1_02' }
};

function clearTimers(): void {
  if (demoTimer) clearInterval(demoTimer);
  if (ictTimer) clearInterval(ictTimer);
  demoTimer = undefined;
  ictTimer = undefined;
}

function appendHistory(timestamp: string): void {
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return;
  let current: RoomSnapshot = freshSnapshot();
  snapshot.subscribe((value) => { current = value; })();
  const point: TrendPoint = {
    time,
    total: current.powerW,
    hvac: current.components.hvac,
    lighting: current.components.lighting,
    socket: current.components.socket,
    ict: current.components.ict
  };
  history.update((points) => {
    const next = points.length && points[points.length - 1].time === time
      ? [...points.slice(0, -1), point]
      : [...points, point];
    return next.filter((item) => Date.now() - item.time <= 120_000).slice(-300);
  });
}

function combinedQuality(current: DataQuality, incoming: DataQuality): DataQuality {
  if (current === 'unknown' || current === 'missing') return incoming;
  if (incoming === 'missing') return 'partial';
  if (incoming === 'unknown') return 'unknown';
  if (current === 'partial' || incoming === 'partial') return 'partial';
  return 'good';
}

function componentPower(value: unknown): number | null | undefined {
  if (typeof value === 'number' || value === null) return value;
  if (typeof value !== 'object' || value === null) return undefined;
  const part = value as { measurements?: { active_power_w?: number | null; real_power_w?: number | null }; active_power_w?: number | null; real_power_w?: number | null };
  return part.measurements?.active_power_w !== undefined
    ? part.measurements.active_power_w
    : part.measurements?.real_power_w ?? part.active_power_w ?? part.real_power_w;
}

function record(message: TelemetryMessage, addTrend = true): void {
  const row = normalizeTelemetry(message);
  telemetry.update((rows) => ({ ...rows, [row.key]: row }));
  if (message.room_id) recordRoomTelemetry(message.room_id, row.origin, row.quality, message.timestamp);
  latestEvent.set(message.timestamp);
  lastMessageAt.set(new Date().toISOString());
  eventCount.update((count) => count + 1);

  if (message.room_id === 'S1_02' && message.components && typeof message.components === 'object') {
    snapshot.update((current) => {
      const component = (key: string, prior: number | null) => {
        const raw = message.components?.[key] ??
          Object.entries(message.components || {}).find(([name]) => name.toLowerCase() === key)?.[1];
        const value = componentPower(raw);
        return value === undefined ? prior : value;
      };
      const components = {
        hvac: component('hvac', current.components.hvac),
        lighting: component('lighting', current.components.lighting),
        socket: component('socket', current.components.socket),
        ict: component('ict', current.components.ict)
      };
      const suppliedPower = powerFor(message);
      const directPower = suppliedPower === null ? sumRoomDirectPower(components) : suppliedPower;
      return {
        ...current,
        components,
        powerW: directPower,
        energyKwh: energyFor(message),
        timestamp: message.timestamp,
        quality: row.quality,
        status: row.state,
        origin: suppliedPower === null && modeValue === 'LIVE' ? 'calculated' : row.origin
      };
    });
  } else if (message.room_id === 'S1_02' &&
    (message.telemetry_type === 'room_snapshot' || message.measurement_boundary === 'room' || message.measurement_boundary === 'room_snapshot')) {
    snapshot.update((current) => ({
      ...current,
      powerW: powerFor(message),
      energyKwh: energyFor(message),
      timestamp: message.timestamp,
      quality: row.quality,
      status: row.state,
      origin: row.origin
    }));
  } else if (message.room_id === 'S1_02' && ['hvac', 'lighting', 'socket'].includes(row.system.toLowerCase())) {
    const key = row.system.toLowerCase() as 'hvac' | 'lighting' | 'socket';
    snapshot.update((current) => {
      const components = { ...current.components, [key]: row.powerW };
      const total = sumRoomDirectPower(components);
      return {
        ...current,
        components,
        powerW: total,
        energyKwh: current.energyKwh,
        timestamp: message.timestamp,
        quality: combinedQuality(current.quality as DataQuality, row.quality),
        status: total === null ? 'PARTIAL' : 'AVAILABLE',
        origin: modeValue === 'DEMO' ? 'simulated' : 'calculated'
      };
    });
  }

  if (addTrend && message.room_id === 'S1_02') appendHistory(message.timestamp);
}

let modeValue: 'DEMO' | 'LIVE' = 'DEMO';
mode.subscribe((value) => { modeValue = value; });

function scenarioFactor(scenario: DemoScenario): number {
  if (scenario === 'hvac-reduced') return 0.45;
  if (scenario === 'hvac-off') return 0;
  if (scenario === 'high-cooling') return 1.55;
  return 1;
}

function frameWatts(system: string): number {
  const base = demoBase[system].watts;
  const phase = simulationStep / 5;
  if (system === 'HVAC') {
    if (currentScenario === 'hvac-off') return 0;
    return Math.max(0, base * scenarioFactor(currentScenario) + Math.sin(phase) * 18);
  }
  if (system === 'Lighting') return Math.max(0, base + Math.sin(phase * 0.55) * 7);
  if (system === 'Socket') return Math.max(0, base + Math.sin(phase * 0.9 + 1.4) * 24);
  if (system === 'ICT') return Math.max(0, base + Math.sin(phase * 0.3) * 4);
  return Math.max(0, base + Math.sin(phase * 0.8) * Math.min(1, base * 0.08));
}

function emitDemoSystem(system: string, watts: number): void {
  const config = demoBase[system];
  const state = system === 'HVAC' && currentScenario === 'hvac-off'
    ? 'OFF'
    : system === 'HVAC' && currentScenario === 'hvac-reduced' ? 'REDUCED' : 'ON';
  record(makeDemoMessage(system, watts, {
    device: config.device,
    boundary: config.boundary,
    room: config.room,
    state
  }, demoEnergy[system] ?? 0), false);
}

function emitDemoFrame(incrementPhase: boolean): void {
  const now = Date.now();
  if (incrementPhase) {
    const elapsed = lastDemoTick ? Math.max(0, now - lastDemoTick) : 0;
    for (const system of Object.keys(demoBase)) {
      demoEnergy[system] = (demoEnergy[system] || 0) + (integrateEnergyKwh(demoPower[system], elapsed) || 0);
    }
    simulationStep++;
  }
  for (const system of Object.keys(demoBase)) demoPower[system] = frameWatts(system);
  lastDemoTick = now;
  ['HVAC', 'Lighting', 'Socket', 'ICT', 'Camera', 'AP'].forEach((system) => {
    emitDemoSystem(system, demoPower[system]);
  });
  snapshot.update((current) => ({
    ...current,
    energyKwh: ['HVAC', 'Lighting', 'Socket'].every((system) => Number.isFinite(demoEnergy[system]))
      ? ['HVAC', 'Lighting', 'Socket'].reduce((total, system) => total + (demoEnergy[system] || 0), 0)
      : null,
    origin: 'simulated'
  }));
  const time = new Date(now).toISOString();
  snapshot.update((current) => ({ ...current, timestamp: time }));
  appendHistory(time);
}

export function setDemoScenario(scenario: DemoScenario): void {
  if (modeValue !== 'DEMO') return;
  currentScenario = scenario;
  demoScenario.set(scenario);
  emitDemoFrame(true);
}

export function startDemo(): void {
  provider.close();
  clearTimers();
  telemetry.set({});
  history.set([]);
  latestEvent.set(null);
  lastMessageAt.set(null);
  eventCount.set(0);
  resetRoomTelemetry();
  snapshot.set({
    ...freshSnapshot(),
    powerW: 1716.7,
    components: { hvac: 1148.7, lighting: 288, socket: 280, ict: 273.5 },
    timestamp: new Date().toISOString(),
    occupancy: 35,
    status: 'AVAILABLE',
    quality: 'good',
    origin: 'simulated'
  });
  currentScenario = 'normal';
  demoScenario.set('normal');
  simulationStep = 0;
  lastDemoTick = Date.now();
  for (const system of Object.keys(demoBase)) {
    demoEnergy[system] = 0;
    demoPower[system] = demoBase[system].watts;
  }
  mode.set('DEMO');
  connection.set({ status: 'DEMO', error: '', endpoint: '' });
  emitDemoFrame(false);
  demoTimer = setInterval(() => emitDemoFrame(true), 1000);
  ictTimer = setInterval(() => {
    if (modeValue !== 'DEMO') return;
    ['ICT', 'Camera', 'AP'].forEach((system) => emitDemoSystem(system, demoPower[system]));
  }, 5000);
}

export function startLive(url: string): void {
  clearTimers();
  telemetry.set({});
  history.set([]);
  latestEvent.set(null);
  lastMessageAt.set(null);
  eventCount.set(0);
  resetRoomTelemetry();
  snapshot.set(freshSnapshot());
  mode.set('LIVE');
  provider.connect(url, record, (status, error = '') => {
    connection.set({ status, error, endpoint: url });
  });
}

export function stopTelemetry(): void {
  provider.close();
  clearTimers();
}

export const telemetryRows = derived(telemetry, ($telemetry) =>
  Object.values($telemetry).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
);
