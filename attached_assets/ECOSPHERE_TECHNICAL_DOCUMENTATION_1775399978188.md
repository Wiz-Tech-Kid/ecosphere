# Ecosphere Technical Documentation

Assessment date: March 25, 2026

This document is based on the current repository state in `/home/nickel/Documents/react/ecosphere`. It combines direct code inspection with reasoned inference about product intent. Where a statement is inferred rather than explicitly implemented, that is called out.

## 1. Executive Summary

Ecosphere is a front-end-first environmental intelligence application focused on carbon emissions awareness, regional electricity-carbon analytics, and lightweight enterprise carbon accounting. The strongest implemented use cases are:

- visualizing bundled emissions and energy mix datasets for Botswana and South Africa
- calculating Scope 1, Scope 2, and Scope 3 emissions with simple input-driven formulas
- storing a small amount of user activity locally in the browser
- presenting a dashboard-style experience for sustainability-oriented users

The codebase also shows broader ambition beyond what is fully implemented. It contains traces of:

- a real Supabase-backed authentication stack
- machine learning assisted forecasting and clustering
- export/reporting workflows
- collaboration and operational coordination features
- a more modular analytics platform

As of March 25, 2026, this repository reads more like a prototype, capstone, or pilot MVP than a production-ready application. The concept is clear and the UI direction is coherent enough to demonstrate value, but the actual runtime is still heavily static, simulated, and browser-local.

High-level assessment:

- Product intent: clear
- Demo value: strong
- Production readiness: low
- Security maturity: low
- Backend maturity: low
- Data integrity maturity: medium-low
- Modernization effort required for 2026 standards: significant

## 2. Inferred Product Intent And Goals

The following goals are inferred from route structure, component naming, README language, dataset choices, and feature design.

### Primary goal

Help users understand, monitor, and reduce carbon emissions through dashboards, analytics, and calculator workflows.

### Likely target users

- sustainability leads at small to mid-sized organizations
- operations or facilities teams trying to estimate emissions exposure
- environmentally conscious users in Southern Africa
- NGOs, project managers, or public-sector teams tracking environmental initiatives

The "Enterprise Carbon Calculator" label strongly suggests a business-facing use case rather than a purely consumer app.

### Geographic focus

The active data and UI strongly center Botswana and South Africa:

- analytics compares Botswana and South Africa month by month
- the login form country choices only include Botswana and South Africa
- the emission tracker's regional comparison is based on Botswana regions
- calculator electricity factors are generalized across African subregions

### Value proposition

The app appears intended to answer four questions:

1. What is my or my organization's emissions footprint?
2. How carbon intensive is electricity in my region?
3. How do energy mix and carbon-free energy trends compare over time?
4. What operational actions or scenarios could reduce emissions?

### Secondary or aspirational goals

These are present in the codebase but not fully realized:

- collaboration around environmental projects
- predictive analytics and clustering
- PDF or compliance-style reporting
- persistent user profile and settings management
- real authentication and account recovery

## 3. Current Product Surface

### Active route map

| Route | File | Purpose | Current state |
| --- | --- | --- | --- |
| `/login` | `src/pages/Login.tsx` | Sign in / sign up screen | Functional, but backed by localStorage mock auth |
| `/reset-password` | `src/pages/PasswordReset.tsx` | Password reset flow | Local-only simulation |
| `/dashboard` | `src/scenes/dashboard/dashboard.tsx` | KPI overview and recent activity | Mixed real and hardcoded data |
| `/analytics` | `src/scenes/analytics.tsx` | Regional energy and carbon charts | Functional with bundled JSON datasets |
| `/calculator` | `src/scenes/calculator.tsx` | Scope 1/2/3 calculator | Functional calculations, fake export |
| `/emission_tracker` | `src/scenes/emission_tracker.tsx` | Real-time and regional emissions view | Simulated real-time data plus bundled regional data |
| `/settings` | `src/pages/Settings.tsx` | Settings page | Mostly local state and alerts |
| `/collaborators_hub` | `src/pages/CollaboratorsHub.tsx` | Projects/teams/resources hub | Entirely static demo content |

### Important product reality

