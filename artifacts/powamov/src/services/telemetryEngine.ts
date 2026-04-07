/* ═══════════════════════════════════════════════════════════════
   POWAMOV ECOSPHERE v2.1 — Telemetry Engine
   Simulates IoT data streams for Industrial and Campus scenarios.
   All state is module-level; call tick* functions then get*.
══════════════════════════════════════════════════════════════ */

function drift(v: number, min: number, max: number, step: number): number {
  return Math.max(min, Math.min(max, v + (Math.random() - 0.48) * step));
}
function driftInt(v: number, min: number, max: number, step: number): number {
  return Math.round(drift(v, min, max, step));
}

/* ─────────────────────────────────────────────────────────────
   INDUSTRIAL — Taurus Batteries
───────────────────────────────────────────────────────────── */

export interface IndustrialTelemetry {
  power: {
    totalKwh:      number;  // kWh consumed this hour
    machineLoadPct: number; // %
    peakDemandKw:  number;  // kW
  };
  generator: {
    isOn:         boolean;
    dieselLitres: number;
    runtimeHrs:   number;
  };
  gas: {
    hydrogenPpm:    number;
    chemicalIndex:  number; // 0-100
    aqi:            number; // Air Quality Index
  };
  fire: {
    smokeLevelPct: number;
    heatC:         number;
  };
  hvac: {
    ventilationPct: number;
    coolingKw:      number;
  };
  fleet: {
    trucksEntered:  number;
    forkliftActive: number;
  };
}

const _indust: IndustrialTelemetry = {
  power:     { totalKwh: 850, machineLoadPct: 72, peakDemandKw: 220 },
  generator: { isOn: false, dieselLitres: 48, runtimeHrs: 2.3 },
  gas:       { hydrogenPpm: 12, chemicalIndex: 24, aqi: 68 },
  fire:      { smokeLevelPct: 2, heatC: 24 },
  hvac:      { ventilationPct: 65, coolingKw: 18 },
  fleet:     { trucksEntered: 4, forkliftActive: 3 },
};

/* Update every 5s */
export function tickIndustrialPower(): void {
  _indust.power.totalKwh      = drift(_indust.power.totalKwh, 400, 1400, 25);
  _indust.power.machineLoadPct = drift(_indust.power.machineLoadPct, 25, 98, 4);
  _indust.power.peakDemandKw  = drift(_indust.power.peakDemandKw, 100, 450, 10);
}

/* Update every 10s */
export function tickIndustrialGenerator(): void {
  if (Math.random() < 0.04) _indust.generator.isOn = !_indust.generator.isOn;
  if (_indust.generator.isOn) {
    _indust.generator.dieselLitres = Math.max(0, _indust.generator.dieselLitres - 0.15 + Math.random() * 0.05);
    _indust.generator.runtimeHrs  += 10 / 3600;
  }
}

/* Update every 2s */
export function tickIndustrialGas(): void {
  _indust.gas.hydrogenPpm   = drift(_indust.gas.hydrogenPpm, 0, 85, 3);
  _indust.gas.chemicalIndex = drift(_indust.gas.chemicalIndex, 0, 100, 5);
  _indust.gas.aqi           = drift(_indust.gas.aqi, 20, 185, 8);
}

/* Update every 2s */
export function tickIndustrialFire(): void {
  _indust.fire.smokeLevelPct = drift(_indust.fire.smokeLevelPct, 0, 30, 1);
  _indust.fire.heatC         = drift(_indust.fire.heatC, 18, 48, 0.6);
}

/* Update every 5s */
export function tickIndustrialHVAC(): void {
  _indust.hvac.ventilationPct = drift(_indust.hvac.ventilationPct, 30, 100, 4);
  _indust.hvac.coolingKw      = drift(_indust.hvac.coolingKw, 5, 42, 2);
}

/* Update every 15s */
export function tickIndustrialFleet(): void {
  if (Math.random() < 0.35) _indust.fleet.trucksEntered++;
  _indust.fleet.forkliftActive = driftInt(_indust.fleet.forkliftActive, 0, 8, 1);
}

export function getIndustrialTelemetry(): IndustrialTelemetry {
  return {
    power:     { ..._indust.power },
    generator: { ..._indust.generator },
    gas:       { ..._indust.gas },
    fire:      { ..._indust.fire },
    hvac:      { ..._indust.hvac },
    fleet:     { ..._indust.fleet },
  };
}

/* ─────────────────────────────────────────────────────────────
   CAMPUS — Botho University
───────────────────────────────────────────────────────────── */

export interface CampusTelemetry {
  electricity: {
    buildingKwh: number;
    labKwh:      number;
  };
  hvac: {
    lectureHallsPct: number;
    labsPct:         number;
    officesPct:      number;
  };
  occupancy: {
    students:         number;
    buildingsActive:  number;
  };
  vehicles: {
    security:    number;
    maintenance: number;
  };
  lab: {
    gasPpm: number;
    tempC:  number;
  };
}

const _campus: CampusTelemetry = {
  electricity: { buildingKwh: 320, labKwh: 85 },
  hvac:        { lectureHallsPct: 72, labsPct: 88, officesPct: 55 },
  occupancy:   { students: 1240, buildingsActive: 8 },
  vehicles:    { security: 3, maintenance: 2 },
  lab:         { gasPpm: 8, tempC: 22 },
};

/* Update every 10s */
export function tickCampusElectricity(): void {
  _campus.electricity.buildingKwh = drift(_campus.electricity.buildingKwh, 80, 650, 20);
  _campus.electricity.labKwh      = drift(_campus.electricity.labKwh, 15, 210, 8);
}

/* Update every 10s */
export function tickCampusHVAC(): void {
  _campus.hvac.lectureHallsPct = drift(_campus.hvac.lectureHallsPct, 15, 100, 5);
  _campus.hvac.labsPct         = drift(_campus.hvac.labsPct, 40, 100, 4);
  _campus.hvac.officesPct      = drift(_campus.hvac.officesPct, 10, 95, 6);
}

/* Update every 20s */
export function tickCampusOccupancy(): void {
  _campus.occupancy.students        = driftInt(_campus.occupancy.students, 0, 3200, 55);
  _campus.occupancy.buildingsActive = driftInt(_campus.occupancy.buildingsActive, 2, 12, 1);
}

/* Update every 20s */
export function tickCampusVehicles(): void {
  _campus.vehicles.security    = driftInt(_campus.vehicles.security, 1, 6, 1);
  _campus.vehicles.maintenance = driftInt(_campus.vehicles.maintenance, 0, 5, 1);
}

/* Update every 5s */
export function tickCampusLab(): void {
  _campus.lab.gasPpm = drift(_campus.lab.gasPpm, 0, 55, 2);
  _campus.lab.tempC  = drift(_campus.lab.tempC, 17, 30, 0.4);
}

export function getCampusTelemetry(): CampusTelemetry {
  return {
    electricity: { ..._campus.electricity },
    hvac:        { ..._campus.hvac },
    occupancy:   { ..._campus.occupancy },
    vehicles:    { ..._campus.vehicles },
    lab:         { ..._campus.lab },
  };
}
