<script lang="ts">
  import { Select as BitsSelect } from 'bits-ui';
  import Button from 'flowbite-svelte/Button.svelte';
  import { appHref } from '../../app/routes';
  import PowerChart from '../../components/charts/PowerChart.svelte';
  import campusBuilding from '@assets/Campus_Pictures_064_1792061215722.jpg';
  import {
    sites,
    buildings,
    floors,
    rooms as campusRooms
  } from '../../stores/hierarchy';
  import { snapshot, connection } from '../../stores/telemetry';
  import { devices } from '../../stores/devices';

  let selectedSiteId = $state('BU_MAIN_CAMPUS');
  let selectedBuildingId = $state('SWANENG');
  let selectedFloorId = $state('S1');
  let selectedRoomId = $state('S1_02');
  let availableBuildings = $derived($buildings.filter((building) => building.siteId === selectedSiteId));
  let availableFloors = $derived($floors.filter((floor) => floor.buildingId === selectedBuildingId));
  let availableRooms = $derived($campusRooms.filter((room) => room.floorId === selectedFloorId));
  let selectedSite = $derived($sites.find((site) => site.id === selectedSiteId));
  let selectedBuilding = $derived($buildings.find((building) => building.id === selectedBuildingId));
  let selectedRoom = $derived($campusRooms.find((room) => room.id === selectedRoomId));
  let reportingRooms = $derived($campusRooms.filter((room) => room.lastSeen !== null).length);
  let rack = $derived($devices.find((device) => device.device_id === 'DBR_RACK_S1'));
  let roomHasData = $derived(selectedRoomId === 'S1_02' && $snapshot.powerW !== null);
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  const statusClass = (status: string) => status === 'LIVE' ? 'good' : status === 'OFFLINE' || status === 'ERROR' ? 'offline' : status === 'DEMO' ? 'simulated' : 'unknown';

  function chooseRoom(roomId: string): void {
    const room = $campusRooms.find((item) => item.id === roomId);
    if (room) selectedRoomId = room.id;
  }

  function chooseSite(siteId: string): void {
    const site = $sites.find((item) => item.id === siteId);
    if (!site) return;

    selectedSiteId = site.id;
    selectedBuildingId = $buildings.find((item) => item.siteId === site.id)?.id ?? '';
    selectedFloorId = $floors.find((item) => item.buildingId === selectedBuildingId)?.id ?? '';
    selectedRoomId = $campusRooms.find((item) => item.floorId === selectedFloorId)?.id ?? '';
  }
  function chooseBuilding(buildingId: string): void {
    const building = $buildings.find((item) => item.id === buildingId);
    if (!building) return;

    selectedBuildingId = building.id;
    selectedSiteId = building.siteId;
    selectedFloorId = $floors.find((item) => item.buildingId === building.id)?.id ?? '';
    selectedRoomId = $campusRooms.find((item) => item.floorId === selectedFloorId)?.id ?? '';
  }
  function chooseFloor(floorId: string): void {
    const floor = $floors.find((item) => item.id === floorId);
    if (!floor) return;

    selectedFloorId = floor.id;
    const building = $buildings.find((item) => item.id === floor.buildingId);
    if (building) {
      selectedBuildingId = building.id;
      selectedSiteId = building.siteId;
    }
    selectedRoomId = $campusRooms.find((item) => item.floorId === floor.id)?.id ?? '';
  }
</script>

