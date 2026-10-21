<script lang="ts">
  import { onMount } from 'svelte';
  import { appHref } from './routes';
  import Dashboard from '../features/dashboard/Dashboard.svelte';
  import Sites from '../features/sites/Sites.svelte';
  import RoomDetails from '../features/rooms/RoomDetails.svelte';
  import LiveEnergy from '../features/live-energy/LiveEnergy.svelte';
  import Analytics from '../features/analytics/Analytics.svelte';
  import Alerts from '../features/alerts/Alerts.svelte';
  import Settings from '../features/settings/Settings.svelte';
  import SecondaryModules from '../features/secondary/SecondaryModules.svelte';
  import { connection, startDemo, stopTelemetry } from '../stores/telemetry';

  let menuOpen = $state(false);
  let theme = $state<'dark' | 'light'>(localStorage.getItem('ecosphere-theme') === 'light' ? 'light' : 'dark');
  let path = $state(window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/');
  const sections = [
    { title: 'MONITOR', links: [['/', 'Overview', '⌂'], ['/sites', 'Sites', '⌖'], ['/live-energy', 'Live Energy', '⌁'], ['/analytics', 'Analytics', '∿'], ['/alerts', 'Alerts', '◉']] },
    { title: 'ENERGY SYSTEM', links: [['/energy-flow', 'Energy Flow', '⇢'], ['/energy-sources', 'Energy Sources', '◇'], ['/devices', 'Meters & Devices', '▦'], ['/data-sources', 'Data Sources', '↔']] },
    { title: 'OPTIMIZATION', links: [['/scheduling', 'Smart Scheduling', '◷'], ['/demand-response', 'Demand Response', '↗'], ['/rates', 'Rate Analysis', '⇄']] },
    { title: 'INSIGHT', links: [['/sustainability', 'Sustainability', '◌'], ['/costs', 'Costs', '$'], ['/reports', 'Reports', '▤']] }
  ];
  const titles: Record<string,string> = {
    '/':'Overview','/dashboard':'Overview','/sites':'Sites','/live-energy':'Live Energy','/analytics':'Analytics','/alerts':'Alerts',
    '/energy-flow':'Energy Flow','/energy-sources':'Energy Sources','/devices':'Meters & Devices','/data-sources':'Data Sources',
    '/sustainability':'Sustainability','/costs':'Costs','/reports':'Reports','/settings':'Settings','/scheduling':'Smart Scheduling',
    '/demand-response':'Demand Response','/rates':'Rate Analysis'
  };
  let currentTitle = $derived(path.startsWith('/rooms/') ? 'Room details' : (titles[path] || 'Overview'));
  let connectionLabel = $derived($connection.status === 'DEMO' ? 'DEMO · simulated' : $connection.status);

  $effect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ecosphere-theme', theme);
  });

  onMount(() => {
    startDemo();
    document.addEventListener('click', navigatePageLink);
    const update = () => { path = window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/'; };
    window.addEventListener('popstate', update);
    return () => {
      document.removeEventListener('click', navigatePageLink);
      window.removeEventListener('popstate', update);
      stopTelemetry();
    };
  });
  function navigate(event: MouseEvent, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState({}, '', appHref(href));
    path = href;
    menuOpen = false;
  }
  function navigatePageLink(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    const base = import.meta.env.BASE_URL;
    if (!destination.pathname.startsWith(base)) return;
    event.preventDefault();
    const routePart = destination.pathname.slice(base.length);
    path = routePart ? `/${routePart}` : '/';
    history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
    menuOpen = false;
  }
</script>

<svelte:head>
  <title>Ecosphere 2.3 · Energy operations</title>
  <meta name="description" content="Energy telemetry across the BU campus, from site to room." />
</svelte:head>

<div class="shell">
  <aside class:open={menuOpen} class="sidebar" aria-label="Primary navigation">
    <a href={appHref('/')} class="brand" onclick={(event) => navigate(event, '/')}>
      <span class="brand-mark">e.</span><span class="brand-name">ecosphere<span class="brand-version">2.3</span></span>
    </a>
    {#each sections as section}
      <div class="nav-label">{section.title}</div>
      {#each section.links as [href, label, icon]}
        <a href={appHref(href)} class:active={path === href || (href === '/sites' && path.startsWith('/rooms/'))} class="nav-link" onclick={(event) => navigate(event, href)}>
          <span class="nav-icon" aria-hidden="true">{icon}</span>{label}
        </a>
      {/each}
    {/each}
    <div class="side-bottom">
      <a href={appHref('/settings')} class:active={path === '/settings'} class="nav-link" onclick={(event) => navigate(event, '/settings')}><span class="nav-icon" aria-hidden="true">▧</span>Settings</a>
      <button class="theme-button" onclick={() => theme = theme === 'dark' ? 'light' : 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span>Appearance</span><strong>{theme === 'dark' ? 'DARK' : 'LIGHT'} · SWITCH</strong></button>
      <div class="mode-card">
        <div class="mode-title">TELEMETRY SOURCE</div>
        <div class="mode-line"><span class="mode-pill">{connectionLabel}</span><span class="dot" class:live={$connection.status === 'LIVE'}></span></div>
        <div class="mode-desc">{#if $connection.status === 'DEMO'}Simulated reference values · not measured{:else if $connection.status === 'LIVE'}WebSocket stream established{:else if $connection.status === 'OFFLINE' || $connection.status === 'ERROR'}Live endpoint unavailable{:else if $connection.status === 'RECONNECTING'}Stream interrupted · reconnecting{:else}Opening configured connection{/if}</div>
      </div>
    </div>
  </aside>
  <main class="main">
    <header class="topbar">
      <button class="mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>☰</button>
      <div class="crumbs"><span>BU</span><span>/</span><span>BU MAIN CAMPUS</span><span>/</span><strong>{currentTitle}</strong></div>
      <div class="top-actions"><span class="top-status"><i class="dot" class:live={$connection.status === 'LIVE'}></i>{connectionLabel}</span><div class="avatar" aria-label="B University">BU</div></div>
    </header>
    {#if path === '/' || path === '/dashboard'}
      <Dashboard />
    {:else if path === '/sites'}
      <Sites />
    {:else if path.startsWith('/rooms/')}
      <RoomDetails roomId={path.split('/')[2] || 'S1_02'} />
    {:else if path === '/live-energy'}
      <LiveEnergy />
    {:else if path === '/analytics'}
      <Analytics />
    {:else if path === '/alerts'}
      <Alerts />
    {:else if path === '/settings'}
      <Settings />
    {:else}
      <SecondaryModules {path} />
    {/if}
  </main>
</div>
