import { create } from "zustand";
import BW_2023 from "@/data/BW_2023_monthly.json";
import ZA_2023 from "@/data/ZA_2023_monthly.json";
import BW_2024 from "@/data/BW_2024_monthly.json";
import ZA_2024 from "@/data/ZA_2024_monthly.json";
import { createId } from "@/utils/createId";

export interface EmissionDataPoint {
  date: string;
  value: number;
  gridIntensity?: number;
}

export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  breakdown: Record<string, number>;
}

export interface TrackerEntry {
  id: string;
  category: string;
  value: number;
  date: string;
}

interface EmissionsState {
  gridScenarios: { name: string; data: EmissionDataPoint[] }[];
  calculatorScenarios: Scenario[];
  trackerEntries: TrackerEntry[];
  addCalculatorScenario: (s: Omit<Scenario, "id" | "createdAt">) => void;
  removeCalculatorScenario: (id: string) => void;
  addTrackerEntry: (e: Omit<TrackerEntry, "id">) => void;
  clearTrackerEntries: () => void;
}

const SCENARIOS_KEY = "e2_calculator_scenarios";
const TRACKER_KEY = "e2_tracker_entries";

const loadJson = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const bwToPoints = (data: any[]): EmissionDataPoint[] =>
  data.map((e) => ({
    date: e["Datetime (UTC)"],
    value: e["Carbon intensity gCO₂eq"]?.["kWh (direct)"] ?? 0,
    gridIntensity: e["Renewable energy percentage (RE%)"] ?? 0,
  }));

export const useEmissionsStore = create<EmissionsState>((set) => ({
  gridScenarios: [
    { name: "BW Grid 2023", data: bwToPoints(BW_2023 as any[]) },
    { name: "ZA Grid 2023", data: bwToPoints(ZA_2023 as any[]) },
    { name: "BW Grid 2024", data: bwToPoints(BW_2024 as any[]) },
    { name: "ZA Grid 2024", data: bwToPoints(ZA_2024 as any[]) },
  ],
  calculatorScenarios: loadJson<Scenario[]>(SCENARIOS_KEY, []),
  trackerEntries: loadJson<TrackerEntry[]>(TRACKER_KEY, []),

  addCalculatorScenario: (s) =>
    set((state) => {
      const newScenario: Scenario = {
        ...s,
        id: createId(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newScenario, ...state.calculatorScenarios].slice(0, 8);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));
      return { calculatorScenarios: updated };
    }),

  removeCalculatorScenario: (id) =>
    set((state) => {
      const updated = state.calculatorScenarios.filter((s) => s.id !== id);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));
      return { calculatorScenarios: updated };
    }),

  addTrackerEntry: (e) =>
    set((state) => {
      const entry: TrackerEntry = { ...e, id: createId() };
      const updated = [entry, ...state.trackerEntries].slice(0, 50);
      localStorage.setItem(TRACKER_KEY, JSON.stringify(updated));
      return { trackerEntries: updated };
    }),

  clearTrackerEntries: () => {
    localStorage.removeItem(TRACKER_KEY);
    set({ trackerEntries: [] });
  },
}));
