<script lang="ts">
  import { onMount } from 'svelte';
  import { connection, telemetryRows, snapshot, latestEvent, eventCount, startDemo, startLive } from '../../stores/telemetry';
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => now = Date.now(), 1000);
    return () => clearInterval(timer);
  });
  let filterSystem = $state('All systems');
  let search = $state('');
  let endpoint = $state(localStorage.getItem('ecosphere-ws-url') || import.meta.env.VITE_NODE_RED_WS_URL || '');
  let message = $state('');
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  const origin = (value: string) => value === 'simulated' ? 'Reference data' : value;
  const time = (value: string) => { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleTimeString() : 'Unavailable'; };
  let rows = $derived($telemetryRows.filter((row) =>
    (filterSystem === 'All systems' || row.system.toLowerCase() === filterSystem.toLowerCase()) &&
    (!search || `${row.deviceId} ${row.system}`.toLowerCase().includes(search.toLowerCase()))
  ));
  const isStale = (timestamp: string) => $connection.status === 'LIVE' && (!Number.isFinite(new Date(timestamp).getTime()) || now - new Date(timestamp).getTime() > 10000);
  function connect() {
    localStorage.setItem('ecosphere-ws-url', endpoint);
    startLive(endpoint);
    message = endpoint ? 'Opening configured endpoint.' : 'Enter a WebSocket endpoint in Settings before connecting.';
  }
  function useReference() { startDemo(); message = 'Reference data selected for this session.'; }
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">TELEMETRY MONITOR</div><h1 class="page-title">Live Energy</h1><p class="page-sub">Inspect received values, state, provenance, measurement quality and freshness.</p></div><div class="actions"><button class="btn" onclick={useReference}>Use reference data</button><button class="btn primary" onclick={connect}>Connect LIVE</button></div></div>
  <div class="mode-banner"><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</span><span>{$connection.error || ($connection.status === 'LIVE' ? 'Configured WebSocket connection established.' : $connection.status === 'OFFLINE' ? 'The configured live endpoint is unavailable; no reference readings are substituted.' : 'A live connection is opt-in. Connection state changes only when the stream reports it.')}</span></div>
  {#if message}<div class="notice" role="status" style="margin:-5px 0 14px">{message}</div>{/if}
  <div class="grid stats">
    <div class="panel metric"><div class="metric-label">Connection</div><div class="metric-value" style="font-size:21px">{$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</div><div class="metric-foot">LIVE only after stream connection</div></div>
    <div class="panel metric"><div class="metric-label">Observed events</div><div class="metric-value">{$eventCount}</div><div class="metric-foot">Current browser session</div></div>
    <div class="panel metric"><div class="metric-label">Last message</div><div class="metric-value" style="font-size:17px">{$latestEvent ? time($latestEvent) : 'Unavailable'}</div><div class="metric-foot">Latest normalized event time</div></div>
    <div class="panel metric"><div class="metric-label">S1_02 direct power</div><div class="metric-value accent-value">{power($snapshot.powerW)}</div><div class="metric-foot">HVAC + lighting + socket boundary</div></div>
  </div>
  <section class="panel panel-pad">
    <div class="panel-head"><div><h2 class="panel-title">Telemetry stream</h2><div class="panel-note">Null remains unavailable, never converted to zero.</div></div><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</span></div>
    <div class="filters"><select bind:value={filterSystem} aria-label="Filter system"><option>All systems</option>{#each ['HVAC','Lighting','Socket','ICT','Camera','AP'] as item}<option>{item}</option>{/each}</select><input bind:value={search} placeholder="Filter device ID…" aria-label="Filter devices" /></div>
    <div class="wide-table"><table class="table"><thead><tr><th>Device / system</th><th>Location</th><th>Power</th><th>State</th><th>Quality</th><th>Origin</th><th>Last seen</th></tr></thead><tbody>
      {#each rows as row}
        <tr><td><strong>{row.deviceId}</strong><div class="panel-note">{row.system} · {row.telemetryType}</div></td><td>{row.message.building_id || 'Unavailable'} / {row.message.floor_id || 'Unavailable'} / {row.roomId}</td><td class="mono">{power(row.powerW)}</td><td>{row.state}</td><td><span class="tag {isStale(row.timestamp) ? 'stale' : row.quality}">{isStale(row.timestamp) ? 'stale' : row.quality}</span></td><td><span class="tag {row.origin === 'measured' ? 'good' : row.origin === 'simulated' ? 'unknown' : 'calculated'}">{origin(row.origin)}</span></td><td>{time(row.timestamp)}{isStale(row.timestamp) ? ' · stale' : ''}</td></tr>
      {:else}<tr><td colspan="7">No telemetry matches these filters.</td></tr>{/each}
    </tbody></table></div>
    <div class="quality-note">Filtering is local to this session. Origin and quality are preserved from normalized telemetry; stale and absent measurements remain distinct.</div>
  </section>
</div>