Authentication is not actually required to reach the app shell. `src/App.tsx` mounts the dashboard routes directly and does not wrap them in any working route guard. `src/ProtectedRoute.tsx` exists but is empty and unused.

That means the current app behaves more like:

- a login page for appearance and local account storage
- a separate app shell that is always accessible if the user navigates directly

## 4. Architecture Overview

### Frontend runtime model

Ecosphere is a client-rendered single-page application built with:

- React 19
- React Router 7
- Vite 7
- TypeScript

The app is organized around lazily imported route-level scenes, but only partially. Some route chunks are diluted by static cross-imports, which reduces the value of code splitting.

### UI and visualization stack

Active UI/visualization dependencies in the runtime:

- `recharts` for most charts
- `react-chartjs-2` and `chart.js` for the dashboard doughnut chart
- `@mui/material` for the analytics slider
- `lucide-react` and `react-icons` for iconography
- `tailwindcss` and utility classes for layout/styling
- `three` and `vanta` for the animated login background

### State model

The app mostly uses local React state inside each page.

Global state is minimal:

- `src/stores/emissionsStore.ts` uses Zustand

In practice, the Zustand store is not wired into the live route flow. Most persistence is browser-local and manual.

### Persistence model

Persistent state is stored in browser `localStorage` under keys such as:

- `ecosphere.local.session`
- `ecosphere.local.users`
- `ecosphere.local.reset`
- `calculatorScenarios`
- `trackerEntries`

There is no active server data layer in the runtime.

### Data loading model

Environmental data is bundled at build time via direct imports from `src/data/*.json`.

Implications:

- no runtime fetching
- no live data updates
- no server cache or API abstraction
- larger client bundle
- redeploy required for data refresh

### Backend posture

There is a local Supabase CLI config in `supabase/config.toml`, but the front-end auth implementation in `src/utils/supabaseClient.ts` is a handwritten localStorage mock, not a real Supabase client.

This is a critical architectural fact:

- the repo signals backend ambition
- the shipped runtime is effectively frontend-only

## 5. Feature Analysis

### 5.1 Login And Authentication

Files:

- `src/pages/Login.tsx`
- `src/pages/PasswordReset.tsx`
- `src/utils/supabaseClient.ts`

### What is implemented

- email/password sign in
- email/password sign up
- fake Google OAuth sign in
- local password reset flow
- local password change
- local session persistence

### What is actually happening

The "Supabase" client is not Supabase. It:

- stores users in localStorage
- stores sessions in localStorage
- stores passwords in plaintext
- synthesizes fake tokens like `offline-<id>`
- creates fake OAuth accounts such as `google.offline@ecosphere.local`

### Important behavior details

- `signInWithPassword` auto-creates a user if the email does not exist. This means login doubles as implicit signup.
- password reset stores a reset request marker locally, then lets the current user update their password
- no email is sent
- no reset token is generated
- no secure verification step exists

### Technical assessment

This auth layer is acceptable for a local demo and unacceptable for production.

### Security concerns

- plaintext password storage
- no route protection
- no server-side session validation
- no real password recovery
- no role or permission model
- no audit trail

### 5.2 Dashboard

File:

- `src/scenes/dashboard/dashboard.tsx`

### Intent

Provide a high-level emissions overview with KPIs, charts, and recent activity.

### Implemented elements

- KPI cards
- doughnut chart for emission sources
- stacked energy comparison bar chart
- recent tracker entries
- recent calculator scenarios

### Data sources

- `ZA_2023_yearly.json`
- `localStorage` keys `calculatorScenarios` and `trackerEntries`

### What is real vs simulated

Real:

- recent calculator scenarios from localStorage
- recent tracker entries from localStorage if already present

Simulated or hardcoded:

- `percentChange` is hardcoded to `4.2`
- `topEmitter` is hardcoded to `Energy Sector`
- doughnut chart category split is hardcoded
- energy comparison bar chart values are hardcoded
- dummy tracker entries are injected into localStorage on first use

### Verified bug

The dashboard calculates `totalEmissions` from `entry["CO2_emissions"]`, but `ZA_2023_yearly.json` does not expose that field. The active yearly dataset instead uses nested carbon intensity fields. As written, the "Total Emissions" KPI will resolve to `0`.

### Product reading

