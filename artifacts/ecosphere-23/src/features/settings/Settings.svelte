<script lang="ts">
  import { connection, startDemo, startLive } from '../../stores/telemetry';
  let endpoint = $state(localStorage.getItem('ecosphere-ws-url') || import.meta.env.VITE_NODE_RED_WS_URL || '');
  let notice = $state('');
  function connect() {
    localStorage.setItem('ecosphere-ws-url', endpoint);
    startLive(endpoint);
    notice = endpoint ? 'Connecting to the configured live endpoint.' : 'Endpoint saved. Enter a valid WebSocket URL to establish a connection.';
  }
  function reference() { startDemo(); notice = 'Reference data selected for this browser session.'; }
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">APPLICATION CONFIGURATION</div><h1 class="page-title">Settings</h1><p class="page-sub">Choose a telemetry source deliberately. A failed live connection remains offline.</p></div></div>
  {#if notice}<div class="notice" role="status" style="margin-bottom:14px">{notice}</div>{/if}
  <div class="grid two-col">
    <section class="panel panel-pad"><div class="panel-head"><div><h2 class="panel-title">Telemetry connection</h2><div class="panel-note">Current state: {$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</div></div><span class="tag {$connection.status === 'LIVE' ? 'good' : $connection.status === 'OFFLINE' ? 'offline' : 'unknown'}">{$connection.status === 'DEMO' ? 'Reference data' : $connection.status}</span></div>
      <label class="eyebrow" for="ws-url">NODE-RED WEBSOCKET URL</label><input id="ws-url" class="setting-input" style="width:100%;margin:5px 0 12px" bind:value={endpoint} placeholder="wss://your-telemetry-host/stream" />
      <div class="panel-note" style="line-height:1.6;margin:7px 0 15px">Endpoint is saved in this browser only. No local address is assumed. Configure the environment value or enter a bridge endpoint above.</div>
      <div class="actions"><button class="btn primary" onclick={connect}>Connect LIVE</button><button class="btn" onclick={reference}>Use reference data</button></div>
      {#if $connection.error}<div class="notice" style="margin-top:14px">OFFLINE · {$connection.error}</div>{/if}
    </section>
    <section class="panel panel-pad"><div class="panel-head"><h2 class="panel-title">Data handling</h2><span class="tag good">BROWSER ONLY</span></div>
      <div class="location-row"><span class="location-name">Rolling trend buffer</span><span class="location-value">≤ 120 seconds / 300 points</span></div>
      <div class="location-row"><span class="location-name">Telemetry source identity</span><span class="location-value">Preserved in normalized records</span></div>
      <div class="location-row"><span class="location-name">Durable history</span><span class="location-value">Not connected</span></div>
      <div class="quality-note">LIVE messages are consumed from a configurable WebSocket. The frontend does not connect directly to a REST service or database.</div>
    </section>
  </div>
</div>