<style>
  .location-hero {
    display: grid;
    grid-template-columns: minmax(210px, 0.8fr) minmax(0, 1.4fr);
    align-items: end;
    gap: 24px;
    min-height: 235px;
    padding: 23px;
    overflow: visible;
    background-image:
      linear-gradient(90deg, color-mix(in srgb, var(--paper) 97%, transparent), color-mix(in srgb, var(--paper) 82%, transparent) 55%, color-mix(in srgb, var(--paper) 68%, transparent)),
      var(--site-image);
    background-size: cover;
    background-position: center 43%;
  }

  .location-hero-copy h2 {
    margin: 0;
    color: var(--ink);
    font: 700 21px/1.2 var(--display);
  }

  .location-hero-copy p {
    max-width: 290px;
    margin: 9px 0 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.55;
  }

  .location-steps {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .location-steps label {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font: 9px var(--mono);
    text-transform: uppercase;
  }

  .location-steps :global(.select-small) {
    width: 100%;
    height: 38px;
  }

  .location-crumb {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: -8px;
    color: var(--muted);
    font: 10px var(--mono);
  }

  .location-crumb strong {
    color: var(--ink);
    font-weight: 600;
  }

  :global(.bits-select-content) {
    z-index: 50;
    min-width: var(--bits-select-anchor-width, 180px);
    max-height: 16rem;
    overflow: auto;
    padding: 4px;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 5px;
    box-shadow: var(--shadow);
  }

  :global(.bits-select-item) {
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 7px 9px;
    color: var(--ink);
    border-radius: 3px;
    cursor: pointer;
    font: 11px var(--mono);
    outline: none;
  }

  :global(.bits-select-item[data-highlighted]),
  :global(.bits-select-item[data-selected]) {
    color: var(--ink);
    background: var(--accent-soft);
  }

  @media (max-width: 760px) {
    .location-hero {
      grid-template-columns: 1fr;
      gap: 18px;
      padding: 19px;
      background-position: center;
    }

    .location-crumb {
      margin-top: 0;
    }
  }

  @media (max-width: 430px) {
    .location-steps {
      grid-template-columns: 1fr;
    }

    .location-hero {
      padding: 15px;
    }
  }
</style>

<div class="content fade-in">
  <div class="page-head">
    <div><div class="eyebrow">LOCATION REGISTER</div><h1 class="page-title">Sites & spaces</h1><p class="page-sub">Select a campus, building, floor and room to inspect its known measurement boundaries.</p></div>
    <span class="tag {$connection.status === 'LIVE' ? 'good' : 'unknown'}">{reportingRooms} / {$campusRooms.length} rooms reporting</span>
  </div>

  <section class="location-hero panel" style={`--site-image:url("${campusBuilding}")`} aria-label="Location hierarchy selector">
    <div class="location-hero-copy">
      <div class="eyebrow">{selectedSite?.name || 'CAMPUS'} · {selectedBuilding?.name || 'BUILDING'}</div>
      <h2>Choose a monitored space</h2>
      
    </div>
    <div class="location-steps">
      <label>Campus
        <BitsSelect.Root type="single" bind:value={selectedSiteId} items={$sites.map((site) => ({ value: site.id, label: site.name }))} onValueChange={(value) => value && chooseSite(value)}>
          <BitsSelect.Trigger class="select-small bits-select-trigger" aria-label="Select campus"><BitsSelect.Value placeholder="Select campus" /><span aria-hidden="true">⌄</span></BitsSelect.Trigger>
          <BitsSelect.Portal><BitsSelect.Content class="bits-select-content" sideOffset={4}><BitsSelect.Viewport>{#each $sites as site}<BitsSelect.Item class="bits-select-item" value={site.id} label={site.name}>{site.name}</BitsSelect.Item>{/each}</BitsSelect.Viewport></BitsSelect.Content></BitsSelect.Portal>
        </BitsSelect.Root>
      </label>
      <label>Building
        <BitsSelect.Root type="single" bind:value={selectedBuildingId} items={availableBuildings.map((building) => ({ value: building.id, label: building.name }))} onValueChange={(value) => value && chooseBuilding(value)}>
          <BitsSelect.Trigger class="select-small bits-select-trigger" aria-label="Select building"><BitsSelect.Value placeholder="Select building" /><span aria-hidden="true">⌄</span></BitsSelect.Trigger>
          <BitsSelect.Portal><BitsSelect.Content class="bits-select-content" sideOffset={4}><BitsSelect.Viewport>{#each $buildings.filter((building) => building.siteId === selectedSiteId) as building}<BitsSelect.Item class="bits-select-item" value={building.id} label={building.name}>{building.name}</BitsSelect.Item>{/each}</BitsSelect.Viewport></BitsSelect.Content></BitsSelect.Portal>
        </BitsSelect.Root>
      </label>
      <label>Floor
        <BitsSelect.Root type="single" bind:value={selectedFloorId} items={availableFloors.map((floor) => ({ value: floor.id, label: floor.name }))} onValueChange={(value) => value && chooseFloor(value)}>
          <BitsSelect.Trigger class="select-small bits-select-trigger" aria-label="Select floor"><BitsSelect.Value placeholder="Select floor" /><span aria-hidden="true">⌄</span></BitsSelect.Trigger>
          <BitsSelect.Portal><BitsSelect.Content class="bits-select-content" sideOffset={4}><BitsSelect.Viewport>{#each $floors.filter((floor) => floor.buildingId === selectedBuildingId) as floor}<BitsSelect.Item class="bits-select-item" value={floor.id} label={floor.name}>{floor.name}</BitsSelect.Item>{/each}</BitsSelect.Viewport></BitsSelect.Content></BitsSelect.Portal>
        </BitsSelect.Root>
      </label>
      <label>Room
        <BitsSelect.Root type="single" bind:value={selectedRoomId} items={availableRooms.map((room) => ({ value: room.id, label: `${room.id} · ${room.lastSeen ? 'telemetry' : 'no telemetry'}` }))} onValueChange={(value) => value && chooseRoom(value)}>
          <BitsSelect.Trigger class="select-small bits-select-trigger" aria-label="Select room"><BitsSelect.Value placeholder="Select room" /><span aria-hidden="true">⌄</span></BitsSelect.Trigger>
          <BitsSelect.Portal><BitsSelect.Content class="bits-select-content" sideOffset={4}><BitsSelect.Viewport>{#each availableRooms as room}<BitsSelect.Item class="bits-select-item" value={room.id} label={`${room.id} · ${room.lastSeen ? 'telemetry' : 'no telemetry'}`}>{room.id} · {room.lastSeen ? 'telemetry' : 'no telemetry'}</BitsSelect.Item>{/each}</BitsSelect.Viewport></BitsSelect.Content></BitsSelect.Portal>
        </BitsSelect.Root>
      </label>
    </div>
    <div class="location-crumb" aria-label="Selected location">
      {selectedSite?.name || 'Campus'} <span>/</span>
      {selectedBuilding?.name || 'Building'} <span>/</span>
      {selectedFloorId || 'Floor'} <span>/</span><strong>{selectedRoomId || 'Room'}</strong>
    </div>
  </section>

  <div class="grid two-col" style="margin-top:15px">
    <section class="panel panel-pad">
      <div class="panel-head"><div><h2 class="panel-title">{selectedRoomId} · Room detail</h2><div class="panel-note">{$buildings.find((building) => building.id === selectedBuildingId)?.name} · Floor {selectedFloorId}</div></div><span class="tag {selectedRoom?.lastSeen ? (selectedRoom.origin === 'simulated' ? 'simulated' : 'good') : 'missing'}">{selectedRoom?.lastSeen ? (selectedRoom.origin === 'simulated' ? 'REFERENCE DATA' : selectedRoom.origin || 'REPORTED') : 'NO TELEMETRY'}</span></div>
      <div class="grid stats" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        <div class="panel metric"><div class="metric-label">Direct room demand</div><div class="metric-value" style="font-size:20px">{roomHasData ? power($snapshot.powerW) : 'Unavailable'}</div><div class="metric-foot">HVAC + lighting + sockets only</div></div>
        <div class="panel metric"><div class="metric-label">{selectedRoom?.origin === 'simulated' ? 'Energy · demo session' : 'Energy reported'}</div><div class="metric-value" style="font-size:20px">{selectedRoomId === 'S1_02' && $snapshot.energyKwh !== null ? `${$snapshot.energyKwh.toFixed(4)} kWh` : 'Unavailable'}</div><div class="metric-foot">{selectedRoomId === 'S1_02' && $snapshot.energyKwh !== null ? (selectedRoom?.origin === 'simulated' ? 'Simulated integration · session only' : 'Period depends on source contract') : 'No valid energy value available'}</div></div>
      </div>
      <div class="location-row"><span class="location-name">HVAC power · state</span><span class="location-value">{selectedRoomId === 'S1_02' ? `${power($snapshot.components.hvac)} · ${$devices.find((device) => device.device_id === 'HVAC_S1_02')?.status || 'Unavailable'}` : 'Unavailable'}</span></div>
      <div class="location-row"><span class="location-name">Lighting power</span><span class="location-value">{selectedRoomId === 'S1_02' ? power($snapshot.components.lighting) : 'Unavailable'}</span></div>
      <div class="location-row"><span class="location-name">Socket power</span><span class="location-value">{selectedRoomId === 'S1_02' ? power($snapshot.components.socket) : 'Unavailable'}</span></div>
      <div class="quality-note">Room data origin: {selectedRoom?.origin || 'unknown'} · quality: {selectedRoom?.quality || 'missing'} · last seen: {selectedRoom?.lastSeen ? new Date(selectedRoom.lastSeen).toLocaleTimeString() : 'never'}.</div>
      <div class="actions" style="margin-top:14px"><Button class="btn primary" href={appHref(`/rooms/${selectedRoomId}`)}>Inspect room telemetry</Button><span class="panel-note">Camera/AP values are attribution only.</span></div>
    </section>

    <div class="grid">
      <section class="panel panel-pad">
        <div class="panel-head"><div><h2 class="panel-title">Room demand trend</h2><div class="panel-note">{selectedRoomId} · watts · rolling 120-second browser buffer</div></div><span class="tag {statusClass($connection.status)}">{$connection.status === 'DEMO' ? 'SIMULATED' : $connection.status}</span></div>
        {#if roomHasData}<PowerChart />{:else}<div class="notice">No trend is available for {selectedRoomId}; no history is fabricated.</div>{/if}
      </section>
      <section class="panel panel-pad">
        <div class="panel-head"><div><h2 class="panel-title">Known shared boundary</h2><div class="panel-note">Floor infrastructure is distinct from room demand.</div></div><span class="tag unknown">S1 · DBR RACK</span></div>
        <div class="location-row"><span class="location-name">DBR rack power</span><span class="location-value">{power(rack?.current_power_w ?? null)}</span></div>
        <div class="quality-note">The floor rack is measured separately. Camera and access-point telemetry is attribution information and is not added again to the DBR input or this room's direct load.</div>
      </section>
    </div>
  </div>
</div>