The dashboard is best understood as a UI shell demonstrating what a future live dashboard could look like. It is not yet a trustworthy summary surface.

### 5.3 Analytics

File:

- `src/scenes/analytics.tsx`

### Intent

Compare regional electricity carbon intensity and energy mix trends between Botswana and South Africa.

### Implemented elements

- year selector for 2023 vs 2024
- sensitivity slider
- monthly comparison bar chart
- average carbon intensity chart
- energy mix pie chart
- carbon-free energy area chart

### Data sources

- `BW_2023_monthly.json`
- `BW_2024_monthly.json`
- `ZA_2023_monthly.json`
- `ZA_2024_monthly.json`

Each monthly dataset contains 12 records.

### Environmental story present in the data

Using the bundled monthly datasets:

- Botswana 2023 average intensity: `717.01 gCO2e/kWh`
- Botswana 2024 average intensity: `733.88 gCO2e/kWh`
- South Africa 2023 average intensity: `644.17 gCO2e/kWh`
- South Africa 2024 average intensity: `655.50 gCO2e/kWh`

Average renewable share in the bundled data:

- Botswana 2023: `0.43%`
- Botswana 2024: `0.30%`
- South Africa 2023: `12.65%`
- South Africa 2024: `11.42%`

This means the current analytics narrative implicitly presents Botswana as the more carbon-intensive and much less renewable-heavy grid, while South Africa remains carbon-heavy but somewhat cleaner in relative terms.

### Limitations

- the "heatmap" is not a heatmap; it is transformed into a bar chart
- the sensitivity slider is a generic multiplier, not a real modeling control
- there is no user-uploaded data path
- there is no predictive layer in the active UI
- there is no direct integration with the ML utilities in `src/utils/mlAnalytics.ts`

### Product reading

Analytics is one of the strongest parts of the current app because it is tied to structured bundled data instead of pure placeholders.

### 5.4 Enterprise Carbon Calculator

File:

- `src/scenes/calculator.tsx`

### Intent

Estimate enterprise emissions across Scope 1, Scope 2, and Scope 3 categories.

### Implemented inputs

Scope 1:

- diesel litres
- water consumption

Scope 2:

- electricity kWh
- African subregion selector

Scope 3:

- business travel km
- employee commuting km
- waste kg
- packaging kg

### Formula model

Implemented emission factors:

| Category | Factor |
| --- | --- |
| Diesel combustion | `2.70 kgCO2e/litre` |
| Water consumption | `0.002 kgCO2e/litre` |
| Flights | `0.18 kgCO2e/km` |
| Employee commuting | `0.12 kgCO2e/km` |
| Waste | `0.1 kgCO2e/kg` |
| Packaging | `0.25 kgCO2e/kg` |

Electricity factors by region:

| Region | Factor |
| --- | --- |
| Southern Africa | `0.920` |
| Middle Africa | `0.850` |
| Eastern Africa | `0.740` |
| Western Africa | `0.880` |
| Northern Africa | `0.610` |

### What is implemented well

- formula calculation is straightforward and readable
- results breakdown is visualized immediately
- scenarios are persisted locally

### What remains placeholder-level

- "Export Report" only triggers an alert
- trend chart is static demo data
- no standards mapping is shown for GHG Protocol or ISO alignment
- no factor provenance is documented inside the UI
- no data validation beyond basic numeric parsing

### Additional observations

- `@nivo/bar` is imported but not used
- the page-level text color is set to a red tone on the root wrapper, then locally overridden in many places, which suggests styling drift

### Product reading

This is a useful calculator prototype, but not yet an audit-grade or compliance-grade carbon accounting tool.

### 5.5 Emission Tracker

File:

- `src/scenes/emission_tracker.tsx`

### Intent

Blend real-time monitoring with historical analysis and regional comparisons.

### Implemented elements

- interval selector for seconds, minutes, hours, days
- line chart for real-time emissions
- line chart for historical emissions
- regional emissions comparison chart
- energy mix breakdown by region
- region filter and chart mode toggle

### Data sources

- simulated random emissions for the real-time feed
- `B_E_D.json` for regional comparison and energy mix

`B_E_D.json` contains 192 rows across 8 Botswana regions:

