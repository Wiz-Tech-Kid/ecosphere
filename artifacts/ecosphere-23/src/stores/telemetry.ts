import { writable, derived } from 'svelte/store';
import type { NormalizedTelemetry, TelemetryMessage } from '../types/telemetry';
import type { RoomSnapshot } from '../types/hierarchy';
import { normalizeTelemetry } from '../services/telemetry/telemetryNormalizer';
import { makeDemoMessage, NodeRedWebSocketProvider } from '../services/telemetry/telemetryProvider';
import { recordRoomTelemetry, resetRoomTelemetry } from './hierarchy';

export const mode = writable<'DEMO' | 'LIVE'>('DEMO');
export const connection = writable<{ status: string; error: string; endpoint: string }>(
  { status: 'DEMO', error: '', endpoint: localStorage.getItem('ecosphere-ws-url') || import.meta.env.VITE_NODE_RED_WS_URL || '' }
);
export const telemetry = writable<Record<string, NormalizedTelemetry>>({});
export const latestEvent = writable<string | null>(null);
export const eventCount = writable(0);
export const history = writable<Array<{ time: number; total: number | null; hvac: number | null; lighting: number | null; socket: number | null; ict: number | null }>>([]);
export const snapshot = writable<RoomSnapshot>({
  roomId: 'S1_02', powerW: 1716.7, energyKwh: null,
  components: { hvac: 1148.7, lighting: 288, socket: 280, ict: 3.7 },
  timestamp: new Date().toISOString(), occupancy: 35, status: 'ONLINE', quality: 'good'
});
const provider = new NodeRedWebSocketProvider();
let demoTimer: ReturnType<typeof setInterval> | undefined;
let ictTimer: ReturnType<typeof setInterval> | undefined;
let liveChartTimer: ReturnType<typeof setInterval> | undefined;
const jitter = (n: number, amount: number) => Number((n + (Math.random() * amount - amount / 2)).toFixed(2));
const bases: Record<string, { watts: number; interval: number; device?: string; boundary?: string; room?: string }> = {
  HVAC: { watts: 1148.7, interval: 1000 },
  Lighting: { watts: 288, interval: 1000 },
  Socket: { watts: 280, interval: 1000, device: 'NT_SOCKET_001' },
  ICT: { watts: 273.5, interval: 5000, device: 'DBR_RACK_S1', boundary: 'floor_shared_rack', room: 'S1' },
  Camera: { watts: 3.7, interval: 5000, device: 'CAM_S1_02', boundary: 'endpoint_attribution' },
  AP: { watts: 18.18, interval: 5000, device: 'AP_S1_02', boundary: 'endpoint_attribution' }
};
function record(message: TelemetryMessage) {
  const row = normalizeTelemetry(message);
  telemetry.update((rows) => ({ ...rows, [row.key]: row }));
  if (message.room_id) recordRoomTelemetry(message.room_id, row.origin, row.quality, message.timestamp);
  latestEvent.set(message.timestamp);
  eventCount.update((n) => n + 1);
  if (message.room_id === 'S1_02' && message.components && typeof message.components === 'object') {
    const parts = message.components;
    snapshot.update((s) => {
      const valueFor = (key: string, prior: number | null) => {
        const part = parts[key] ?? Object.entries(parts).find(([name]) => name.toLowerCase() === key)?.[1];
        if (typeof part === 'number' || part === null) return part;
        if (part && typeof part === 'object') return part.measurements?.active_power_w ?? part.measurements?.real_power_w ?? part.active_power_w ?? part.real_power_w ?? null;
        return prior;
      };
      const components = {
        hvac: valueFor('hvac', s.components.hvac),
        lighting: valueFor('lighting', s.components.lighting),
        socket: valueFor('socket', s.components.socket),
        ict: valueFor('ict', s.components.ict)
      };
      return {
        ...s,
        components,
        powerW: message.measurements?.active_power_w ?? message.measurements?.real_power_w ?? null,
        energyKwh: message.measurements?.active_energy_kwh ?? message.measurements?.energy_kwh ?? null,
        timestamp: message.timestamp,
        quality: row.quality,
        status: row.state
      };
    });
  } else if (message.room_id === 'S1_02' && (message.telemetry_type === 'room_snapshot' || message.measurement_boundary === 'room' || message.measurement_boundary === 'room_snapshot')) {
    snapshot.update((s) => ({ ...s, powerW: message.measurements?.active_power_w ?? message.measurements?.real_power_w ?? null, energyKwh: message.measurements?.active_energy_kwh ?? message.measurements?.energy_kwh ?? null, timestamp: message.timestamp, quality: row.quality, status: row.state }));
  } else if (message.room_id === 'S1_02' && !['Camera', 'AP', 'ICT'].includes(row.system) && ['HVAC', 'Lighting', 'Socket'].includes(row.system)) {
    snapshot.update((s) => ({ ...s, components: { ...s.components, [row.system.toLowerCase()]: row.powerW }, timestamp: message.timestamp, quality: row.quality, status: row.state === 'UNKNOWN' ? s.status : row.state }));
  }
}
function chartTick() {
  snapshot.update((s) => {
    const hvac = s.components.hvac === null ? null : jitter(s.components.hvac, 9);
    const lighting = s.components.lighting === null ? null : jitter(s.components.lighting, 2);
    const socket = s.components.socket === null ? null : jitter(s.components.socket, 10);
    const total = hvac === null || lighting === null || socket === null ? null : hvac + lighting + socket;
    const updated = { ...s, components: { ...s.components, hvac, lighting, socket }, powerW: total, timestamp: new Date().toISOString() };
    history.update((points) => [...points, { time: Date.now(), total, hvac, lighting, socket, ict: s.components.ict }].filter((p) => Date.now() - p.time <= 120000).slice(-300));
    return updated;
  });
}
export function startDemo() {
  provider.close(); if (demoTimer) clearInterval(demoTimer);
  if (ictTimer) clearInterval(ictTimer); ictTimer = undefined;
  if (liveChartTimer) clearInterval(liveChartTimer); liveChartTimer = undefined;
  telemetry.set({});
  history.set([]);
  resetRoomTelemetry();
  snapshot.set({ roomId: 'S1_02', powerW: 1716.7, energyKwh: null, components: { hvac: 1148.7, lighting: 288, socket: 280, ict: 3.7 }, timestamp: new Date().toISOString(), occupancy: 35, status: 'ONLINE', quality: 'good' });
  mode.set('DEMO'); connection.set({ status: 'DEMO', error: '', endpoint: '' });
  Object.entries(bases).forEach(([system, config]) => record(makeDemoMessage(system, config.watts, config)));
  chartTick();
  demoTimer = setInterval(() => {
    Object.entries(bases).forEach(([system, config]) => {
      if (system === 'ICT' || system === 'Camera' || system === 'AP') return;
      record(makeDemoMessage(system, jitter(config.watts, system === 'HVAC' ? 9 : 10), config));
    });
    chartTick();
  }, 1000);
  ictTimer = setInterval(() => {
    if (connectionValue() !== 'DEMO') { clearInterval(ictTimer); return; }
    ['ICT', 'Camera', 'AP'].forEach((system) => record(makeDemoMessage(system, jitter(bases[system].watts, 1), bases[system])));
  }, 5000);
}
let currentConnection = 'DEMO';
connection.subscribe((value) => { currentConnection = value.status; });
function connectionValue() { return currentConnection; }
export function startLive(url: string) {
  if (demoTimer) clearInterval(demoTimer); demoTimer = undefined;
  if (ictTimer) clearInterval(ictTimer); ictTimer = undefined;
  if (liveChartTimer) clearInterval(liveChartTimer);
  telemetry.set({});
  history.set([]);
  resetRoomTelemetry();
  snapshot.set({ roomId: 'S1_02', powerW: null, energyKwh: null, components: { hvac: null, lighting: null, socket: null, ict: null }, timestamp: new Date().toISOString(), occupancy: null, status: 'UNKNOWN', quality: 'unknown' });
  provider.connect(url, record, (status, error = '') => connection.set({ status, error, endpoint: url }));
  mode.set('LIVE');
  liveChartTimer = setInterval(() => {
    let room: RoomSnapshot;
    snapshot.subscribe((value) => { room = value; })();
    history.update((points) => [...points, { time: Date.now(), total: room!.powerW, hvac: room!.components.hvac, lighting: room!.components.lighting, socket: room!.components.socket, ict: room!.components.ict }].filter((p) => Date.now() - p.time <= 120000).slice(-300));
  }, 1000);
}
export function stopTelemetry() { provider.close(); if (demoTimer) clearInterval(demoTimer); if (ictTimer) clearInterval(ictTimer); if (liveChartTimer) clearInterval(liveChartTimer); }
export const telemetryRows = derived(telemetry, ($telemetry) => Object.values($telemetry).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
