import type { TelemetryMessage } from '../../types/telemetry';

export type Listener = (message: TelemetryMessage) => void;
const stamp = () => new Date().toISOString();
export function makeDemoMessage(system: string, watts: number, opts: { device?: string; room?: string; boundary?: string; state?: string } = {}): TelemetryMessage {
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
    timestamp: stamp(),
    measurements: { active_power_w: watts },
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

  connect(url: string, onMessage: Listener, onState: (state: 'CONNECTING' | 'LIVE' | 'OFFLINE', error?: string) => void) {
    this.close();
    const generation = this.generation;
    let invalidMessageSeen = false;
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
      onState('CONNECTING');
      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch (error) {
        onState('OFFLINE', error instanceof Error ? error.message : 'Could not open WebSocket.');
        scheduleRetry();
        return;
      }
      this.socket = socket;
      socket.onopen = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        this.retryDelay = 1000;
        onState('LIVE');
      };
      socket.onerror = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        onState('OFFLINE', 'WebSocket connection failed. Retrying; check the endpoint and bridge availability.');
      };
      socket.onclose = () => {
        if (generation !== this.generation || this.socket !== socket) return;
        this.socket = null;
        onState('OFFLINE', 'WebSocket connection closed. Retrying.');
        scheduleRetry();
      };
      socket.onmessage = (event) => {
        if (generation !== this.generation || this.socket !== socket) return;
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed || typeof parsed !== 'object') {
            invalidMessageSeen = true;
            onState('LIVE', 'A received event was not a JSON telemetry object.');
            return;
          }
          const raw = parsed as Record<string, unknown>;
          const location = (key: string): string | undefined => {
            const aliases: Record<string, string> = { organization_id: 'organization', site_id: 'site', building_id: 'building', floor_id: 'floor', room_id: 'room', space_id: 'space' };
            const value = raw[key] ?? raw[aliases[key]];
            if (typeof value === 'string') return value;
            if (value && typeof value === 'object') {
              const entity = value as { id?: unknown; code?: unknown; name?: unknown };
              if (entity.id !== undefined) return String(entity.id);
              if (entity.code !== undefined) return String(entity.code);
              if (entity.name !== undefined) return String(entity.name);
            }
            return undefined;
          };
          const message = {
            ...raw,
            schema_version: String(raw.schema_version || 'unknown'),
            timestamp: String(raw.timestamp || raw.last_updated || ''),
            organization_id: location('organization_id'),
            site_id: location('site_id'),
            building_id: location('building_id'),
            floor_id: location('floor_id'),
            room_id: location('room_id'),
            measurements: raw.measurements && typeof raw.measurements === 'object' ? raw.measurements : undefined
          } as TelemetryMessage;
          onMessage(message);
          if (invalidMessageSeen) {
            invalidMessageSeen = false;
            onState('LIVE');
          }
        }
        catch {
          invalidMessageSeen = true;
          onState('LIVE', 'A received event was not valid JSON telemetry.');
        }
      };
    };
    open();
  }
  close() {
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