- Central
- South East
- Chobe
- Ghanzi
- Kgalagadi
- Kweneng
- North West
- Southern

Each region appears 24 times in the bundled file.

### What is real vs simulated

Real:

- regional aggregation from `B_E_D.json`

Simulated:

- real-time emissions use random values between 20 and 965
- historical data is derived from the simulated stream rather than a real historical source

### Verified logic issues

- `historicalData` appends the entire `realTimeData` array every time `realTimeData` changes, which duplicates prior samples repeatedly
- chart mode `line` actually renders a vertical `BarChart`, not a line chart
- interval modes `hours` and `days` are technically valid but impractical during short sessions

### Product reading

The tracker is better described as a simulation dashboard than a true telemetry screen.

### 5.6 Settings, Profile, And Modals

Files:

- `src/pages/Settings.tsx`
- `src/pages/Profile.tsx`
- `src/scenes/modals/SettingsModal.tsx`
- `src/modals/ProfileModal.tsx`

### What is implemented

- settings modal
- profile modal
- local toggles for notifications and privacy
- password update flow through the local auth shim

### What is placeholder-only

- export data uses an alert
- delete account uses a confirmation plus alert
- profile save uses an alert
- 2FA is a UI toggle only

### Architectural note

The topbar opens modal versions of profile and settings, while the app also exposes `/settings` as a route. This split is not inherently wrong, but in this codebase it causes duplication and reduces chunking efficiency because settings is both lazily routed and statically imported into a modal.

### 5.7 Collaborators Hub

File:

- `src/pages/CollaboratorsHub.tsx`

### Intent

Introduce team collaboration, project management, and resource coordination around environmental work.

### Current state

Everything on this page is static array data:

- active projects
- collaboration teams
- resource allocation

There is no persistence, workflow engine, or connection to the emissions domain model.

### Product reading

This page reflects a broader product ambition, but it is currently concept UI rather than application logic.

## 6. Data Assets And Domain Model

### Bundled datasets

| File | Records | Active use |
| --- | --- | --- |
| `src/data/BW_2023_monthly.json` | 12 | Yes |
| `src/data/BW_2024_monthly.json` | 12 | Yes |
| `src/data/ZA_2023_monthly.json` | 12 | Yes |
| `src/data/ZA_2024_monthly.json` | 12 | Yes |
| `src/data/ZA_2023_yearly.json` | 1 | Yes, but mismatched field usage |
| `src/data/B_E_D.json` | 192 | Yes |
| `src/data/BW_2023_daily.json` | 365 | Bundled but unused |
| `src/data/BW_2024_daily.json` | 366 | Bundled but unused |
| `src/data/ZA_2023_daily.json` | 365 | Bundled but unused |
| `src/data/dd2.js` | present | Unused |
| `src/data/dd23.json` | present | Unused |
| `src/data/D_C_D.js` | present | Unused |

### Data provenance

The monthly datasets contain source strings such as:

- `eskom.co.za`
- `Electricity Maps Estimation`

This is useful, but the app currently does not surface provenance clearly enough for user trust or compliance workflows.

### Domain model maturity

The codebase does not define a strong shared domain schema for:

- emissions records
- regions
- facilities
- scenarios
- users
- reports
- projects

Instead, the domain is spread across:

- JSON file shapes
- ad hoc TypeScript interfaces
- local component objects
- untyped `any` usage

This makes the app harder to extend safely.

## 7. State Management And Persistence

### Current approach

- mostly local React `useState`
- browser `localStorage`
- one Zustand store not actively integrated into the routed app

### Zustand store findings

`src/stores/emissionsStore.ts` seeds data from ZA and BW monthly files, but:

- it is not used in the main product flow
- it maps `gridIntensity` from `entry["RE%"]`, which does not exist on the active dataset shape

The correct dataset key is `Renewable energy percentage (RE%)`, so `gridIntensity` will be `undefined` in this store as written.

### Implications

- no coherent shared data layer
- no normalized application state
- limited reusability between pages
- localStorage persistence is easy for demos but fragile for real applications

## 8. Build, Tooling, And Developer Experience

### Verified on March 25, 2026

`npm run build` succeeded.

Observed build warnings:

