import type { DataOrigin, DataQuality } from './telemetry';

export interface EnergySource {
  source_id: string;
  source_name: string;
  source_type: string;
  location: string | null;
  capacity: number | null;
  current_power: number | null;
  energy_today: number | null;
  status: string;
  telemetry_quality: DataQuality;
}

export interface EnergyDevice {
  device_id: string;
  device_type: string;
  location: string;
  status: string;
  current_power_w: number | null;
  energy_kwh: number | null;
  last_seen: string | null;
  quality: DataQuality;
  data_origin: DataOrigin;
  measurement_boundary: string | null;
}
