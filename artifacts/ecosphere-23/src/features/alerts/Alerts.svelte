<script lang="ts">
  import { alerts, alertStatuses, updateAlertStatus } from '../../stores/alerts';
  const statusFor = (id: string, initial: string) => $alertStatuses[id] || initial;
  const watts = (value: number | null) => value === null ? 'Unavailable' : `${value.toLocaleString()} W`;
  function update(id: string, event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value === 'Open' || value === 'Investigating' || value === 'Resolved') updateAlertStatus(id, value);
  }
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">OPERATIONAL ATTENTION</div><h1 class="page-title">Alerts</h1><p class="page-sub">Review attention records. Automated anomaly detection is not connected.</p></div><span class="tag unknown">LOCAL RECORDS</span></div>
  <div class="mode-banner"><span class="tag unknown">STATUS WORKFLOW</span></div>
  <div class="grid stats"><div class="panel metric"><div class="metric-label">Open</div><div class="metric-value">{$alerts.filter((a) => statusFor(a.id,a.status) === 'Open').length}</div><div class="metric-foot">Alert records</div></div><div class="panel metric"><div class="metric-label">Investigating</div><div class="metric-value">{$alerts.filter((a) => statusFor(a.id,a.status) === 'Investigating').length}</div><div class="metric-foot">Status editable locally</div></div><div class="panel metric"><div class="metric-label">Resolved</div><div class="metric-value">{$alerts.filter((a) => statusFor(a.id,a.status) === 'Resolved').length}</div><div class="metric-foot">Not persisted</div></div><div class="panel metric"><div class="metric-label">Detection</div><div class="metric-value" style="font-size:18px">Unavailable</div><div class="metric-foot">No alert service connected</div></div></div>
  <section class="panel"><div class="panel-head panel-pad" style="margin:0"><h2 class="panel-title">Alert register</h2><span class="panel-note">Severity · location · system · readings · status</span></div>
    <div class="wide-table"><div class="alert-row" style="font:9px var(--mono);color:var(--muted);border-top:1px solid var(--line)"><div>SEVERITY</div><div>LOCATION / DESCRIPTION</div><div>SYSTEM / VALUE</div><div>EXPECTED</div><div>STATUS</div></div>
    {#each $alerts as alert}<div class="alert-row"><div><div class:low={alert.severity === 'Low'} class="severity">{alert.severity}</div><div class="alert-meta">{alert.time} · {alert.category}</div></div><div class="alert-main">{alert.system} condition requires review<div class="alert-meta">{alert.location}</div></div><div class="alert-main">{alert.system}<div class="alert-meta">{watts(alert.currentPowerW)}</div></div><div class="alert-meta">{watts(alert.expectedPowerW)}</div><select class="select-small" value={statusFor(alert.id,alert.status)} onchange={(event) => update(alert.id,event)} aria-label={`Set status for ${alert.id}`}><option>Open</option><option>Investigating</option><option>Resolved</option></select></div>
    {:else}<div class="notice">No alert records are available.</div>{/each}</div>
  </section>
</div>