- oversized chunks after minification
- dynamic import dilution because `Settings.tsx` is both lazy-loaded by route and statically imported in the settings modal

Approximate build outputs reported by Vite:

- main JS bundle: about `1007 kB` minified
- shared chunk `header-*.js`: about `333 kB`
- dashboard chunk: about `158 kB`
- analytics chunk: about `111 kB`

### Linting status

ESLint does not currently run. The config imports `eslint-plugin-react-hooks`, but that package is not installed. As of March 25, 2026, this means the repo has no working lint gate.

### Type checking status

The repository has a strict TypeScript config, but the build script is only `vite build`. Vite does not perform full TypeScript type checking by default. So strict compiler settings exist on paper more than in the actual CI path.

### Testing status

No test files were found in the repository.

### Configuration drift

The repo includes both:

- `vite.config.ts`
- `vite.config.js`

They are near-duplicates. This is a maintenance smell and risks confusion about the active config source.

## 9. Design And UX Assessment

### Strengths

- the overall product theme is recognizable and consistent enough for a prototype
- chart-heavy pages communicate intent quickly
- the login screen has more personality than the rest of the app because of the Vanta background
- routing and navigation are easy to understand

### Weaknesses

- styling is split across Tailwind utilities, `src/index.css`, `src/global.css`, MUI tokens, and an unused theme file
- the topbar title says `GREEN-LOOP`, while the app, repo, and README say `Ecosphere`
- the header subtitle uses gray text on dark surfaces, which hurts contrast
- many pages rely on alerts instead of proper feedback components
- there is no accessibility pass evident in keyboard flow, aria labeling, or semantic assistance

### Product coherence issue

The app mixes:

- enterprise carbon accounting
- regional electricity analytics
- environmental project collaboration
- mock account management

These can belong together, but the current implementation has not yet unified them into one strong product narrative.

## 10. Dead Code, Stale Artifacts, And Inconsistencies

The repository contains multiple signs of unfinished refactors or leftover experiments.

### Empty or broken files

- `src/ProtectedRoute.tsx` is empty
- `src/components/RealTimeEmissionChart.tsx` is empty
- `src/scenes/emission_tracker/emission_tracker.tsx` is empty
- `src/utils/vanta.d.ts` is empty

### Unused or stale modules

- `src/utils/mlAnalytics.ts` contains TensorFlow.js and K-Means utilities but is not used by active screens
- `src/components/HeatMap.tsx` is not used
- `src/components/LoginForm.tsx` is not used
- `src/hooks/useKpiAnimation.ts` is not used
- `src/theme.ts` is not used
- `src/utils/vercelInfo.ts` is not used
- background animation components under `src/components/ui/` are not used

### Broken but non-runtime code path

`src/scenes/modals/ProfileModal.tsx` imports `../../scenes/Profile`, which does not exist. This file does not break the current build only because it is not imported by the active route tree.

### Unrelated artifact

`src/pages/flowchart LR.mmd` contains a Mermaid diagram about M3U parsing and Spotify scoring. It appears unrelated to Ecosphere and likely came from another experiment or codebase.

## 11. Dependency Surface Review

The repo currently declares:

- 45 runtime dependencies
- 25 dev dependencies

Only a subset is clearly active in the shipped app.

### Clearly active

- React
- React Router
- Recharts
- Chart.js
- MUI
- Lucide React
- React Icons
- Three.js
- Vanta

### Present but not active in the routed experience

- TensorFlow.js
- `ml-kmeans`
- Supabase SDK packages
- `jspdf`
- `exceljs`
- `file-saver`
- `lightweight-charts`
- `react-hook-form`
- `zod`
- `cmdk`
- `vaul`
- `sonner`
- `next`

This matters because unused dependency surface increases:

- install time
- attack surface
- lockfile churn
- cognitive load
- bundle analysis complexity

## 12. 2026 Standards Gap Analysis

Relative to common 2026 expectations for a production web app, Ecosphere is behind in the following areas.

