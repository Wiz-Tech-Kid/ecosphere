export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Open' | 'Investigating' | 'Resolved';
export type AlertCategory =
  | 'Telemetry'
  | 'Power'
  | 'Energy'
  | 'Demand'
  | 'Device State'
  | 'Communication'
  | 'Performance'
  | 'Threshold';

export interface EnergyAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  time: string;
  location: string;
  system: string;
  description: string;
  currentPowerW: number | null;
  expectedPowerW: number | null;
  status: AlertStatus;
}
