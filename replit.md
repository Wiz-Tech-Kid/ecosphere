# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Ecosphere 2.0 — POWAMOV Intelligence Dashboard

**Artifact**: `artifacts/powamov` — React + Vite app at `/` (preview path: root)

Ecosphere 2.0 is the upgraded version of Ecosphere (carbon emissions intelligence platform) merged with POWAMOV (kinetic road energy harvesting system). The app combines real BW/ZA carbon data, a Scope 1/2/3 enterprise calculator, an emission tracker, and POWAMOV infrastructure monitoring.

### Pages

**POWAMOV Infrastructure**
- `/command` — POWAMOV Command Center: live node map, telemetry, infrastructure status
- `/digital-twin` — Digital Twin: compression simulation with vehicle parameters
- `/maintenance` — Predictive Maintenance: degradation forecasts, alerts, health charts

**Carbon Intelligence (Ecosphere features)**
- `/analytics` — Energy Analytics: POWAMOV harvest totals, carbon offset, grid displacement
- `/carbon-analytics` — Regional Carbon Analytics: real BW & ZA monthly carbon intensity (2023/2024 data)
- `/calculator` — Enterprise Carbon Calculator: Scope 1, 2 & 3 with African regional emission factors, scenario saving
- `/tracker` — Emission Tracker: real-time simulation + Botswana regional energy data (B_E_D.json)

**Overview**
- `/` — Intelligence Overview: combined dashboard showing POWAMOV live stats + BW/ZA carbon KPIs + quick navigation

**Auth & Account (new)**
- `/login` — Animated sign-in / sign-up page (offline localStorage auth, no server required)
- `/profile` — User profile editor: personal info, password change modal, 2FA toggle, account stats
- `/settings` — Platform settings: language, appearance, notifications, privacy, JSON export, account delete
- `/collaborators` — POWAMOV Operations Hub: 5 deployments, 4 field teams, 5 resource categories, 3 environmental projects

### Auth System

Offline localStorage-based auth (`src/utils/auth.ts`):
- Keys: `e2_session` (active session), `e2_users` (user store)
- Functions: `login`, `signup`, `logout`, `updateProfile`, `changePassword`, `getSession`, `getUser`
- Auth guard: `AuthGuard` component in `App.tsx` wraps all protected routes

### State Management

Zustand store (`src/stores/emissionsStore.ts`):
- Seeded with BW/ZA monthly grid data (2023/2024) from JSON files
- Manages calculator scenarios and tracker entries (synced to localStorage)
- Keys: `e2_calculator_scenarios`, `e2_tracker_entries`

### Layout

- `src/components/layout/shell.tsx` — Sidebar with collapsible nav sections + user profile strip + topbar
- `src/components/layout/topbar.tsx` — Page breadcrumb, notification dropdown (4 alerts), user dropdown menu

### Real Ecosphere Data (from zip)
- `artifacts/powamov/src/data/BW_2023_monthly.json` — Botswana 2023 monthly carbon intensity
- `artifacts/powamov/src/data/ZA_2023_monthly.json` — South Africa 2023 monthly carbon intensity
- `artifacts/powamov/src/data/BW_2024_monthly.json` — Botswana 2024 monthly carbon intensity
- `artifacts/powamov/src/data/ZA_2024_monthly.json` — South Africa 2024 monthly carbon intensity
- `artifacts/powamov/src/data/B_E_D.json` — Botswana regional energy data (8 regions, 192 rows)
- `artifacts/powamov/src/data/ZA_2023_yearly.json` — South Africa 2023 yearly totals

### Backend
- **Mock Telemetry Service**: `artifacts/api-server/src/lib/mockPowamov.ts`
  - 8 pre-seeded POWAMOV nodes across San Francisco
  - Real-time telemetry generation (every 3s via interval)
  - Vehicle pass simulation, compression force modeling, degradation tracking
- **API Routes**: nodes, telemetry, maintenance, analytics

### Frontend Stack
- React 19 + TypeScript + Vite
- Recharts for data visualization
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS v4 for styling
- TanStack Query for data fetching
- Wouter for client-side routing

### Design System
- Dark near-black theme: `background: 222 47% 5%`
- Primary cyan: `hsl(185, 85%, 50%)`
- Accent green: `hsl(142, 70%, 45%)`
- Fonts: Space Grotesk (sans) + Space Mono (mono)