| Area | Current state | 2026 expectation | Gap |
| --- | --- | --- | --- |
| Auth | LocalStorage mock with plaintext passwords | Server-backed auth, secure storage, proper recovery, route guards | Severe |
| Data layer | Bundled JSON imports | API-driven or managed data sync with provenance and refresh | Severe |
| Validation | Minimal manual parsing | Shared schemas and typed contracts | High |
| Testing | No tests | Unit, integration, and route smoke coverage | High |
| Lint/type gates | Lint broken, type check not enforced in build | Working CI gates | High |
| Observability | None | Error monitoring, analytics, logging | High |
| Accessibility | Limited evidence | Keyboard, semantics, contrast, focus states | Medium-high |
| Performance | Large bundles, duplicate imports | Chunk strategy and performance budgets | Medium-high |
| Product trust | Hardcoded metrics and fake exports | Traceable data, real reporting, trust indicators | High |
| Code hygiene | Dead files and duplicate config | Clear ownership and cleaned tree | Medium |

## 13. Production Risks

If this application were exposed to real users in its current form, the main risks would be:

- users mistaking demo values for real environmental metrics
- insecure credential storage and account handling
- weak confidence in reports because export and provenance are not truly implemented
- maintenance friction due to duplicate, stale, and unused code
- difficulty scaling the product because there is no stable shared domain model

## 14. Recommended Modernization Roadmap

### Phase 1: Stabilize the foundation

- replace the local auth shim with real Supabase auth or another real identity provider
- implement actual route protection
- remove plaintext password handling entirely
- fix verified correctness bugs in dashboard totals and tracker history accumulation
- clean dead files and duplicate config
- restore working ESLint and add a real type-check script

### Phase 2: Clarify the product model

- decide whether Ecosphere is primarily:
  - an enterprise carbon accounting app
  - a regional grid analytics app
  - a collaboration tool for environmental projects
- align navigation, branding, and copy around that answer
- either remove or fully integrate Collaborators Hub

### Phase 3: Formalize the domain

- introduce typed domain models for datasets, scenarios, reports, and regions
- define emissions factor provenance and versioning
- centralize formulas and units in a dedicated domain module
- replace scattered `any` usage with real interfaces or schema-validated parsing

### Phase 4: Make data trustworthy

- move data loading behind an API or managed content layer
- show dataset timestamp, source, and coverage in the UI
- support refresh and versioning
- distinguish clearly between simulated data, seeded demo data, and real imported data

### Phase 5: Improve UX and performance

- rationalize styling into one system
- remove unused dependencies
- improve route-level chunking
- replace alerts with real toasts or inline feedback
- add accessibility review and contrast corrections

### Phase 6: Add advanced capability only after the basics

- wire ML utilities into real user value only if forecasting is needed
- implement genuine export generation using `jspdf` or server-side reporting
- add scenario comparison, organizational hierarchy, and audit logs
- support ingestion of user-provided activity data

## 15. Final Assessment

Ecosphere has a credible idea at its center:

- make carbon data easier to understand
- localize regional electricity context
- let users estimate operational emissions quickly

The codebase already proves that idea can be expressed through a clean dashboard-style product. The problem is not concept clarity. The problem is implementation maturity.

As of March 25, 2026, Ecosphere should be classified as:

- a strong prototype
- a weak production system
- a promising base for a focused rewrite or modernization pass

If the goal is to preserve the current spirit of the app while bringing it up to modern standards, the most important move is not adding more charts or more AI features. It is converting the current demo architecture into a trustworthy platform:

- real auth
- real data contracts
- real validation
- real reporting
- real testing

Once those are in place, the existing product direction becomes much more viable.

## Appendix A: Quick Evidence Snapshot

- App shell routing: `src/App.tsx`
- Local auth shim: `src/utils/supabaseClient.ts`
- Dashboard logic: `src/scenes/dashboard/dashboard.tsx`
- Analytics page: `src/scenes/analytics.tsx`
- Calculator formulas: `src/scenes/calculator.tsx`
- Tracker simulation: `src/scenes/emission_tracker.tsx`
- Settings/Profile placeholders: `src/pages/Settings.tsx`, `src/pages/Profile.tsx`
- Collaboration page: `src/pages/CollaboratorsHub.tsx`
- Unused ML utilities: `src/utils/mlAnalytics.ts`
- Broken lint config dependency path: `eslint.config.js` plus missing `eslint-plugin-react-hooks`
