<script lang="ts">
  import { appHref } from '../../app/routes';
  import { onMount } from 'svelte';
  import PowerChart from '../../components/charts/PowerChart.svelte';
  import { snapshot, connection, history } from '../../stores/telemetry';
  import { alerts } from '../../stores/alerts';

  const systems = [
    { name: 'HVAC', key: 'hvac', css: 'hvac' },
    { name: 'Lighting', key: 'lighting', css: 'lighting' },
    { name: 'Socket', key: 'socket', css: 'socket' }
  ] as const;
  const power = (value: number | null) => value === null ? 'Unavailable' : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(1)} W`;
  const sourceLabel = (status: string) => status === 'DEMO' ? 'Reference data' : status;
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => now = Date.now(), 1000);
    return () => clearInterval(timer);
  });
  let stale = $derived($connection.status === 'LIVE' && $snapshot.powerW !== null && (!Number.isFinite(new Date($snapshot.timestamp).getTime()) || now - new Date($snapshot.timestamp).getTime() > 10000));
  let maxW = $derived(Math.max(1, ...[$snapshot.components.hvac, $snapshot.components.lighting, $snapshot.components.socket].filter((v): v is number => v !== null).map(Math.abs)));
</script>

<div class="content fade-in">
  <div class="page-head">
    <div><div class="eyebrow">BU / OPERATIONS DESK</div><h1 class="page-title">Energy, in context.</h1><p class="page-sub">A boundary-aware view of the monitored room, within a deliberately honest campus hierarchy.</p></div>
    <div class="actions"><a class="btn" href={appHref('/sites')}>Explore campus</a><a class="btn primary" href={appHref('/live-energy')}>Open live monitor</a></div>
  </div>
  <div class="mode-banner"><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{sourceLabel($connection.status)}</span>
    <span>{#if $connection.status === 'LIVE'}A live stream is established. Campus and building aggregates remain unavailable unless their boundaries are reported.{:else if $connection.status === 'OFFLINE'}Live endpoint unavailable. No reference readings are substituted.{:else}Reference data is shown for room S1_02 only; this is not a campus-wide measured total.{/if}</span>
  </div>
  <div class="grid stats">
    <div class="panel metric"><div class="metric-label">S1_02 · direct power</div><div class="metric-value accent-value">{power($snapshot.powerW)}</div><div class="metric-foot">{stale ? 'Last reported value · stale' : 'HVAC + lighting + socket'}</div></div>
    <div class="panel metric"><div class="metric-label">Room energy today</div><div class="metric-value">{$snapshot.energyKwh === null ? 'Unavailable' : `${$snapshot.energyKwh.toFixed(2)} kWh`}</div><div class="metric-foot">{$snapshot.energyKwh === null ? 'No usable energy measurement' : sourceLabel($connection.status)}</div></div>
    <div class="panel metric"><div class="metric-label">Campus peak</div><div class="metric-value" style="font-size:21px">Unavailable</div><div class="metric-foot">No complete site boundary</div></div>
    <div class="panel metric"><div class="metric-label">Energy intensity</div><div class="metric-value" style="font-size:21px">Unavailable</div><div class="metric-foot">Floor area is not supplied</div></div>
  </div>
  <div class="grid two-col">
    <section class="panel panel-pad">
      <div class="panel-head"><div><h2 class="panel-title">Room demand · rolling window</h2><div class="panel-note">Browser buffer · up to 120 seconds</div></div><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{sourceLabel($connection.status)}</span></div>
      <PowerChart />
      <div class="location-row" style="margin-top:11px"><span class="location-name">BU MAIN CAMPUS</span><span class="tag unknown">Aggregate unavailable</span></div>
      <div class="location-row"><span class="location-name">SWANENG · S1</span><span class="location-value">Partial child telemetry</span></div>
      <a class="location-row" href={appHref('/rooms/S1_02')}><span class="location-name">S1_02 · monitored room</span><span class="location-value">{power($snapshot.powerW)} →</span></a>
    </section>
    <section class="panel panel-pad">
      <div class="panel-head"><div><h2 class="panel-title">Direct room contribution</h2><div class="panel-note">Components only · ICT stays outside this total</div></div><a class="panel-note" href={appHref('/rooms/S1_02')}>Room details →</a></div>
      {#each systems as system}
        {@const amount = $snapshot.components[system.key]}
        <div class="system-row"><div class="system-label">{system.name}</div><div class="track"><div class="fill {system.css}" style={`width:${amount === null ? 0 : Math.max(3, Math.min(100, Math.abs(amount) / maxW * 100))}%`}></div></div><div class="system-val">{power(amount)}</div></div>
      {/each}
      <div class="quality-note">Camera and access-point readings are attribution only. The shared floor DBR rack is a separate electrical boundary and is never added to room direct load.</div>
      <div class="panel-head" style="margin:20px 0 4px"><h2 class="panel-title">Needs attention</h2><a class="panel-note" href={appHref('/alerts')}>Review alerts →</a></div>
      <div class="quality-note" style="margin:0 0 5px">Local records only · not generated by live anomaly detection.</div>
      {#each $alerts.slice(0, 2) as alert}
        <div class="attention"><span class="attention-mark"></span><div class="attention-copy">{alert.system} · {alert.location}<div class="attention-meta">{alert.severity} · {alert.status}</div></div></div>
      {:else}<div class="notice">No alert records are available.</div>{/each}
    </section>
  </div>
  <div class="quality-note" style="margin-top:14px">Trend points: {$history.length}. Null measurements remain unavailable; no campus total is inferred from room readings.</div>
</div>
