/* ═══════════════════════════════════════════════════════════════
   POWAMOV ECOSPHERE v2.1 — Emissions Engine
   Calculates CO₂ emissions and offsets from sensor telemetry.
══════════════════════════════════════════════════════════════ */

import type { IndustrialTelemetry, CampusTelemetry } from "./telemetryEngine";

/* Emission factors */
const GRID_INTENSITY_BW  = 0.734;  // kg CO₂ / kWh  (Botswana grid)
const GRID_INTENSITY_ZA  = 0.655;  // kg CO₂ / kWh  (South Africa)
const DIESEL_KG_PER_L    = 2.68;   // kg CO₂ / litre diesel
const POWAMOV_OFFSET_PCT = 0.082;  // Estimated POWAMOV harvest as % of grid draw

/* ─── Industrial ─── */

export interface IndustrialEmissions {
  gridCo2Kg:        number;
  dieselCo2Kg:      number;
  totalCo2Kg:       number;
  intensityGco2Kwh: number;
  offsetKg:         number;       // POWAMOV offset (estimated)
  netCo2Kg:         number;
}

export function calcIndustrialEmissions(state: IndustrialTelemetry): IndustrialEmissions {
  const gridCo2Kg   = state.power.totalKwh * GRID_INTENSITY_BW;
  const dieselCo2Kg = state.generator.isOn
    ? state.generator.dieselLitres * DIESEL_KG_PER_L * 0.012 // ~1.2% consumed per tick
    : 0;
  const totalCo2Kg       = gridCo2Kg + dieselCo2Kg;
  const intensityGco2Kwh = (totalCo2Kg / Math.max(1, state.power.totalKwh)) * 1000;
  const offsetKg         = totalCo2Kg * POWAMOV_OFFSET_PCT;
  const netCo2Kg         = totalCo2Kg - offsetKg;
  return { gridCo2Kg, dieselCo2Kg, totalCo2Kg, intensityGco2Kwh, offsetKg, netCo2Kg };
}

export function getIndustrialRiskLevel(state: IndustrialTelemetry): "normal" | "warning" | "alert" {
  if (
    state.gas.hydrogenPpm > 65 ||
    state.fire.smokeLevelPct > 20 ||
    state.fire.heatC > 42 ||
    state.power.machineLoadPct > 94
  ) return "alert";
  if (
    state.gas.hydrogenPpm > 40 ||
    state.fire.smokeLevelPct > 12 ||
    state.fire.heatC > 36 ||
    state.power.machineLoadPct > 85 ||
    state.gas.aqi > 150
  ) return "warning";
  return "normal";
}

/* ─── Campus ─── */

export interface CampusEmissions {
  totalKwh:         number;
  co2Kg:            number;
  intensityGco2Kwh: number;
  perStudentGco2:   number;  // gCO₂ per student
  offsetKg:         number;
  netCo2Kg:         number;
}

export function calcCampusEmissions(state: CampusTelemetry): CampusEmissions {
  const totalKwh         = state.electricity.buildingKwh + state.electricity.labKwh;
  const co2Kg            = totalKwh * GRID_INTENSITY_BW;
  const intensityGco2Kwh = GRID_INTENSITY_BW * 1000;
  const perStudentGco2   = state.occupancy.students > 0
    ? (co2Kg * 1000) / state.occupancy.students
    : 0;
  const offsetKg  = co2Kg * POWAMOV_OFFSET_PCT;
  const netCo2Kg  = co2Kg - offsetKg;
  return { totalKwh, co2Kg, intensityGco2Kwh, perStudentGco2, offsetKg, netCo2Kg };
}

/* ─── POWAMOV Offset ─── */

export function calcPowamovOffset(harvestKwh: number): number {
  return harvestKwh * GRID_INTENSITY_BW; // kg CO₂ avoided
}

/* ─── Regional ─── */

export function getRegionalIntensity(country: "BW" | "ZA"): number {
  return country === "BW" ? GRID_INTENSITY_BW * 1000 : GRID_INTENSITY_ZA * 1000;
}
