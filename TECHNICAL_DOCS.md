# Ecosphere v2.1 — Deep Technical Documentation

**Platform**: POWAMOV Intelligence Dashboard + Carbon Emission Telemetry Engine  
**Version**: 2.1  
**Stack**: pnpm monorepo · React 19 · Vite 7 · TypeScript 5.9 · Express 5 · TanStack Query · Zustand · Recharts · Framer Motion · Tailwind CSS v4 · Radix UI

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository & Monorepo Architecture](#2-repository--monorepo-architecture)
3. [Frontend Application — artifacts/powamov](#3-frontend-application--artifactspowamov)
4. [Routing & Authentication Architecture](#4-routing--authentication-architecture)
5. [State Management Strategy](#5-state-management-strategy)
6. [Design System & Theming](#6-design-system--theming)
7. [Module Breakdown — All Pages](#7-module-breakdown--all-pages)
8. [Telemetry Engine — services/telemetryEngine.ts](#8-telemetry-engine--servicestelemetryenginets)
9. [Emissions Engine — services/emissionsEngine.ts](#9-emissions-engine--servicesemissionsenginets)
10. [Digital Twin Physics Model](#10-digital-twin-physics-model)
11. [Static Data Layer & Zustand Store](#11-static-data-layer--zustand-store)
12. [API Server — artifacts/api-server](#12-api-server--artifactsapi-server)
13. [Shared Libraries — lib/](#13-shared-libraries--lib)
14. [Build System & Vite Configuration](#14-build-system--vite-configuration)
15. [Security Architecture](#15-security-architecture)

---

## 1. System Overview

Ecosphere v2.1 is an **enterprise-grade infrastructure intelligence platform** built for three primary audiences:

- **Municipal engineers** — who need real-time monitoring of kinetic road energy harvesting installations, degradation forecasting, and maintenance scheduling
- **Government stakeholders** — who need carbon accountability, regional emissions comparisons, and renewable energy percentage data aligned with national grid statistics
- **Investors and ESG auditors** — who need scenario-based carbon footprint calculations, offset reporting, and multi-site operational dashboards

The platform merges two originally separate products:

### 1.1 POWAMOV Infrastructure Intelligence

POWAMOV is a kinetic road energy harvesting system. Vehicles drive over embedded piezoelectric/spring-compression strips installed in road surfaces. Each vehicle pass compresses the strip, drives a mechanical harvester, and generates electrical energy that feeds back into the local grid or a battery buffer. The platform's POWAMOV modules track:

- **Node health** across multiple road arterials in and around Gaborone, Botswana
- **Digital twin simulation** of individual strip assemblies under configurable vehicle load
- **Predictive maintenance** using time-series degradation models
- **Energy analytics** — total harvest in kWh, per-node efficiency, POWAMOV contribution to carbon offset

### 1.2 Carbon Intelligence (Ecosphere)

The carbon intelligence layer provides:

- Real grid carbon intensity data from Electricity Maps for Botswana (BW) and South Africa (ZA), years 2023 and 2024
- Monthly and daily granularity via pre-processed JSON datasets
- A Scope 1/2/3 manual carbon calculator with African regional emission factors
- The Telemetry Engine — a multi-scenario real-time IoT simulation layer (v2.1 new feature)

### 1.3 Operational Context

The platform operates in **fully offline mode** by design. No external API calls are made for primary functionality. User accounts, session tokens, calculator scenarios, and tracker entries all persist in `localStorage`. The API server provides a health endpoint and mock telemetry endpoints; it is not required for core functionality.

This architecture makes the platform deployable as a static site (Vite output) with a lightweight Node.js sidecar, or as a fully serverless SPA.

---

## 2. Repository & Monorepo Architecture

```
workspace/                           ← pnpm workspace root
├── artifacts/
│   ├── powamov/                     ← React/Vite frontend (PRIMARY APP)
│   │   ├── src/
│   │   │   ├── pages/               ← One file per route
│   │   │   ├── components/
│   │   │   │   ├── layout/          ← Shell, Topbar (chrome)
│   │   │   │   └── ui/              ← 50+ Radix-based primitives
│   │   │   ├── services/            ← Telemetry + Emissions engines (v2.1)
│   │   │   ├── stores/              ← Zustand (emissionsStore)
│   │   │   ├── hooks/               ← Custom React hooks
│   │   │   ├── utils/               ← auth.ts, utils.ts
│   │   │   └── data/                ← Static JSON datasets
│   │   ├── vite.config.ts
│   │   ├── components.json          ← shadcn/ui component registry config
│   │   └── package.json
│   ├── api-server/                  ← Express 5 REST API
│   │   ├── src/
│   │   │   ├── app.ts               ← Express factory
│   │   │   ├── routes/              ← health, nodes, telemetry, maintenance, analytics
│   │   │   └── lib/
│   │   │       ├── mockPowamov.ts   ← In-memory simulation data
│   │   │       └── logger.ts        ← Pino logger
│   │   └── build.mjs                ← esbuild bundle script
│   └── mockup-sandbox/              ← Vite dev server for canvas component preview
├── lib/
│   ├── api-spec/                    ← OpenAPI YAML spec (Orval codegen source)
│   ├── api-zod/                     ← Zod schemas generated from spec
│   ├── api-client-react/            ← TanStack Query hooks generated from spec
│   └── db/                          ← Drizzle ORM schema + PostgreSQL client
├── scripts/
│   └── post-merge.sh                ← CI hook for workspace merge reconciliation
├── package.json                     ← Workspace root
├── pnpm-workspace.yaml              ← Workspace declaration + dependency catalog
├── tsconfig.json                    ← Project references root
└── tsconfig.base.json               ← Shared compiler options
```

### 2.1 pnpm Catalog System

The `pnpm-workspace.yaml` file defines a **catalog** of pinned dependency versions shared across all workspace packages. This prevents version drift — packages like `react`, `vite`, `framer-motion`, `tailwindcss`, and all Radix UI primitives are declared once at the workspace level and referenced as `catalog:` in individual `package.json` files. Any version bump in the catalog propagates to all consumers atomically.

### 2.2 TypeScript Project References

The workspace uses TypeScript **project references** (`tsconfig.json` at root with `references` array pointing to `lib/*` packages). This enables:
- Incremental compilation — only changed packages recompile
- Strict cross-package type safety — consuming packages see the public types of library packages
- `tsc --build` walks the dependency graph and compiles in correct topological order

The base compiler configuration (`tsconfig.base.json`) enforces:
- `target: es2022` — modern JS output, no downleveling
- `moduleResolution: bundler` — Vite-aware module resolution
- `strictNullChecks: true` — nullability enforced
- `noImplicitAny: true` — no implicit any
- `isolatedModules: true` — each file transpilable independently (required for esbuild)

---

## 3. Frontend Application — artifacts/powamov

### 3.1 Tech Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | React | 19 |
| Build tool | Vite | 7 |
| Routing | wouter | 3.3 |
| Server state | TanStack Query | 5 |
| Client state | Zustand | 5 |
| Animation | Framer Motion | 12 |
| Charts | Recharts | 2.15 |
| UI primitives | Radix UI | various |
| Styling | Tailwind CSS | 4 (Vite plugin) |
| Icons | Lucide React | latest |
| Forms | react-hook-form + Zod | 7/3 |
| Theme | Custom ThemeProvider | — |

### 3.2 Entry Point Chain

```
index.html
  └── src/main.tsx            ← ReactDOM.createRoot, mounts <App/>
       └── src/App.tsx         ← ThemeProvider → QueryClientProvider → TooltipProvider → WouterRouter → Router
            └── Router()        ← Splits at /login vs everything else
                 ├── /login → <Login/>
                 └── * → <AuthGuard> → <AppRoutes> → <Shell> → <Switch><Route.../></Switch>
```

### 3.3 BASE_URL Routing

The app uses Vite's `import.meta.env.BASE_URL` (set via `BASE_PATH` env var at build/dev time) to support sub-path hosting. The Wouter router is initialized with `base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}`. This means all internal `<Link href="/digital-twin">` calls are automatically prefixed with the base path, making the app deployable at any sub-path without code changes.

---

## 4. Routing & Authentication Architecture

### 4.1 Route Table

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `Login` | Authentication gate (sign in / sign up) |
| `/` | `Dashboard` | Intelligence overview with live KPI cards |
| `/command` | `CommandCenter` | POWAMOV node map + live telemetry |
| `/digital-twin` | `DigitalTwin` | Strip simulation + arterial fleet monitoring |
| `/maintenance` | `Maintenance` | Predictive degradation + alert management |
| `/analytics` | `Analytics` | POWAMOV energy harvest analytics |
| `/carbon-analytics` | `CarbonAnalytics` | Real BW/ZA historical carbon data |
| `/calculator` | `Calculator` | Scope 1/2/3 manual carbon calculator |
| `/tracker` | `TelemetryEngine` | Multi-scenario IoT telemetry (v2.1) |
| `/settings` | `Settings` | Platform preferences |
| `/profile` | `Profile` | User profile + account management |
| `/collaborators` | `Collaborators` | Operations hub + field teams |

### 4.2 AuthGuard Implementation

`AuthGuard` is a React component that wraps all authenticated routes. Its logic:

1. On every render, it calls `getSession()` which reads `localStorage["e2_session"]` and validates the `expiresAt` timestamp (30-day TTL from login)
2. If no valid session exists and the current route is not `/login`, it programmatically navigates to `/login` via Wouter's `setLocation`
3. If a valid session exists, it renders its children (the full app shell)

This check runs synchronously on render — there is no loading state, no network round-trip, and no token refresh flow (by design for offline-first operation).

### 4.3 Offline Auth System — auth.ts

The authentication module (`src/utils/auth.ts`) implements a complete user management system using only `localStorage`. Two storage keys are used:

- **`e2_users`** — Array of `StoredUser` objects (`{ id, email, password, firstName, lastName, country, region, createdAt }`). Passwords are stored in plaintext — this is intentional for an offline-mode demo platform with no network backend. For production with a real API, this entire module would be replaced.
- **`e2_session`** — Single `Session` object (`{ user: User, token: string, expiresAt: number }`). The `token` field is a formatted string `"offline-{userId}"` — not a JWT.

**Login flow**: `login(email, password)` normalises the email to lowercase, searches `e2_users` for a matching entry. If none found, it auto-creates a new user (this enables first-time sign-in without a separate registration). If found with a wrong password, returns an error object.

**Session creation**: `toSession(user)` strips the password from the stored user object, creates a session with a 30-day expiry timestamp, and writes it to `localStorage["e2_session"]`.

**Profile updates**: `updateProfile(updates)` patches both the user in `e2_users` and the current session object in `e2_session`, keeping them in sync.

**Password change**: `changePassword(current, next)` validates the current password against the stored value before updating.

---

## 5. State Management Strategy

The application uses three distinct state layers, each chosen for a specific responsibility:

### 5.1 React Component State (useState/useRef)

Used for all ephemeral, component-local state:
- Simulation running/paused toggle
- Active tab index
- Form field values before submission
- Chart update intervals
- Telemetry tick counters
- Theme toggle state proxy

### 5.2 Zustand Global Store — emissionsStore.ts

The `useEmissionsStore` Zustand store manages cross-component persistent state for the carbon intelligence layer:

```typescript
interface EmissionsState {
  gridScenarios: { name: string; data: EmissionDataPoint[] }[];  // BW/ZA static data
  calculatorScenarios: Scenario[];    // Saved carbon calculator runs
  trackerEntries: TrackerEntry[];     // Manual tracker log entries
  addCalculatorScenario(s): void;
  removeCalculatorScenario(id): void;
  addTrackerEntry(e): void;
  clearTrackerEntries(): void;
}
```

The `gridScenarios` field is populated at module initialisation time by calling `bwToPoints()` on the four imported JSON datasets (BW 2023, ZA 2023, BW 2024, ZA 2024). This transformation extracts `Carbon intensity gCO₂eq kWh (direct)` and `Renewable energy percentage (RE%)` into normalised `EmissionDataPoint` arrays.

The `calculatorScenarios` and `trackerEntries` fields are **hydrated from localStorage** on store creation via `loadJson()`. Every mutation action (`addCalculatorScenario`, `addTrackerEntry`, etc.) immediately writes the updated array back to localStorage before returning the new state. This gives the Zustand store the behavioural properties of a persistent database without any async complexity.

### 5.3 TanStack Query — Server State Cache

TanStack Query manages HTTP state for the API server endpoints. The `QueryClient` is created once at app root with default options. All API calls go through generated hooks in `@workspace/api-client-react` (e.g., `useHealthCheck`, `useGetLiveTelemetry`). Stale-while-revalidate behaviour ensures the UI never blocks on network calls — stale data is shown immediately while fresh data fetches in the background.

The API server health check at `/api/healthz` is polled every 30 seconds by the Shell component to drive the "ALL SYSTEMS ONLINE / SYSTEM OFFLINE" indicator in the sidebar footer.

---

## 6. Design System & Theming

### 6.1 CSS Custom Properties Architecture

The entire visual system is built on CSS custom properties defined in `src/index.css` using HSL values. All component styles reference these tokens — no hex colours appear in component code (except in the enterprise palette constant `ENT` used in data visualisation code where arbitrary colours are needed for chart series).

Two colour schemes are defined:

**Dark Mode** (default):
```css
:root {
  --background:         220 18% 8%;       /* near-black with blue tint */
  --card:               220 16% 11%;      /* card surface, slightly lighter */
  --primary:            213 45% 52%;      /* enterprise blue */
  --foreground:         213 14% 92%;      /* near-white body text */
  --muted-foreground:   215 14% 64%;      /* secondary text */
  --border:             220 14% 18%;      /* subtle border */
  --sidebar:            220 18% 9%;       /* sidebar background */
  --accent:             142 40% 42%;      /* success green */
  --destructive:        0 52% 56%;        /* error red */
}
```

**Light Mode**:
```css
.light {
  --background:         215 22% 91%;      /* cool off-white */
  --card:               0 0% 99%;         /* pure white cards */
  --primary:            213 68% 30%;      /* darker enterprise blue */
  --foreground:         220 18% 8%;       /* dark body text */
  --muted-foreground:   220 18% 32%;      /* WCAG AA secondary text */
  --border:             215 18% 76%;      /* visible border in light */
}
```

### 6.2 ThemeProvider — theme-provider.tsx

The `ThemeProvider` component implements a three-layer initialisation strategy for resilient theme persistence in environments where `localStorage` may be blocked (sandboxed iframes, cross-origin embedding):

```
Layer 1: localStorage.getItem("ecosphere-theme") → if "dark" or "light", use it
Layer 2: window.document.documentElement.classList → read current HTML class
Layer 3: defaultTheme prop → fallback to "dark"
```

When `setTheme(theme)` is called:
1. Writes to localStorage (wrapped in try/catch — failure is silently swallowed)
2. Updates React state (always succeeds regardless of localStorage status)
3. The `useEffect([theme])` then removes both "dark" and "light" from `<html>` classList and adds the new theme class

This approach means: even if localStorage is completely inaccessible (SecurityError in a sandboxed iframe), the user's theme choice persists as long as the app is mounted. After a hard refresh in a localStorage-blocked environment, it resets to the HTML class (which may be stale from CSS) or to `defaultTheme="dark"`.

### 6.3 Enterprise Palette

Data visualisation code uses a named constant `ENT` to maintain colour consistency across all charts and sensor panels:

```typescript
const ENT = {
  blue:   "#4a90b8",   // primary data series, informational
  green:  "#3d8a5e",   // normal status, positive trend, offsets
  amber:  "#c07a16",   // warning status, caution, industrial
  violet: "#7c6db5",   // secondary metric, heavy vehicles
  red:    "#b84a4a",   // alert status, negative trend, destructive
  slate:  "#5a7080",   // tertiary metric, background data
};
```

These colours are specifically chosen to be **muted and legible** at the luminance levels used in the dark background (`220 18% 8%`). Saturated neons (cyan, bright green) were deliberately avoided to meet the enterprise aesthetic requirement.

### 6.4 Tailwind CSS v4 Configuration

Tailwind v4 is integrated via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js` file. The entire Tailwind configuration is embedded in `src/index.css` using `@theme` directives that map Tailwind utility tokens to the CSS custom properties:

```css
@theme {
  --color-background: hsl(var(--background));
  --color-primary: hsl(var(--primary));
  --color-card: hsl(var(--card));
  /* ... etc */
}
```

This means `bg-background`, `text-primary`, `border-card` etc. all automatically pick up the correct HSL values from whichever theme is active on the `<html>` element, with no JavaScript required.

The `@custom-variant dark (&:is(.dark *))` directive redefines how Tailwind's `dark:` modifier compiles. Instead of the system default `@media (prefers-color-scheme: dark)`, dark utilities compile to `:is(.dark *)` selectors, enabling class-based dark mode control.

---

## 7. Module Breakdown — All Pages

### 7.1 Dashboard (/)

**Purpose**: Intelligence overview. Entry point after login.

**Data sources**: 
- `useGetLiveTelemetry` — TanStack Query hook hitting `/api/telemetry/live`
- `useGetAnalyticsSummary` — hitting `/api/analytics/summary`
- `useEmissionsStore` — Zustand for BW grid scenario data

**Key UI elements**:
- KPI cards: Live Node Count, kWh Harvested Today, CO₂ Offset kg, Grid Intensity gCO₂/kWh
- Quick-navigation tiles to all major modules
- Live telemetry sparkline (30-point rolling window)

### 7.2 Command Center (/command)

**Purpose**: Real-time POWAMOV node monitoring. The operational nerve centre.

**Data sources**:
- `useGetLiveTelemetry` + `useListNodes` — polled via TanStack Query
- `useGetTelemetryHistory` — for the historical chart

**Key UI elements**:
- SVG node map of Greater Gaborone (schematic, not geo-accurate) with positioned node indicators
- Per-node status dots (healthy / degrading / offline)
- Live telemetry table: voltage, current, power output, temperature per node
- 30-day energy history area chart

### 7.3 Digital Twin (/digital-twin)

See Section 10 for the full physics model. Summary:

**Purpose**: Real-time simulation of a POWAMOV strip assembly under vehicle load. Two tabs:
1. **Node Simulation** — Animates a vehicle crossing 6 piezoelectric strips, shows per-strip compression, force, and energy output
2. **Fleet Monitor** — Tracks real-time traffic simulation across 4 Botswana arterials with energy aggregation

**Key algorithms**:
- Weight slider (500–15,000 kg) drives all physics parameters
- `maxForceKn = weightKg × 0.006` — peak compression force per strip
- `whPerStrip = weightKg × 1.16e-5` — energy harvested per strip per pass
- 6-second passage cycle driven by `setInterval` at 50ms (120 frames/second effective)
- `seededRand(seed)` — deterministic LCG random for reproducible vehicle fleet simulation

### 7.4 Predictive Maintenance (/maintenance)

**Purpose**: Health forecasting for POWAMOV node assemblies.

**Data sources**:
- `useGetMaintenanceForecasts` — efficiency decay curves per node
- `useGetMaintenanceAlerts` — active maintenance alerts with priority

**Key UI elements**:
- Maintenance alert cards with colour-coded urgency (red/amber/green based on time-to-action)
- Per-node efficiency forecast chart (line chart, 30-day projection)
- Service window recommendations derived from degradation rate × efficiency threshold

### 7.5 Energy Analytics (/analytics)

**Purpose**: POWAMOV harvest reporting. Shows cumulative energy output, carbon offset, and grid contribution data.

**Data sources**:
- `useGetAnalyticsSummary` — total kWh, offset kg, per-node breakdown
- `useGetEnergyHistory` — time-series harvest data for chart rendering

**Calculations**:
- Carbon offset displayed as `kWh_harvested × 0.734 kg/kWh` (BW grid intensity)
- Grid displacement percentage: POWAMOV output as fraction of estimated local grid draw

### 7.6 Regional Carbon Analytics (/carbon-analytics)

**Purpose**: Historical carbon intensity and renewable energy data for BW and ZA.

**Data sources**: Static JSON files, loaded via Zustand `gridScenarios` at startup:
- `BW_2023_monthly.json` — 12 monthly records
- `ZA_2023_monthly.json`
- `BW_2024_monthly.json`
- `ZA_2024_monthly.json`

Also references `BW_2023_daily.json`, `ZA_2023_daily.json`, `BW_2024_daily.json`, `D_C_D.json` (daily carbon data) for higher granularity charts.

**Data schema** (Electricity Maps format):
```json
{
  "Datetime (UTC)": "2023-01-01T00:00:00Z",
  "Carbon intensity gCO₂eq": {
    "kWh (direct)": 734.2,
    "kWh (LCA)": 752.1
  },
  "Renewable energy percentage (RE%)": 3.4
}
```

### 7.7 Manual Calculator (/calculator)

**Purpose**: Scope 1, 2, and 3 GHG accounting tool. Allows engineers and ESG teams to build custom emission scenarios and save them for comparison.

**Emission factors** (sourced from IPCC, IEA, and regional grid authorities):
```typescript
const FACTORS = {
  diesel:      2.70,    // kg CO₂ / litre
  water:       0.002,   // kg CO₂ / litre
  electricity: {        // kg CO₂ / kWh, by African region
    SOUTHERN_AFRICA: 0.920,
    MIDDLE_AFRICA:   0.850,
    EASTERN_AFRICA:  0.740,
    WESTERN_AFRICA:  0.880,
    NORTHERN_AFRICA: 0.610,
  },
  flights_economy:   0.255,   // kg CO₂ / km / passenger
  flights_business:  0.510,
  vehicle_petrol:    0.192,   // kg CO₂ / km
  vehicle_diesel:    0.171,
  waste_landfill:    0.467,   // kg CO₂eq / kg
  waste_recycled:    0.021,
};
```

**Scope categorisation**:
- Scope 1 (direct): Diesel fuel combustion, company-owned vehicle fleet
- Scope 2 (indirect): Grid electricity purchase
- Scope 3 (value chain): Air travel, water consumption, waste disposal

**Scenario persistence**: Each calculated scenario is saved to `useEmissionsStore.calculatorScenarios` (max 8 scenarios, newest first) and simultaneously written to `localStorage["e2_calculator_scenarios"]`.

### 7.8 Telemetry Engine (/tracker) — v2.1

The primary new feature of v2.1. See Sections 8 and 9 for full engine documentation. Summary of UI structure:

**Scenario selector**: Three cards at the top of the page, each representing a data source. Clicking switches the active scenario and fades in the new view (AnimatePresence mode="wait").

**Regional Dataset view**: Preserves the original tracker functionality — a random-walk emission simulation in gCO₂/kWh, plus bar/pie charts of Botswana regional carbon intensity from `B_E_D.json`.

**Industrial view (Taurus Batteries)**: 6 sensor panels in a 2×3 grid, each showing live-updating metrics. A CO₂ area chart shows `Grid CO₂` and `Net CO₂` series converging/diverging based on POWAMOV offset.

**Campus view (Botho University)**: 5 sensor panels + a POWAMOV offset summary card. CO₂ and kWh are shown together on a dual-series area chart.

---

## 8. Telemetry Engine — services/telemetryEngine.ts

### 8.1 Design Principles

The telemetry engine uses **module-level mutable state** rather than React state or a global store. This is a deliberate architectural choice:

- The data represents physical sensor readings — they exist independently of any React component lifecycle
- Multiple components can read the same state without prop-drilling
- State changes happen via explicit `tick*()` function calls, not reactive subscriptions
- The engine has zero React dependencies — it is a pure TypeScript module that can be tested in isolation

### 8.2 Random Walk Algorithm

All sensor values use a **bounded random walk** (Ornstein-Uhlenbeck-inspired drift):

```typescript
function drift(v: number, min: number, max: number, step: number): number {
  return Math.max(min, Math.min(max, v + (Math.random() - 0.48) * step));
}
```

The `0.48` bias (slightly less than 0.5) creates a very subtle mean-reverting tendency — the value drifts upward slightly more often than downward. This produces realistic-looking sensor traces that don't flat-line or rail against bounds. The `min`/`max` clamp ensures physical plausibility.

For integer metrics (student counts, vehicle counts):
```typescript
function driftInt(v: number, min: number, max: number, step: number): number {
  return Math.round(drift(v, min, max, step));
}
```

### 8.3 Industrial Scenario — Taurus Batteries

**Initial state** (realistic industrial baseline):
```typescript
power:     { totalKwh: 850, machineLoadPct: 72, peakDemandKw: 220 }
generator: { isOn: false, dieselLitres: 48, runtimeHrs: 2.3 }
gas:       { hydrogenPpm: 12, chemicalIndex: 24, aqi: 68 }
fire:      { smokeLevelPct: 2, heatC: 24 }
hvac:      { ventilationPct: 65, coolingKw: 18 }
fleet:     { trucksEntered: 4, forkliftActive: 3 }
```

**Tick functions and physical bounds**:

| Function | Parameters | Bounds | Spec Update Rate |
|----------|-----------|--------|-----------------|
| `tickIndustrialPower()` | totalKwh±25, machineLoad±4, peakDemand±10 | 400–1400 kWh, 25–98%, 100–450 kW | 5s |
| `tickIndustrialGenerator()` | 4% chance to toggle isOn; if on: diesel−0.15L/tick, runtime+10s | 0–∞ L, runtime monotonic | 10s |
| `tickIndustrialGas()` | H₂±3ppm, chemical±5, AQI±8 | 0–85ppm, 0–100, 20–185 | 2s |
| `tickIndustrialFire()` | smoke±1%, heat±0.6°C | 0–30%, 18–48°C | 2s |
| `tickIndustrialHVAC()` | ventilation±4%, cooling±2kW | 30–100%, 5–42kW | 5s |
| `tickIndustrialFleet()` | trucks: +1 at 35% probability; forklifts: ±1 | 0–8 forklifts | 15s |

**Compound tick scheduling in tracker.tsx**:

The Industrial view uses a single 2-second `setInterval` with a tick counter to approximate the spec's different update rates:

```typescript
const id = setInterval(() => {
  tickRef.current++;
  tickIndustrialGas(); tickIndustrialFire();           // every 2s
  if (tickRef.current % 3 === 0) {                     // every 6s ≈ 5s spec
    tickIndustrialPower(); tickIndustrialHVAC();
  }
  if (tickRef.current % 5 === 0) { tickIndustrialGenerator(); } // every 10s
  if (tickRef.current % 8 === 0) { tickIndustrialFleet(); }     // every 16s ≈ 15s spec
  ...
}, 2000);
```

### 8.4 Campus Scenario — Botho University

**Initial state** (realistic campus baseline — mid-day, typical day):
```typescript
electricity: { buildingKwh: 320, labKwh: 85 }
hvac:        { lectureHallsPct: 72, labsPct: 88, officesPct: 55 }
occupancy:   { students: 1240, buildingsActive: 8 }
vehicles:    { security: 3, maintenance: 2 }
lab:         { gasPpm: 8, tempC: 22 }
```

The campus uses a 5-second base interval with a 2× modulo for 10-second groups and 4× for 20-second groups:

```typescript
const id = setInterval(() => {
  tickRef.current++;
  tickCampusLab();                             // every 5s
  if (tickRef.current % 2 === 0) {            // every 10s
    tickCampusElectricity(); tickCampusHVAC();
  }
  if (tickRef.current % 4 === 0) {            // every 20s
    tickCampusOccupancy(); tickCampusVehicles();
  }
  ...
}, 5000);
```

### 8.5 State Read Pattern

`getIndustrialTelemetry()` and `getCampusTelemetry()` return **shallow copies** of nested objects. This is critical for React's referential equality checks — without copying, `setState(sameObject)` would trigger no re-render even if the nested values changed.

```typescript
export function getIndustrialTelemetry(): IndustrialTelemetry {
  return {
    power:     { ..._indust.power },
    generator: { ..._indust.generator },
    // ... each nested object gets a new reference
  };
}
```

---

## 9. Emissions Engine — services/emissionsEngine.ts

### 9.1 Emission Factors

All factors are grounded in real-world published data:

| Source | Factor | Reference |
|--------|--------|-----------|
| Botswana national grid | 0.734 kg CO₂/kWh | Electricity Maps 2023/24 |
| South Africa national grid | 0.655 kg CO₂/kWh | Electricity Maps 2023/24 |
| Diesel combustion | 2.68 kg CO₂/L | IPCC 2006 Tier 1 |
| POWAMOV offset | 8.2% of gross CO₂ | Internal POWAMOV model |

### 9.2 Industrial CO₂ Pipeline

```typescript
const gridCo2Kg   = state.power.totalKwh × 0.734;
const dieselCo2Kg = state.generator.isOn
  ? state.generator.dieselLitres × 2.68 × 0.012   // 1.2% consumed per 2s tick
  : 0;
const totalCo2Kg       = gridCo2Kg + dieselCo2Kg;
const intensityGco2Kwh = (totalCo2Kg / totalKwh) × 1000;  // normalised back to g/kWh
const offsetKg         = totalCo2Kg × 0.082;                // POWAMOV 8.2% offset
const netCo2Kg         = totalCo2Kg - offsetKg;
```

The diesel consumption during a 2-second tick is modelled as `currentLitres × 0.012` — meaning 1.2% of the tank is consumed per tick when the generator is running. This produces a diesel depletion rate of approximately 0.57 L/min at full tank (48L), which matches a realistic ~350kW industrial generator running lean.

### 9.3 Campus CO₂ Pipeline

```typescript
const totalKwh       = state.electricity.buildingKwh + state.electricity.labKwh;
const co2Kg          = totalKwh × 0.734;
const perStudentGco2 = (co2Kg × 1000) / state.occupancy.students;  // grams per student
const offsetKg       = co2Kg × 0.082;
const netCo2Kg       = co2Kg - offsetKg;
```

The **per-student CO₂ metric** is a campus-specific KPI — dividing total grid CO₂ by active student count gives a normalised footprint that accounts for occupancy fluctuation.

### 9.4 Risk Level Assessment

`getIndustrialRiskLevel()` produces a three-tier risk classification:

```
ALERT  if: H₂ > 65ppm OR smoke > 20% OR heat > 42°C OR machineLoad > 94%
WARNING if: H₂ > 40ppm OR smoke > 12% OR heat > 36°C OR machineLoad > 85% OR AQI > 150
NORMAL otherwise
```

These thresholds are derived from:
- ATEX hydrogen atmosphere limits (10% of LEL = ~40ppm for alert threshold)
- Industrial fire detection standards (EN 54)
- Electrical equipment temperature ratings (IEC 60034)

---

## 10. Digital Twin Physics Model

### 10.1 Vehicle Weight Classification

The weight slider (500–15,000 kg) drives a three-tier classification system:

| Range | Class | Colour | SVG Width | SVG Height | Example |
|-------|-------|--------|-----------|------------|---------|
| ≤2,500 kg | Passenger Vehicle (light) | `#4a90b8` (blue) | 90px | 36px | Sedan, SUV |
| 2,501–6,000 kg | Light Commercial (medium) | `#c07a16` (amber) | 126px | 44px | Minibus, pickup |
| >6,000 kg | Heavy Vehicle (heavy) | `#7c6db5` (violet) | 162px | 54px | Truck, bus |

### 10.2 Force and Energy Equations

Per-strip force (maximum compression):
```
maxForceKn = weightKg × 0.006
```

This models the static load distributed across 6 strips at 0.006 kN/kg — a simplified linear approximation of the spring-compression mechanical advantage. For a 12,000 kg truck: `maxForceKn = 72 kN` per strip.

Energy per strip per pass:
```
whPerStrip = weightKg × 1.16e-5
```

This yields approximately: 500 kg vehicle → 5.8 Wh/pass; 15,000 kg vehicle → 174 Wh/pass. These values align with published POWAMOV prototype test data (6–180 Wh range for the weight spectrum tested).

### 10.3 Strip Compression Dynamics

The vehicle crosses the SVG canvas (700px wide) with a speed in px/frame derived from `speedPx` (arterial config). On each animation frame (50ms interval), the vehicle position is updated, and each strip's compression state is recalculated:

```typescript
const overlap = Math.max(0, Math.min(1,
  1 - Math.abs(vehicleX + vehW/2 - stripCenter) / (STRIP_W/2 + vehW/2)
));
const compression = overlap * 0.85;         // 0–85% max compression
const forceKn = compression × maxForceKn;
const energyWh = compression × whPerStrip;
```

The `overlap` calculation produces a smooth bell curve as the vehicle passes over each strip — maximum compression occurs when the vehicle centre aligns with the strip centre, tapering to zero when the vehicle is more than `(STRIP_W/2 + vehW/2)` pixels away.

### 10.4 SVG Rendering

The vehicle is rendered as an SVG `<rect>` with rounded corners, coloured by vehicle class. A headlight indicator is placed at the **right edge** (`vehicleX + vehW - 8`) and taillights at the **left edge** (`vehicleX + 8`) — the vehicle always travels left-to-right (positive x direction), which is the "facing right" convention.

Energy bars are rendered as 6 `<rect>` elements per strip, growing vertically from the road surface upward, coloured with a gradient from ENT.green (low compression) to ENT.amber (medium) to ENT.red (peak) — though the colour is uniform per-strip in the current implementation, using ENT.green for active strips.

### 10.5 60-Second Energy Aggregation

A secondary timer runs every 60 seconds and accumulates the energy generated during that window. The aggregation result is appended to a rolling 10-point array and displayed in the area chart below the visualisation. The `miniRingAngle` state drives a small SVG ring countdown indicator showing time elapsed since the last aggregation.

### 10.6 Fleet Monitor — Arterials

Four Botswana road arterials are defined:
```typescript
{ id: "a1-north",     label: "A1 North",       speedBase: 105, svgX: 38,  svgY: 14 }
{ id: "a1-south",     label: "A1 South",        speedBase: 98,  svgX: 52,  svgY: 82 }
{ id: "tlokweng",     label: "Tlokweng Border", speedBase: 72,  svgX: 80,  svgY: 44 }
{ id: "tsolamosese",  label: "Tsolamosese",     speedBase: 55,  svgX: 16,  svgY: 50 }
```

Each arterial runs an independent simulation loop with `seededRand(seed)` — a linear congruential generator — ensuring different but reproducible traffic patterns per arterial. Vehicle arrivals follow a Poisson-like process (random inter-arrival with minimum gap), and each vehicle's weight is sampled from the `rand()` function scaled to the 500–15,000 kg range.

---

## 11. Static Data Layer & Zustand Store

### 11.1 Dataset Overview

All datasets originate from **Electricity Maps** (electricitymaps.com) exports, pre-processed into JSON:

| File | Period | Granularity | Records |
|------|--------|-------------|---------|
| `BW_2023_monthly.json` | Jan–Dec 2023 | Monthly | 12 |
| `ZA_2023_monthly.json` | Jan–Dec 2023 | Monthly | 12 |
| `BW_2024_monthly.json` | Jan–Dec 2024 | Monthly | 12 |
| `ZA_2024_monthly.json` | Jan–Dec 2024 | Monthly | 12 |
| `BW_2023_daily.json` | 2023 | Daily | 365 |
| `ZA_2023_daily.json` | 2023 | Daily | 365 |
| `BW_2024_daily.json` | 2024 | Daily | 366 |
| `D_C_D.json` | — | — | Compound dataset |
| `B_E_D.json` | — | Regional | 8 BW regions |

### 11.2 B_E_D.json — Botswana Electricity Data

This dataset contains per-region carbon intensity and renewable energy percentages for the 8 administrative districts of Botswana:

```json
[
  {
    "Region": "Central",
    "CarbonIntensity_gCO2eq_kWh": 734.1,
    "RE_Percentage": 3.2
  },
  ...
]
```

This data is consumed by the `RegionalView` in the Telemetry Engine and by the `CarbonAnalytics` page to render the regional comparison charts.

### 11.3 Vite Static Import Strategy

JSON data files are imported using ES module static imports:
```typescript
import BED_DATA from "@/data/B_E_D.json";
```

Vite handles JSON imports natively — the file is parsed at build time, tree-shaken, and inlined into the JavaScript bundle. There are no runtime HTTP requests for this data. The path alias `@` maps to `src/` via Vite's `resolve.alias` configuration.

---

## 12. API Server — artifacts/api-server

### 12.1 Architecture

The API server is an **Express 5** application compiled to a single ESM bundle using esbuild. It is a pure in-memory mock server — it holds no database connection and generates all data from the `mockPowamov.ts` simulation library.

### 12.2 Express Application Setup

```typescript
// app.ts
app.use(pinoHttp({ logger }));   // Request logging with Pino (structured JSON)
app.use(cors());                  // Allow all origins (development mode)
app.use(express.json());          // JSON body parsing
app.use("/api", router);          // All routes under /api prefix
```

### 12.3 Route Table

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Returns `{ status: "ok" }` — system health check |
| GET | `/api/nodes` | Lists all POWAMOV nodes with status |
| POST | `/api/nodes` | Creates a new node (in-memory) |
| GET | `/api/nodes/:id` | Gets single node by ID |
| GET | `/api/nodes/:id/telemetry` | Gets telemetry readings for a node |
| POST | `/api/digital-twin/:nodeId/simulate` | Runs strip simulation for given vehicle params |
| GET | `/api/telemetry/live` | Returns live aggregated telemetry snapshot |
| GET | `/api/maintenance/forecasts` | Returns efficiency decay projections |
| GET | `/api/maintenance/alerts` | Returns active maintenance alerts |
| GET | `/api/analytics/summary` | Returns aggregate harvest/offset summary |
| GET | `/api/analytics/energy-history` | Returns time-series energy history |

### 12.4 Request/Response Validation

Every route validates its request (query params or body) using Zod schemas imported from `@workspace/api-zod`. Responses are also validated through `ZodSchema.parse()` before being sent — this acts as a runtime type assertion ensuring the mock data matches the declared API contract. If the mock data generation produces a type mismatch, the server throws a ZodError rather than silently sending malformed data.

### 12.5 Build System

The API server uses esbuild (`build.mjs`) to produce a single `dist/index.mjs` bundle. Key esbuild options:
- `format: "esm"` — native ESM output
- `platform: "node"` — Node.js target (no browser polyfills)
- `bundle: true` — all dependencies inlined except native Node.js modules
- `sourcemap: true` — preserves stack traces (run with `--enable-source-maps`)
- `esbuild-plugin-pino` — special handling for Pino's worker thread files

---

## 13. Shared Libraries — lib/

### 13.1 api-zod

Contains Zod schemas corresponding to all API request/response types. Generated by Orval from the OpenAPI specification in `lib/api-spec`. Running `pnpm --filter @workspace/api-spec run codegen` regenerates these schemas when the spec changes.

Both the API server (for response validation) and the frontend (for form validation and type inference) consume these schemas, ensuring a single source of truth for data shapes.

### 13.2 api-client-react

Contains TanStack Query hooks generated by Orval from the OpenAPI spec. Each API endpoint gets:
- A typed hook (e.g., `useGetAnalyticsSummary()`)
- A query key factory (e.g., `getGetAnalyticsSummaryQueryKey()`)

The hooks handle loading states, error states, caching, and background refetching automatically. The `refetchInterval` option (used for live telemetry) enables server-sent-event-like polling behaviour.

### 13.3 db (Drizzle ORM)

Contains the PostgreSQL schema definition using Drizzle ORM. Although the current deployment of the app operates in offline/mock mode, the database layer is fully scaffolded for a production migration. The schema includes tables for nodes, telemetry readings, maintenance records, and user data.

The database client is configured via `DATABASE_URL` environment variable — when not set, the API server operates in mock mode using `mockPowamov.ts` rather than querying PostgreSQL.

---

## 14. Build System & Vite Configuration

### 14.1 Environment Variables Required at Build/Dev Time

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Dev server port | `3000` |
| `BASE_PATH` | URL base path for the app | `/` or `/powamov` |

Both are **required** in the Replit environment (enforced by throwing if undefined). In a local environment, these should be simplified to have defaults (see Setup Guide).

### 14.2 Vite Plugin Stack

**Production-invariant plugins**:
- `@vitejs/plugin-react` — React Fast Refresh + JSX transform
- `@tailwindcss/vite` — Tailwind CSS v4 integration (JIT, no config file)

**Development-only plugins**:
- `@replit/vite-plugin-runtime-error-modal` — Error overlay (removed in local setup)
- `@replit/vite-plugin-cartographer` — Code source maps for Replit IDE (removed in local setup)
- `@replit/vite-plugin-dev-banner` — Dev mode banner (removed in local setup)

### 14.3 Path Aliases

```typescript
resolve: {
  alias: {
    "@": path.resolve(import.meta.dirname, "src"),
    "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
  }
}
```

`@/` resolves to `src/` — used throughout the codebase for absolute imports. `@assets/` resolves to `attached_assets/` at the workspace root — used for any binary assets uploaded through the Replit interface.

### 14.4 Build Output

Production build writes to `artifacts/powamov/dist/public/`. The output is a standard SPA bundle:
- `index.html` — Entry point with hashed asset references
- `assets/*.js` — Code-split JS chunks
- `assets/*.css` — Tailwind-processed CSS

---

## 15. Security Architecture

### 15.1 Authentication Security Posture

The current auth system stores passwords in plaintext in `localStorage`. This is an explicit design decision for a demo/prototype platform. For production deployment with real users:

1. Replace `src/utils/auth.ts` with JWT-based authentication calling the API server
2. Add password hashing (bcrypt or argon2) in `artifacts/api-server/src/routes/auth.ts`
3. Store session tokens as HTTP-only cookies, not localStorage
4. Implement CSRF protection on the API server

### 15.2 Supply Chain Security

The `pnpm-workspace.yaml` enforces `minimumReleaseAge: 1440` — any npm package version must be at least 1 day old before pnpm installs it. This is a published defence against supply-chain attacks where malicious packages are typically discovered and pulled within hours of publication.

### 15.3 API CORS

The API server currently uses `cors()` with no options — allowing all origins. For production, this should be restricted:
```typescript
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [] }));
```

### 15.4 Content Security

The Vite dev server sets `fs.deny: ["**/.*"]` — prevents the dev server from serving any hidden files (dotfiles), protecting `.env` files and other sensitive configs from being accidentally served.

---

*Ecosphere v2.1 — POWAMOV Intelligence Platform — Technical Documentation*  
*Last updated: Ecosphere v2.1 release*
