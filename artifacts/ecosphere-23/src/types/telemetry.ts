export type DataQuality = 'good' | 'partial' | 'missing' | 'unknown';
export type DataOrigin = 'simulated' | 'measured' | 'calculated' | 'inferred' | 'reported' | 'unknown';
export type ConnectionMode = 'DEMO' | 'LIVE';
export type ConnectionStatus = 'DEMO' | 'CONNECTING' | 'LIVE' | 'OFFLINE';

export interface TelemetryMeasurements {
  voltage_v?: number | null;
  current_a?: number | null;
  active_power_w?: number | null;
  real_power_w?: number | null;
  apparent_power_va?: number | null;
  power_factor?: number | null;
  frequency_hz?: number | null;
  active_energy_kwh?: number | null;
  energy_kwh?: number | null;
}

export interface TelemetryMessage {
  schema_version: string;
  telemetry_type?: string;
  organization_id?: string;
  site_id?: string;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  space_id?: string;
  device_id?: string;
  endpoint_id?: string;
  source_type?: string;
  source_id?: string;
  measurement_boundary?: string;
  timestamp: string;
  measurements?: TelemetryMeasurements;
  state?: Record<string, unknown>;
  quality?: string;
  data_origin?: string;
  components?: Record<string, number | null | { measurements?: TelemetryMeasurements; active_power_w?: number | null; real_power_w?: number | null; state?: Record<string, unknown>; quality?: string; data_origin?: string }>;
}

export interface NormalizedTelemetry {
  key: string;
  deviceId: string;
  system: string;
  roomId: string;
  powerW: number | null;
  energyKwh: number | null;
  timestamp: string;
  state: string;
  quality: DataQuality;
  origin: DataOrigin;
  telemetryType: string;
  boundary?: string;
  message: TelemetryMessage;
}
