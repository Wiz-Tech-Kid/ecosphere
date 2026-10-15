import { writable } from 'svelte/store';
import type { AlertStatus, EnergyAlert } from '../types/alerts';

export const alerts = writable<EnergyAlert[]>([
  {
    id: 'a-1',
    severity: 'High',
    category: 'Power',
    time: '09:42:18',
    location: 'SWANENG / S1 / S1_02',
    system: 'HVAC',
    description: 'HVAC power above the configured demonstration range',
    currentPowerW: 1148.7,
    expectedPowerW: 950,
    status: 'Open'
  },
  {
    id: 'a-2',
    severity: 'Medium',
    category: 'Demand',
    time: '09:36:02',
    location: 'SWANENG / S1',
    system: 'DBR rack',
    description: 'Shared ICT boundary approaching its demonstration threshold',
    currentPowerW: 273.5,
    expectedPowerW: 250,
    status: 'Investigating'
  },
  {
    id: 'a-3',
    severity: 'Low',
    category: 'Telemetry',
    time: '08:58:41',
    location: 'SWANENG / S1 / S1_07',
    system: 'Lighting',
    description: 'Lighting telemetry unavailable for this room',
    currentPowerW: null,
    expectedPowerW: null,
    status: 'Open'
  }
]);

export const alertStatuses = writable<Record<string, AlertStatus>>({});

export function updateAlertStatus(id: string, status: AlertStatus) {
  alertStatuses.update((current) => ({ ...current, [id]: status }));
}
