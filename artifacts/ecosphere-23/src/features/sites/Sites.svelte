<script lang="ts">
  import { appHref } from '../../app/routes';
  import campusBuilding from '@assets/Campus_Pictures_064_1792061215722.jpg';
  import cityAerial from '@assets/tour4_5_1792061215723.jpg';
  import { rooms as campusRooms } from '../../stores/hierarchy';
  import { snapshot, connection } from '../../stores/telemetry';
  import { devices } from '../../stores/devices';
  let section = $state('Site');
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  let activeRooms = $derived($campusRooms.filter((room) => room.lastSeen !== null).length);
  let rack = $derived($devices.find((device) => device.device_id === 'DBR_RACK_S1'));
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">LOCATION REGISTER</div><h1 class="page-title">Sites & spaces</h1><p class="page-sub">Move from campus to building, floor and room without smoothing over missing readings.</p></div><span class="tag {$connection.status === 'LIVE' ? 'good' : 'unknown'}">{activeRooms} / {$campusRooms.length} rooms reporting</span></div>
  <div class="hierarchy">
    <aside class="panel tree">
      <div class="eyebrow">BU LOCATION TREE</div>
      {#each [{name:'BU MAIN CAMPUS',level:'Site'},{name:'SWANENG',level:'Building'},{name:'S1 · Ground floor',level:'Floor'}] as node}
        <button class="tree-item" class:selected={section === node.level} onclick={() => section = node.level}><span aria-hidden="true">⌄</span>{node.name}</button>
      {/each}
      {#each $campusRooms as room}
        <a class="tree-item tree-child" class:selected={room.id === 'S1_02'} href={appHref(`/rooms/${room.id}`)}>
          <span aria-hidden="true">↳</span>{room.id}<span class="tag {room.origin === 'measured' ? 'good' : room.lastSeen ? 'unknown' : 'missing'}">{room.lastSeen ? (room.origin === 'simulated' ? 'REFERENCE' : room.origin || 'reported') : 'NO DATA'}</span>
        </a>
      {/each}
    </aside>
    <section class="panel panel-pad">
      <div class="crumbline"><a href={appHref('/sites')}>BU MAIN CAMPUS</a><span>/</span><a href={appHref('/sites')}>SWANENG</a><span>/</span><strong>S1</strong></div>
      <div class="photo-grid">
        <div class="photo-card"><img class="site-photo" src={campusBuilding} alt="BU campus building, SWANENG site context" /><span class="photo-caption">SWANENG · CAMPUS</span></div>
        <div class="photo-card"><img class="site-photo" src={cityAerial} alt="Aerial city view of Gaborone, regional context" /><span class="photo-caption">GABORONE · REGIONAL CONTEXT</span></div>
      </div>
      <div class="panel-head"><div><h2 class="panel-title">{section} · {section === 'Floor' ? 'S1' : section === 'Building' ? 'SWANENG' : 'BU MAIN CAMPUS'}</h2><div class="panel-note">Known hierarchy entries only; no parent total is synthesized.</div></div><span class="tag unknown">AGGREGATE INCOMPLETE</span></div>
      <div class="grid stats" style="grid-template-columns:repeat(2,1fr)">
        <div class="panel metric"><div class="metric-label">Current power</div><div class="metric-value" style="font-size:19px">Unavailable</div><div class="metric-foot">No complete parent boundary</div></div>
        <div class="panel metric"><div class="metric-label">Today's energy</div><div class="metric-value" style="font-size:19px">Unavailable</div><div class="metric-foot">Partial child telemetry</div></div>
        <div class="panel metric"><div class="metric-label">Buildings · floors</div><div class="metric-value">1 <span class="metric-unit">· 1</span></div><div class="metric-foot">Known hierarchy entries</div></div>
        <div class="panel metric"><div class="metric-label">Rooms reporting</div><div class="metric-value">{activeRooms} <span class="metric-unit">of {$campusRooms.length}</span></div><div class="metric-foot">Observed in this browser session</div></div>
      </div>
      <div class="panel-head"><h2 class="panel-title">Room breakdown · S1</h2><span class="panel-note">Uninstrumented does not mean zero consumption</span></div>
      <div class="room-grid">{#each $campusRooms as room}
        <a href={appHref(`/rooms/${room.id}`)} class="room-tile" class:selected={room.id === 'S1_02'} class:no-data={!room.lastSeen}>
          <div class="room-code">{room.id}</div><div class="room-state">{room.lastSeen ? (room.origin === 'simulated' ? 'Reference data received' : `${room.origin || 'reported'} telemetry`) : 'No telemetry'}</div>
          <div class="room-power">{room.id === 'S1_02' ? power($snapshot.powerW) : 'Unavailable'}</div>
        </a>
      {/each}</div>
      <div class="quality-note">Floor ICT boundary · DBR rack: {power(rack?.current_power_w ?? null)} · {rack ? (rack.data_origin === 'simulated' ? 'REFERENCE DATA' : rack.data_origin.toUpperCase()) : 'NO TELEMETRY'}. This shared floor boundary is not included in S1_02 direct room load.</div>
    </section>
  </div>
</div>
