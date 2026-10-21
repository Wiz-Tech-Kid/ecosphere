import type { DataOrigin } from './telemetry';

export interface RoomSnapshot {
  roomId: string;
  powerW: number | null;
  energyKwh: number | null;
  components: { hvac: number | null; lighting: number | null; socket: number | null; ict: number | null };
  timestamp: string;
  occupancy: number | null;
  status: string;
  quality: string;
  origin: DataOrigin;
}
