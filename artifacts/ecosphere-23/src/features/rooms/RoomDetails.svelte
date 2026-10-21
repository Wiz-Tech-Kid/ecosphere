<script lang="ts">
  import { appHref } from '../../app/routes';
  import { onMount } from 'svelte';
  import PowerChart from '../../components/charts/PowerChart.svelte';
  import { snapshot, connection, demoScenario, setDemoScenario } from '../../stores/telemetry';
  import { devices } from '../../stores/devices';
  let { roomId = 'S1_02' } = $props<{ roomId?: string }>();
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => now = Date.now(), 1000);
    return () => clearInterval(timer);
  });
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  const label = (status: string) => status === 'DEMO' ? 'Reference data' : status;
  const systems = [
    { name: 'HVAC', key: 'hvac', device: 'HVAC_S1_02', info: 'Room system' },
    { name: 'Lighting', key: 'lighting', device: 'LIGHTING_S1_02', info: 'Room system' },
    { name: 'Socket', key: 'socket', device: 'NT_SOCKET_001', info: 'Room system' },
    { name: 'ICT attribution', key: 'ict', device: 'CAM_S1_02', info: 'Endpoint attribution only' }
  ] as const;
  let roomRack = $derived($devices.find((device) => device.device_id === 'DBR_RACK_S1'));
  let camera = $derived($devices.find((device) => device.device_id === 'CAM_S1_02'));
  let ap = $derived($devices.find((device) => device.device_id === 'AP_S1_02'));
  let snapshotStale = $derived($connection.status !== 'DEMO' && $snapshot.powerW !== null && (!Number.isFinite(new Date($snapshot.timestamp).getTime()) || now - new Date($snapshot.timestamp).getTime() > 10000));
</script>

<div class="content fade-in">
  {#if roomId !== 'S1_02'}
    <div class="page-head"><div><div class="crumbline"><a href={appHref('/sites')}>BU MAIN CAMPUS</a><span>/</span><a href={appHref('/sites')}>SWANENG</a><span>/</span><a href={appHref('/sites')}>S1</a><span>/</span><strong>{roomId}</strong></div><h1 class="page-title">Room {roomId}</h1><p class="page-sub">SWANENG · Floor S1 · telemetry has not been received for this room.</p></div><span class="tag missing">NO TELEMETRY</span></div>
    <section class="panel panel-pad"><div class="eyebrow">MEASUREMENT BOUNDARY</div><h2 class="panel-title">Readings unavailable</h2><p class="page-sub">No room power, energy, system state or quality values are available for {roomId}. This is not a zero reading.</p></section>
  {:else}
  <div class="page-head"><div><div class="crumbline"><a href={appHref('/sites')}>BU MAIN CAMPUS</a><span>/</span><a href={appHref('/sites')}>SWANENG</a><span>/</span><a href={appHref('/sites')}>S1</a><span>/</span><strong>{roomId}</strong></div><h1 class="page-title">Room {roomId}</h1><p class="page-sub">SWANENG · Floor S1 · direct room boundary with provenance carried through each reading.</p></div>
    <div class="actions"><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' || $connection.status === 'ERROR' ? 'offline' : 'unknown'}">{label($connection.status)}</span>
    {#if $connection.status === 'DEMO'}<label class="panel-note" for="demo-scenario">Demo HVAC scenario</label><select id="demo-scenario" class="select-small" value={$demoScenario} onchange={(event) => setDemoScenario((event.currentTarget as HTMLSelectElement).value as typeof $demoScenario)}><option value="normal">Normal operation</option><option value="hvac-reduced">Reduced HVAC</option><option value="hvac-off">HVAC off</option><option value="high-cooling">High cooling demand</option></select>{/if}</div>
  </div>
  <section class="panel panel-pad">
    <div class="room-hero"><div><div class="eyebrow">DIRECT ROOM LOAD</div><div class="room-total">{power($snapshot.powerW)} <small>{snapshotStale ? 'last reported · stale' : 'current reading'}</small></div><div class="panel-note">HVAC + lighting + socket · ICT attribution excluded</div></div><div><span class="tag {snapshotStale ? 'stale' : $snapshot.quality === 'good' ? 'good' : $snapshot.quality === 'partial' ? 'partial' : 'unknown'}">{snapshotStale ? 'STALE' : `${$snapshot.quality} quality`}</span><div class="quality-note">Origin {$snapshot.origin} · updated {$snapshot.timestamp ? new Date($snapshot.timestamp).toLocaleTimeString() : 'unavailable'}</div></div></div>
  </section>
  <div class="mode-banner"><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' || $connection.status === 'ERROR' ? 'offline' : 'unknown'}">{label($connection.status)}</span><span>{#if $connection.status === 'LIVE'}Values are received from the configured stream. Missing measurements remain unavailable.{:else if $connection.status === 'DEMO'}These are simulated reference values, not physical meter readings.{:else if $connection.status === 'CONNECTING' || $connection.status === 'RECONNECTING'}Waiting for a live stream. No reference readings are substituted.{:else}Live telemetry is unavailable. No reference readings are substituted.{/if}</span></div>
  <div class="room-systems">{#each systems as system}
    {@const val = $snapshot.components[system.key]}
    {@const device = $devices.find((item) => item.device_id === system.device)}
    <div class="panel system-card"><div class="sys-top"><div class="sys-name">{system.name}</div><span class="tag {snapshotStale && device ? 'stale' : device?.data_origin === 'measured' ? 'good' : device ? 'unknown' : 'missing'}">{snapshotStale && device ? 'STALE' : device ? (device.data_origin === 'simulated' ? 'REFERENCE' : device.data_origin) : 'NO TELEMETRY'}</span></div><div class="sys-power">{power(val)}</div><div class="sys-info">{system.info} · {device?.quality || 'unknown'} quality</div></div>
  {/each}</div>
  <div class="grid two-col" style="margin-top:15px">
    <section class="panel panel-pad"><div class="panel-head"><div><h2 class="panel-title">Power · rolling window</h2><div class="panel-note">Browser buffer, capped at 120 seconds / 300 points</div></div><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{label($connection.status)}</span></div><PowerChart /></section>
    <section class="panel panel-pad"><div class="panel-head"><h2 class="panel-title">Room conditions</h2><span class="panel-note">S1_02</span></div>
      <div class="location-row"><span class="location-name">Occupancy</span><span class="location-value">{$snapshot.occupancy === null ? 'Unavailable' : `${$snapshot.occupancy} people`}</span></div>
      <div class="location-row"><span class="location-name">HVAC state</span><span class="location-value">{$devices.find((d) => d.device_type === 'HVAC')?.status || 'Unavailable'}</span></div>
      <div class="location-row"><span class="location-name">{$snapshot.origin === 'simulated' ? 'Demo session energy' : 'Reported energy'}</span><span class="location-value">{$snapshot.energyKwh === null ? 'Unavailable' : `${$snapshot.energyKwh.toFixed(4)} kWh`}</span></div>
      <div class="quality-note">Camera {power(camera?.current_power_w ?? null)} and AP {power(ap?.current_power_w ?? null)} are endpoint attribution, not added to direct load. The shared floor DBR rack is {power(roomRack?.current_power_w ?? null)} at the floor boundary; it also remains outside this room total.</div>
    </section>
  </div>
  {/if}
</div>
