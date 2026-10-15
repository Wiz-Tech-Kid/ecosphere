import { derived } from 'svelte/store';
import { telemetryRows } from './telemetry';
import type { EnergyDevice } from '../types/energy';

export const devices = derived(telemetryRows, (rows): EnergyDevice[] => rows.map((row) => ({
  device_id: row.deviceId,
  device_type: row.system,
  location: [row.message.building_id, row.message.floor_id, row.roomId].filter((part) => part && part !== '—').join(' / ') || 'Location unavailable',
  status: row.state,
  current_power_w: row.powerW,
  energy_kwh: row.energyKwh,
  last_seen: row.timestamp || null,
  quality: row.quality,
  data_origin: row.origin,
  measurement_boundary: row.boundary || null
})));
