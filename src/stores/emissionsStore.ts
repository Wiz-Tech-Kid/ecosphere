import { create } from "zustand";
import ZA_2023_monthly from "../data/ZA_2023_monthly.json";
import BW_2023_monthly from "../data/BW_2023_monthly.json";

export interface EmissionData {
  date: string;
  value: number;
  gridIntensity?: number;
}

export interface ScopeData {
  scenarioValue: number;
  manualValue: number;
  scenarioPercentage: number;
  manualPercentage: number;
}

interface EmissionsState {
  scenarios: { name: string; data: EmissionData[] }[];
  manualOverrides: EmissionData[];
  addScenario: (scenario: { name: string; data: EmissionData[] }) => void;
  addManualOverride: (override: EmissionData) => void;
  resetStore: () => void;
  selectCurrentMonthData: () => Record<"emissions", ScopeData>;
}

export const useEmissionsStore = create<EmissionsState>((set, get) => ({
  // seed with ZA & BW monthly grid data
  scenarios: [
    {
      name: "ZA Grid",
      data: ZA_2023_monthly.map((entry: any) => ({
        date: entry["Datetime (UTC)"],
        value: entry["Carbon intensity gCO₂eq"]["kWh (direct)"],
        gridIntensity: entry["RE%"],
      })),
    },
    {
      name: "BW Grid",
      data: BW_2023_monthly.map((entry: any) => ({
        date: entry["Datetime (UTC)"],
        value: entry["Carbon intensity gCO₂eq"]["kWh (direct)"],
        gridIntensity: entry["RE%"],
      })),
    },
  ],
  manualOverrides: [],

  addScenario: (scenario) =>
    set((state) => ({ scenarios: [...state.scenarios, scenario] })),

  addManualOverride: (override) =>
    set((state) => ({ manualOverrides: [...state.manualOverrides, override] })),

  resetStore: () => set({ scenarios: [], manualOverrides: [] }),

  selectCurrentMonthData: () => {
    const { scenarios, manualOverrides } = get();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let scenarioValue = 0;
    let manualValue = 0;

    // sum all scenario values this month
    scenarios.forEach((sc) =>
      sc.data.forEach((d) => {
        const dt = new Date(d.date);
        if (dt.getMonth() + 1 === month && dt.getFullYear() === year) {
          scenarioValue += d.value;
        }
      })
    );

    // sum all manual overrides this month
    manualOverrides.forEach((m) => {
      const dt = new Date(m.date);
      if (dt.getMonth() + 1 === month && dt.getFullYear() === year) {
        manualValue += m.value;
      }
    });

    const total = scenarioValue + manualValue || 1;
    return {
      emissions: {
        scenarioValue,
        manualValue,
        scenarioPercentage: (scenarioValue / total) * 100,
        manualPercentage: (manualValue / total) * 100,
      },
    };
  },
}));
