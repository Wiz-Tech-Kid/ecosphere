import type { TelemetryMessage, TelemetryMeasurements } from '../../types/telemetry';

export type Listener = (message: TelemetryMessage) => void;
export type ProviderState = 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'OFFLINE' | 'ERROR';

const supportedMeasurements: Array<keyof TelemetryMeasurements> = [
  'voltage_v',
  'current_a',
  'active_power_w',
  'real_power_w',
  'apparent_power_va',
  'power_factor',
  'frequency_hz',
  'active_energy_kwh',
  'energy_kwh'
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readLocation(raw: Record<string, unknown>, key: string): string | undefined {
  const alias = key.replace(/_id$/, '');
  const value = raw[key] ?? raw[alias];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (isRecord(value)) {
    for (const field of ['id', 'code', 'name']) {
      const candidate = value[field];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
  }
  return undefined;
}

function normalizeIncomingMessage(value: unknown): TelemetryMessage {
  if (!isRecord(value)) throw new Error('Received event is not a JSON telemetry object.');

  const rawMeasurements = value.measurements;
  let measurements: TelemetryMeasurements | undefined;
  if (rawMeasurements !== undefined) {
    if (!isRecord(rawMeasurements)) throw new Error('Telemetry measurements must be an object.');
    for (const field of supportedMeasurements) {
      const measurement = rawMeasurements[field];
      if (measurement !== undefined && measurement !== null &&
        (typeof measurement !== 'number' || !Number.isFinite(measurement))) {
        throw new Error(`Telemetry field "${field}" must be a finite number or null.`);
      }
    }
    measurements = rawMeasurements as TelemetryMeasurements;
  }

  if (value.state !== undefined && !isRecord(value.state)) {
    throw new Error('Telemetry state must be an object.');
  }
  if (value.components !== undefined && !isRecord(value.components)) {
    throw new Error('Telemetry components must be an object.');
  }

  const timestampValue = value.timestamp ?? value.last_updated;
  const timestamp = typeof timestampValue === 'string' ? timestampValue : '';
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) {
    throw new Error('Telemetry timestamp is missing or invalid.');
  }

  const identifiers = ['device_id', 'endpoint_id', 'room_id', 'source_id']
    .map((field) => readLocation(value, field))
    .filter((field): field is string => field !== undefined);
  if (identifiers.length === 0) {
    throw new Error('Telemetry message is missing a device, endpoint, room, or source identifier.');
  }

  return {
    ...value,
    schema_version: typeof value.schema_version === 'string' ? value.schema_version : 'unknown',
    timestamp,
    organization_id: readLocation(value, 'organization_id'),
    site_id: readLocation(value, 'site_id'),
    building_id: readLocation(value, 'building_id'),
    floor_id: readLocation(value, 'floor_id'),
    room_id: readLocation(value, 'room_id'),
    device_id: readLocation(value, 'device_id'),
    endpoint_id: readLocation(value, 'endpoint_id'),
    source_id: readLocation(value, 'source_id'),
    measurements,
    state: value.state as Record<string, unknown> | undefined,
    components: value.components as TelemetryMessage['components']
  };
}

export function makeDemoMessage(
  system: string,
  watts: number,
  opts: { device?: string; room?: string; boundary?: string; state?: string } = {},
  energyKwh: number | null = null
): TelemetryMessage {
  return {
    schema_version: '2.3',
    telemetry_type: 'power',
    organization_id: 'BU',
    site_id: 'BU_MAIN_CAMPUS',
    building_id: 'SWANENG',
    floor_id: 'S1',
    room_id: opts.room || 'S1_02',
    device_id: opts.device || `${system.toUpperCase()}_S1_02`,
    source_type: system,
    measurement_boundary: opts.boundary || 'system',
    timestamp: new Date().toISOString(),
    measurements: { active_power_w: watts, active_energy_kwh: energyKwh },
    state: { status: opts.state || 'ON', system },
    quality: 'good',
    data_origin: 'simulated'
  };
}

export class NodeRedWebSocketProvider {
  socket: WebSocket | null = null;
  private generation = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private retryDelay = 1000;

  connect(url: string, onMessage: Listener, onState: (state: ProviderState, error?: string) => void): void {
    this.close();
    const generation = this.generation;
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['ws:', 'wss:'].includes(parsedUrl.protocol)) {
        throw new Error('The endpoint must use ws:// or wss://.');
      }
    } catch (error) {
      onState('ERROR', error instanceof Error ? error.message : 'Enter a valid WebSocket URL.');
      return;
    }

    let hasConnected = false;
    const scheduleRetry = () => {
      if (generation !== this.generation || this.retryTimer) return;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = undefined;
        open();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 15000);
    };

    const open = () => {
      if (generation !== this.generation) return;
      onState(hasConnected ? 'RECONNECTING' : 'CONNECTING');
      let socket: WebSocket;
      try {
        socket = new WebSocket(parsedUrl.toString());
      } catch (error) {
        onState('ERROR', error instanceof Error ? error.message : 'Could not open the WebSocket.');
        return;
      }
      this.socket = socket;
      socket.onopen = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        hasConnected = true;
        this.retryDelay = 1000;
        onState('LIVE');
      };
      socket.onerror = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        onState(hasConnected ? 'RECONNECTING' : 'OFFLINE',
          'The WebSocket connection failed. Check the endpoint and bridge availability.');
      };
      socket.onclose = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        this.socket = null;
        onState(hasConnected ? 'RECONNECTING' : 'OFFLINE',
          hasConnected ? 'The WebSocket closed. Reconnecting.' : 'The endpoint could not be reached. Retrying.');
        scheduleRetry();
      };
      socket.onmessage = (event) => {
        if (generation !== this.generation || this.socket !== socket) return;
        let decoded: unknown;
        try {
          decoded = JSON.parse(String(event.data));
        } catch {
          onState('LIVE', 'A received event was not valid JSON telemetry.');
          return;
        }
        try {
          onMessage(normalizeIncomingMessage(decoded));
          onState('LIVE');
        } catch (error) {
          onState('LIVE', error instanceof Error ? error.message : 'A received telemetry event was invalid.');
        }
      };
    };

    open();
  }

  close(): void {
    this.generation++;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState < WebSocket.CLOSING) socket.close();
    }
  }
}
