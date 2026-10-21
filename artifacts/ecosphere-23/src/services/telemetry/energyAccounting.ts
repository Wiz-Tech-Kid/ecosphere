export interface RoomDirectLoads {
  hvac: number | null;
  lighting: number | null;
  socket: number | null;
}

export function sumRoomDirectPower(loads: RoomDirectLoads): number | null {
  const values = [loads.hvac, loads.lighting, loads.socket];
  if (values.some((value) => value === null || !Number.isFinite(value))) return null;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function integrateEnergyKwh(powerW: number | null, elapsedMs: number): number | null {
  if (powerW === null || !Number.isFinite(powerW) || !Number.isFinite(elapsedMs) || elapsedMs < 0) return null;
  return (powerW * elapsedMs) / 3_600_000_000;
}
