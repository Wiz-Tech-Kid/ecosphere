<script lang="ts">
  import PowerChart from '../../components/charts/PowerChart.svelte';
  import { history, snapshot, connection } from '../../stores/telemetry';
  let range = $state('Current session');
  let peak = $derived($history.map((point) => point.total).filter((value): value is number => value !== null).reduce<number | null>((max, value) => max === null ? value : Math.max(max, value), null));
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  const systems = [{ name:'HVAC', key:'hvac', css:'hvac' },{ name:'Lighting', key:'lighting', css:'lighting' },{ name:'Socket', key:'socket', css:'socket' }] as const;
  let maxW = $derived(Math.max(1,...[$snapshot.components.hvac,$snapshot.components.lighting,$snapshot.components.socket].filter((v):v is number=>v!==null).map(Math.abs)));
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">SHORT-WINDOW ANALYSIS</div><h1 class="page-title">Analytics</h1><p class="page-sub">Explore available live or browser-session history. Longer periods require durable history.</p></div><select class="select-small" bind:value={range} aria-label="Select history range"><option>Current session</option><option>Today</option><option>Yesterday</option><option>7 days</option><option>30 days</option><option>Custom</option></select></div>
  <div class="mode-banner"><span class="tag unknown">LIMITED HISTORY</span><span>The plot uses a rolling browser window of at most 120 seconds. The range selector does not imply stored historical data.</span></div>
  <div class="grid stats"><div class="panel metric"><div class="metric-label">Current room demand</div><div class="metric-value accent-value">{power($snapshot.powerW)}</div><div class="metric-foot">S1_02 · direct room boundary</div></div><div class="panel metric"><div class="metric-label">Peak in buffer</div><div class="metric-value">{power(peak)}</div><div class="metric-foot">Received non-null points</div></div><div class="panel metric"><div class="metric-label">History window</div><div class="metric-value" style="font-size:18px">{range}</div><div class="metric-foot">{$history.length} retained points</div></div><div class="panel metric"><div class="metric-label">Baseline</div><div class="metric-value" style="font-size:20px">Unavailable</div><div class="metric-foot">No baseline supplied</div></div></div>
  <div class="grid two-col"><section class="panel panel-pad"><div class="panel-head"><div><h2 class="panel-title">Demand trend</h2><div class="panel-note">Room S1_02 · W · current session</div></div><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</span></div><PowerChart /></section>
  <section class="panel panel-pad"><div class="panel-head"><h2 class="panel-title">System breakdown</h2><span class="panel-note">Direct room electrical load</span></div>
    {#each systems as system}{@const value = $snapshot.components[system.key]}<div class="system-row"><div class="system-label">{system.name}</div><div class="track"><div class="fill {system.css}" style={`width:${value === null ? 0 : Math.max(3,Math.min(100,Math.abs(value)/maxW*100))}%`}></div></div><div class="system-val">{power(value)}</div></div>{/each}
    <div class="location-row"><span class="location-name">Daily / weekly / monthly profile</span><span class="location-value">Unavailable</span></div><div class="location-row"><span class="location-name">Energy intensity</span><span class="location-value">Unavailable</span></div><div class="quality-note">Camera/AP attribution and the shared floor DBR rack are outside room direct load.</div>
  </section></div>
</div>
