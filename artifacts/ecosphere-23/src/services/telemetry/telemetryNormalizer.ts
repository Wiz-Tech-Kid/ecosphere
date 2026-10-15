import type { NormalizedTelemetry, TelemetryMessage } from '../../types/telemetry';

const qualities = ['good', 'partial', 'missing', 'unknown'];
const origins = ['simulated', 'measured', 'calculated', 'inferred', 'reported', 'unknown'];
export function normalizeTelemetry(message: TelemetryMessage): NormalizedTelemetry {
  const id = message.device_id || message.endpoint_id || message.room_id || 'unknown';
  const state = message.state || {};
  const value = message.measurements?.active_power_w ?? message.measurements?.real_power_w;
  const energy = message.measurements?.active_energy_kwh ?? message.measurements?.energy_kwh ?? null;
  const system = String(state.system || message.source_type || message.telemetry_type || 'Other');
  const quality = String(message.quality || '').trim().toLowerCase();
  const origin = String(message.data_origin || '').trim().toLowerCase();
  return {
    key: `${id}:${message.telemetry_type || 'power'}`,
    deviceId: id,
    system,
    roomId: message.room_id || '—',
    powerW: typeof value === 'number' && Number.isFinite(value) ? value : null,
    energyKwh: typeof energy === 'number' && Number.isFinite(energy) ? energy : null,
    timestamp: message.timestamp,
    state: String(state.status || state.state || state.device_state || (value === null || value === undefined ? 'UNKNOWN' : 'ONLINE')).toUpperCase(),
    quality: qualities.includes(quality) ? quality as NormalizedTelemetry['quality'] : 'unknown',
    origin: origins.includes(origin) ? origin as NormalizedTelemetry['origin'] : 'unknown',
    telemetryType: message.telemetry_type || 'power',
    boundary: message.measurement_boundary,
    message
  };
}
