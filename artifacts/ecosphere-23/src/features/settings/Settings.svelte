<script lang="ts">
  import Button from 'flowbite-svelte/Button.svelte';
  import Input from 'flowbite-svelte/Input.svelte';
  import { connection, lastMessageAt, startDemo, startLive } from '../../stores/telemetry';
  let endpoint = $state(localStorage.getItem('ecosphere-ws-url') || import.meta.env.VITE_NODE_RED_WS_URL || '');
  let notice = $state('');
  function connect() {
    endpoint = endpoint.trim();
    localStorage.setItem('ecosphere-ws-url', endpoint);
    startLive(endpoint);
    notice = 'Live connection requested. The state below changes only after the provider reports its outcome.';
  }
  function reference() { startDemo(); notice = 'Reference data selected for this browser session.'; }
</script>

<div class="content fade-in">
  <div class="page-head"><div><div class="eyebrow">APPLICATION CONFIGURATION</div><h1 class="page-title">Settings</h1><p class="page-sub">Choose a telemetry source deliberately. Invalid or failed live connections never fall back to reference data.</p></div></div>
  {#if notice}<div class="notice" role="status" style="margin-bottom:14px">{notice}</div>{/if}
  <div class="grid two-col">
    <section class="panel panel-pad"><div class="panel-head"><div><h2 class="panel-title">Telemetry connection</h2><div class="panel-note">Selected mode: {$connection.status === 'DEMO' ? 'DEMO' : 'LIVE'} · connection: {$connection.status}</div></div><span class="tag {$connection.status === 'LIVE' || $connection.status === 'DEMO' ? 'good' : $connection.status === 'OFFLINE' || $connection.status === 'ERROR' ? 'offline' : 'unknown'}">{$connection.status}</span></div>
      <label class="eyebrow" for="ws-url">WEBSOCKET BRIDGE URL</label><Input id="ws-url" type="url" class="setting-input" style="width:100%;margin:5px 0 12px" bind:value={endpoint} placeholder="wss://your-telemetry-host/stream" autocomplete="url" />
      <div class="panel-note" style="line-height:1.6;margin:7px 0 15px">Saved in this browser only. Use a reachable ws:// or wss:// bridge endpoint; a hosted application cannot reach localhost on your computer. DEMO remains the default at launch.</div>
      <div class="actions"><Button class="btn primary" onclick={connect}>Connect LIVE</Button><Button class="btn" onclick={reference}>Use reference data</Button></div>
      {#if $connection.error}<div class="notice" role="alert" style="margin-top:14px">{$connection.status} · {$connection.error}</div>{/if}
      <div class="location-row"><span class="location-name">Last successful message</span><span class="location-value">{$lastMessageAt ? new Date($lastMessageAt).toLocaleString() : 'None received'}</span></div>
    </section>
    <section class="panel panel-pad"><div class="panel-head"><h2 class="panel-title">Data handling</h2><span class="tag good">BROWSER ONLY</span></div>
      <div class="location-row"><span class="location-name">Rolling trend buffer</span><span class="location-value">≤ 120 seconds / 300 points</span></div>
      <div class="location-row"><span class="location-name">Telemetry source identity</span><span class="location-value">Preserved in normalized records</span></div>
      <div class="location-row"><span class="location-name">Durable history</span><span class="location-value">Not connected</span></div>
      <div class="quality-note">LIVE messages are consumed from a configurable WebSocket. The frontend does not connect directly to a REST service or database.</div>
    </section>
  </div>
</div>
