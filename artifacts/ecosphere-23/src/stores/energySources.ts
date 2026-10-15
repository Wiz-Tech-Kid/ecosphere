import { writable } from 'svelte/store';
import type { EnergySource } from '../types/energy';

// BU source identities are intentionally unconfigured until they are verified.
export const energySources = writable<EnergySource[]>([]);
