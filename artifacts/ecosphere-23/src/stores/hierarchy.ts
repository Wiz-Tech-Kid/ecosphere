import { writable } from 'svelte/store';
import type { DataOrigin, DataQuality } from '../types/telemetry';

export interface CampusRoom {
  id: string;
  organizationId: string;
  siteId: string;
  buildingId: string;
  floorId: string;
  origin: DataOrigin | null;
  quality: DataQuality;
  lastSeen: string | null;
}

export const organizations = writable([{ id: 'BU', name: 'BU' }]);
export const sites = writable([{ id: 'BU_MAIN_CAMPUS', name: 'BU MAIN CAMPUS', organizationId: 'BU' }]);
export const buildings = writable([{ id: 'SWANENG', name: 'SWANENG', siteId: 'BU_MAIN_CAMPUS' }]);
export const floors = writable([{ id: 'S1', name: 'S1', buildingId: 'SWANENG' }]);
export const rooms = writable<CampusRoom[]>(
  Array.from({ length: 13 }, (_, index) => ({
    id: `S1_${String(index + 1).padStart(2, '0')}`,
    organizationId: 'BU',
    siteId: 'BU_MAIN_CAMPUS',
    buildingId: 'SWANENG',
    floorId: 'S1',
    origin: null,
    quality: 'missing',
    lastSeen: null
  }))
);

export function resetRoomTelemetry() {
  rooms.update((items) => items.map((room) => ({
    ...room,
    origin: null,
    quality: 'missing',
    lastSeen: null
  })));
}

export function recordRoomTelemetry(roomId: string, origin: DataOrigin, quality: DataQuality, timestamp: string) {
  rooms.update((items) => items.map((room) => room.id === roomId
    ? { ...room, origin, quality, lastSeen: timestamp || null }
    : room
  ));
}
