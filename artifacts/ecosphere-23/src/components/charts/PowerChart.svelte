<script lang="ts">
  import { history } from '../../stores/telemetry';
  let show = { total: true, hvac: true, lighting: true, socket: true, ict: false };
  const colors: Record<string, string> = { total: 'var(--gold)', hvac: 'var(--orange)', lighting: 'var(--acid)', socket: 'var(--sky)', ict: 'var(--violet)' };
  const labels: Record<string, string> = { total: 'Room direct load', hvac: 'HVAC', lighting: 'Lighting', socket: 'Socket', ict: 'ICT attribution' };
  $: points = $history;
  $: hasValues = points.some((point) => [point.total, point.hvac, point.lighting, point.socket, point.ict].some((value) => value !== null));
  $: latestTime = points.length ? points[points.length - 1].time : Date.now();
  $: scaleW = Math.max(200, ...points.flatMap((point) => [point.total, point.hvac, point.lighting, point.socket, point.ict].filter((value): value is number => value !== null))) * 1.12;
  $: axisLabels = [scaleW, scaleW * 0.75, scaleW * 0.5, scaleW * 0.25, 0]
    .map((value) => `${(value / 1000).toFixed(value >= 1000 ? 1 : 2)} kW`);
  function xFor(time: number) {
    const progress = Math.max(0, Math.min(1, (time - (latestTime - 120000)) / 120000));
    return 44 + progress * 900;
  }
  function yFor(value: number) {
    return 188 - value / scaleW * 158;
  }
  function pathFor(key: keyof typeof show) {
    let started = false;
    return points.map((point, i) => {
      const value = point[key];
      if (value === null) {
        started = false;
        return '';
      }
      const command = started ? 'L' : 'M';
      started = true;
      return `${command} ${xFor(point.time).toFixed(1)} ${yFor(value).toFixed(1)}`;
    }).filter(Boolean).join(' ');
  }
  function toggle(key: keyof typeof show) { show = { ...show, [key]: !show[key] }; }
</script>
{#if hasValues}
<div class="chart-wrap">
  <svg viewBox="0 0 980 224" role="img" aria-label="Rolling room power history">
    {#each [40, 80, 120, 160, 200] as y}
      <line class="chart-grid" x1="43" x2="950" y1={y} y2={y} />
    {/each}
    {#each axisLabels as label, i}
      <text class="chart-label" x="2" y={44 + i * 39}>{label}</text>
    {/each}
    {#each Object.keys(show) as key}
      {#if show[key as keyof typeof show]}
        <path class="series-line" d={pathFor(key as keyof typeof show)} stroke={colors[key]} />
      {/if}
    {/each}
    {#if points.length}
      {@const latest = points[points.length - 1]}
      {#each Object.keys(show) as key}
        {@const seriesKey = key as keyof typeof show}
        {@const value = latest[seriesKey]}
        {#if show[seriesKey] && value !== null}
          <circle cx={xFor(latest.time)} cy={yFor(value)} r="3.5" fill={colors[key]} />
        {/if}
      {/each}
    {/if}
    <text class="chart-label" x="43" y="218">−120 sec</text>
    <text class="chart-label" x="905" y="218">NOW</text>
  </svg>
</div>
<div class="legend">
  {#each Object.keys(show) as key}
    <button class:off={!show[key as keyof typeof show]} on:click={() => toggle(key as keyof typeof show)}>
      <span class="legend-dot" style={`background:${colors[key]}`}></span>{labels[key]}
    </button>
  {/each}
</div>
{:else}
<div class="chart-wrap notice" style="display:grid;place-items:center">No usable measurements in the current session window.</div>
{/if}
