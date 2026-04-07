# Ecosphere v2.1 — Database & Backend Architecture Schema

**Document type**: Design reference — no code changes  
**Purpose**: Recommended database schema, technology selection, and data-flow architecture for full production deployment of the Ecosphere v2.1 / POWAMOV Intelligence Platform

---

## Table of Contents

1. [Recommended Technology Stack](#1-recommended-technology-stack)
2. [Architecture Overview & Data Flow](#2-architecture-overview--data-flow)
3. [Core Schema — PostgreSQL](#3-core-schema--postgresql)
4. [Time-Series Schema — TimescaleDB Hypertables](#4-time-series-schema--timescaledb-hypertables)
5. [Cache Layer — Redis](#5-cache-layer--redis)
6. [Table Relationship Map](#6-table-relationship-map)
7. [API-to-Database Mapping](#7-api-to-database-mapping)
8. [Index Strategy](#8-index-strategy)
9. [Data Volumes & Retention Policy](#9-data-volumes--retention-policy)
10. [Migration & Seeding Strategy](#10-migration--seeding-strategy)

---

## 1. Recommended Technology Stack

### 1.1 Primary Databases

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Relational (primary) | **PostgreSQL** | 16+ | Industry-standard RDBMS; supports JSONB for flexible telemetry metadata; full ACID compliance; native support for Drizzle ORM (already scaffolded in `lib/db`) |
| Time-series extension | **TimescaleDB** | 2.x | PostgreSQL extension — same connection, same SQL tooling, but adds automatic time-partitioning (chunking), compression, and continuous aggregates for the high-volume telemetry tables; 10–100× faster range queries on time-ordered data than vanilla PostgreSQL |
| Cache & sessions | **Redis** | 7+ | In-memory key-value store for session tokens, live telemetry snapshots, and rate limiting; sub-millisecond reads; TTL-based expiry aligns perfectly with session expiry requirements |
| Object storage | **S3-compatible** | — | For binary assets (maintenance photos, node installation images, report PDFs); providers: AWS S3, Cloudflare R2, MinIO (self-hosted) |

### 1.2 Why Not InfluxDB / MongoDB / etc.?

| Alternative | Verdict |
|------------|---------|
| InfluxDB | Good time-series DB but introduces a second query language (Flux/InfluxQL) and a separate connection pool; TimescaleDB gives the same time-series capabilities while staying in the PostgreSQL ecosystem |
| MongoDB | No benefit here — all data is well-structured and relational; JSONB in PostgreSQL handles any flexibility needed without sacrificing foreign key constraints |
| Firebase/Firestore | No offline-capable schema migrations; difficult to enforce referential integrity; poor fit for engineering-grade analytics |
| SQLite | Not suitable for multi-user server deployment; no support for TimescaleDB extension |

### 1.3 Backend Service Layer

| Service | Technology |
|---------|-----------|
| API Server | Express 5 (already in `artifacts/api-server`) |
| ORM / Query Builder | Drizzle ORM (already in `lib/db`) |
| Schema migrations | Drizzle Kit (`pnpm --filter @workspace/db run push` for dev, `drizzle-kit migrate` for prod) |
| Background jobs | BullMQ (Redis-backed job queue) — for scheduled aggregation, report generation, maintenance alert evaluation |
| Real-time push | Socket.IO or Server-Sent Events over the existing Express server — for live dashboard updates without polling |

---

## 2. Architecture Overview & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│   React App (artifacts/powamov)                                     │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │Dashboard │  │Digital   │  │Telemetry  │  │Manual Calculator │  │
│  │Command   │  │Twin      │  │Engine     │  │Carbon Analytics  │  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS / REST API
                    (TanStack Query)
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                        API SERVER LAYER                             │
│   Express 5 (artifacts/api-server)                                  │
│                                                                     │
│  /api/auth/*        /api/nodes/*      /api/telemetry/*             │
│  /api/analytics/*   /api/maintenance/* /api/scenarios/*            │
│  /api/calculator/*  /api/iot/*        /api/emissions/*             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM → PostgreSQL + TimescaleDB                     │   │
│  │  Redis Client  → Cache / Sessions / Rate Limits             │   │
│  │  BullMQ Worker → Background Jobs                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                        │                     │
         ▼                        ▼                     ▼
┌────────────────┐    ┌──────────────────────┐   ┌───────────────┐
│   PostgreSQL   │    │   TimescaleDB        │   │    Redis      │
│   (Primary)    │    │   (Time-Series)      │   │   (Cache)     │
│                │    │                      │   │               │
│  users         │    │  node_telemetry      │   │  sessions     │
│  nodes         │    │  vehicle_passes      │   │  live_snap    │
│  scenarios     │    │  iot_readings        │   │  rate_limit   │
│  alerts        │    │  energy_daily_agg    │   │  job_queue    │
│  maintenance   │    │  carbon_hourly_agg   │   │               │
│  teams         │    │                      │   │               │
└────────────────┘    └──────────────────────┘   └───────────────┘
```

### 2.1 Data Flow Paths

**POWAMOV Telemetry Path**
```
Physical Strip → IoT Gateway → MQTT Broker → API /api/ingest/telemetry
→ BullMQ ingest queue → TimescaleDB node_telemetry
→ Redis live_snapshot (latest per node) ← Dashboard polling
→ Daily aggregation job → energy_harvest_daily
```

**Carbon Calculator Path**
```
User fills form → POST /api/calculator/scenarios
→ PostgreSQL carbon_scenarios + carbon_scenario_items
→ Zustand store (frontend cache)
→ GET /api/calculator/scenarios → Dashboard comparison
```

**IoT Telemetry Engine Path (Industrial/Campus)**
```
Frontend simulation → POST /api/iot/readings (batch)
→ TimescaleDB iot_readings (partitioned by scenario + time)
→ Continuous aggregate → iot_hourly_summaries
→ GET /api/iot/summary/:scenarioId → Telemetry Engine UI
```

**Maintenance Alert Path**
```
TimescaleDB node_telemetry → BullMQ job (runs every hour)
→ Degradation model evaluation → PostgreSQL maintenance_alerts
→ GET /api/maintenance/alerts → Maintenance page
→ Notification dispatch (email/webhook if configured)
```

---

## 3. Core Schema — PostgreSQL

All tables use `uuid` primary keys generated with `gen_random_uuid()`. All timestamps are `timestamptz` (timezone-aware). Soft deletes via `deleted_at timestamptz` where applicable.

---

### 3.1 Auth Domain

#### `users`
```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           varchar(320) NOT NULL UNIQUE,
  password_hash   varchar(256) NOT NULL,         -- bcrypt/argon2 hash
  first_name      varchar(120),
  last_name       varchar(120),
  country         varchar(120),
  region          varchar(120),
  avatar_url      varchar(2048),
  role            varchar(32) NOT NULL DEFAULT 'viewer',  -- 'admin' | 'engineer' | 'viewer'
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
```

#### `sessions`
Stored primarily in Redis (key: `session:{token}`, TTL: 30 days). PostgreSQL table for audit trail only:
```sql
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      varchar(256) NOT NULL UNIQUE,  -- SHA-256 of the actual token
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz
);
```

**Redis session key**: `session:{token}` → JSON `{ userId, email, role, expiresAt }`

---

### 3.2 POWAMOV Infrastructure Domain

#### `powamov_sites`
Top-level geographic installations (e.g., "A1 North Gaborone Corridor"):
```sql
CREATE TABLE powamov_sites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(200) NOT NULL,
  road_label      varchar(100),                  -- e.g. "A1 North"
  corridor        varchar(200),                  -- e.g. "Rasesa → Gaborone"
  country         char(2) NOT NULL DEFAULT 'BW', -- ISO 3166-1 alpha-2
  latitude        decimal(9,6),
  longitude       decimal(9,6),
  speed_base_kmh  integer,                       -- typical vehicle speed at site
  commissioned_at timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `powamov_nodes`
Individual strip assemblies within a site. One site has 1..N nodes:
```sql
CREATE TABLE powamov_nodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES powamov_sites(id),
  node_code         varchar(50) NOT NULL UNIQUE,  -- e.g. "A1N-003"
  strip_count       integer NOT NULL DEFAULT 6,
  installation_date date,
  firmware_version  varchar(50),
  rated_capacity_kw decimal(8,3),                 -- nameplate capacity
  status            varchar(20) NOT NULL DEFAULT 'active',
  -- 'active' | 'degrading' | 'offline' | 'maintenance' | 'decommissioned'
  health_score      decimal(5,2),                 -- 0-100, computed by background job
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

#### `node_strips`
Individual piezoelectric/spring-compression strips within a node:
```sql
CREATE TABLE node_strips (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         uuid NOT NULL REFERENCES powamov_nodes(id),
  strip_index     integer NOT NULL CHECK (strip_index BETWEEN 1 AND 12),
  material_type   varchar(50),                   -- e.g. "piezoelectric", "electromagnetic"
  rated_force_kn  decimal(6,2),
  rated_wh_per_pass decimal(8,4),
  installed_at    timestamptz,
  total_passes    bigint NOT NULL DEFAULT 0,     -- lifetime counter
  UNIQUE(node_id, strip_index)
);
```

---

### 3.3 Maintenance Domain

#### `maintenance_alerts`
AI/predictive alerts generated by the background degradation model. The predictive logic is internal — users see this simply as "Maintenance":
```sql
CREATE TABLE maintenance_alerts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           uuid NOT NULL REFERENCES powamov_nodes(id),
  alert_type        varchar(50) NOT NULL,
  -- 'spring_fatigue' | 'seal_wear' | 'debris' | 'electrical' | 'comms'
  severity          varchar(20) NOT NULL DEFAULT 'warning',
  -- 'info' | 'warning' | 'critical'
  efficiency_drop_pct decimal(5,2),              -- projected % drop
  root_cause        varchar(500),
  service_window    varchar(100),                -- human-readable e.g. "3 weeks"
  service_window_days integer,                  -- machine-readable
  status            varchar(20) NOT NULL DEFAULT 'open',
  -- 'open' | 'acknowledged' | 'in_progress' | 'resolved'
  created_at        timestamptz NOT NULL DEFAULT now(),
  acknowledged_at   timestamptz,
  acknowledged_by   uuid REFERENCES users(id),
  resolved_at       timestamptz,
  resolved_by       uuid REFERENCES users(id),
  notes             text
);
```

#### `maintenance_work_orders`
Actual physical maintenance events performed by field teams:
```sql
CREATE TABLE maintenance_work_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         uuid NOT NULL REFERENCES powamov_nodes(id),
  alert_id        uuid REFERENCES maintenance_alerts(id),
  team_id         uuid REFERENCES field_teams(id),
  work_type       varchar(100) NOT NULL,
  description     text,
  scheduled_date  date,
  started_at      timestamptz,
  completed_at    timestamptz,
  labour_hours    decimal(6,2),
  parts_replaced  jsonb DEFAULT '[]',            -- [{ "part": "...", "qty": 1, "cost": ... }]
  total_cost_usd  decimal(12,2),
  health_before   decimal(5,2),                  -- health_score snapshot before work
  health_after    decimal(5,2),                  -- health_score snapshot after work
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

### 3.4 Operations Domain

#### `deployments`
High-level operational deployment zones:
```sql
CREATE TABLE deployments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(200) NOT NULL,
  region          varchar(200),
  country         char(2) NOT NULL DEFAULT 'BW',
  status          varchar(30) NOT NULL DEFAULT 'active',
  -- 'planning' | 'installation' | 'active' | 'maintenance' | 'decommissioned'
  total_nodes     integer NOT NULL DEFAULT 0,
  commissioned_at date,
  lead_engineer   uuid REFERENCES users(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `field_teams`
POWAMOV field maintenance and installation teams:
```sql
CREATE TABLE field_teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(200) NOT NULL,
  lead_user_id    uuid REFERENCES users(id),
  deployment_id   uuid REFERENCES deployments(id),
  specialisation  varchar(100),
  -- 'installation' | 'maintenance' | 'monitoring' | 'electrical'
  member_count    integer NOT NULL DEFAULT 0,
  status          varchar(30) NOT NULL DEFAULT 'active',
  -- 'active' | 'on_site' | 'standby' | 'unavailable'
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `team_members`
Many-to-many: users ↔ field teams:
```sql
CREATE TABLE team_members (
  team_id         uuid NOT NULL REFERENCES field_teams(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            varchar(80),
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
```

---

### 3.5 Carbon Intelligence Domain

#### `carbon_datasets`
Metadata for the static BW/ZA electricity data files:
```sql
CREATE TABLE carbon_datasets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country         char(2) NOT NULL,              -- 'BW' | 'ZA'
  year            integer NOT NULL,
  granularity     varchar(20) NOT NULL,           -- 'monthly' | 'daily' | 'hourly'
  source          varchar(200) NOT NULL DEFAULT 'Electricity Maps',
  record_count    integer,
  grid_intensity_avg_gco2_kwh decimal(8,3),
  re_percentage_avg decimal(5,2),
  storage_path    varchar(500),                   -- path to the JSON/CSV file or S3 key
  imported_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country, year, granularity)
);
```

#### `carbon_readings`
Imported data from the Electricity Maps exports (BW/ZA, 2023/2024). Replaces the static JSON files in production:
```sql
CREATE TABLE carbon_readings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id      uuid NOT NULL REFERENCES carbon_datasets(id),
  region          varchar(100),                  -- Botswana region name, or null for national
  recorded_at     timestamptz NOT NULL,
  carbon_intensity_direct_gco2_kwh decimal(8,3),
  carbon_intensity_lca_gco2_kwh   decimal(8,3),
  re_percentage   decimal(5,2),
  fossil_pct      decimal(5,2),
  nuclear_pct     decimal(5,2),
  import_pct      decimal(5,2)
);
CREATE INDEX idx_carbon_readings_dataset_time ON carbon_readings(dataset_id, recorded_at);
CREATE INDEX idx_carbon_readings_region ON carbon_readings(region, recorded_at);
```

#### `carbon_scenarios` (Calculator)
User-created emission calculation scenarios:
```sql
CREATE TABLE carbon_scenarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  name            varchar(300) NOT NULL DEFAULT 'Scenario',
  organisation    varchar(300),
  country         char(2),
  region          varchar(120),
  year            integer,
  scope1_kgco2    decimal(14,3) NOT NULL DEFAULT 0,
  scope2_kgco2    decimal(14,3) NOT NULL DEFAULT 0,
  scope3_kgco2    decimal(14,3) NOT NULL DEFAULT 0,
  total_kgco2     decimal(14,3) NOT NULL DEFAULT 0,
  powamov_offset_kgco2 decimal(14,3),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `carbon_scenario_items`
Individual line items (Scope 1/2/3 activity entries) within a scenario:
```sql
CREATE TABLE carbon_scenario_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     uuid NOT NULL REFERENCES carbon_scenarios(id) ON DELETE CASCADE,
  scope           integer NOT NULL CHECK (scope IN (1, 2, 3)),
  category        varchar(100) NOT NULL,
  -- 'diesel' | 'electricity' | 'water' | 'flights_economy' | 'vehicle_petrol' | 'waste_landfill' | ...
  activity_amount decimal(14,4) NOT NULL,
  activity_unit   varchar(50) NOT NULL,           -- 'litres' | 'kWh' | 'km' | 'kg'
  emission_factor decimal(12,6) NOT NULL,         -- kg CO2 per activity_unit
  region_key      varchar(50),                    -- e.g. 'SOUTHERN_AFRICA'
  kgco2           decimal(14,4) NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0
);
```

---

### 3.6 IoT Telemetry Scenarios Domain

#### `iot_scenarios`
Definitions of the simulation scenarios (Industrial, Campus, Regional):
```sql
CREATE TABLE iot_scenarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            varchar(100) NOT NULL UNIQUE,  -- 'industrial' | 'campus' | 'regional'
  label           varchar(200) NOT NULL,
  site_name       varchar(200),                  -- 'Taurus Batteries' | 'Botho University'
  country         char(2) NOT NULL DEFAULT 'BW',
  config          jsonb NOT NULL DEFAULT '{}',   -- scenario-specific parameters
  is_simulation   boolean NOT NULL DEFAULT true, -- false when real IoT devices connected
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `iot_sensor_groups`
Logical groupings of sensors within a scenario:
```sql
CREATE TABLE iot_sensor_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     uuid NOT NULL REFERENCES iot_scenarios(id),
  slug            varchar(100) NOT NULL,
  -- 'power' | 'generator' | 'gas' | 'fire' | 'hvac' | 'fleet' | 'occupancy' | 'lab'
  label           varchar(200) NOT NULL,
  update_interval_s integer NOT NULL,            -- nominal seconds between readings
  alert_rules     jsonb NOT NULL DEFAULT '[]',
  -- [{ "metric": "hydrogenPpm", "operator": ">", "value": 65, "level": "alert" }]
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, slug)
);
```

---

## 4. Time-Series Schema — TimescaleDB Hypertables

These tables are created as regular PostgreSQL tables, then converted to TimescaleDB hypertables using `SELECT create_hypertable(...)`. TimescaleDB automatically partitions data into "chunks" by time range (typically 1-day chunks for high-frequency, 1-week chunks for lower frequency).

---

### 4.1 `node_telemetry`
Raw readings from POWAMOV strip nodes. ~1 reading per 30 seconds per node.

```sql
CREATE TABLE node_telemetry (
  time            timestamptz NOT NULL,
  node_id         uuid NOT NULL,                 -- FK to powamov_nodes (no REFERENCES for perf)
  voltage_v       decimal(8,3),
  current_a       decimal(8,4),
  power_kw        decimal(8,4),
  energy_kwh      decimal(10,6),
  temperature_c   decimal(6,2),
  vibration_hz    decimal(8,2),
  strip_id        integer,                       -- which strip (1-6), null for aggregate
  compression_mm  decimal(6,3),
  efficiency_pct  decimal(5,2)
);
SELECT create_hypertable('node_telemetry', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON node_telemetry(node_id, time DESC);
```

### 4.2 `vehicle_passes`
Each individual vehicle traversal event captured by a node. Very high volume.

```sql
CREATE TABLE vehicle_passes (
  time              timestamptz NOT NULL,
  node_id           uuid NOT NULL,
  weight_class      varchar(20) NOT NULL,         -- 'light' | 'medium' | 'heavy'
  est_weight_kg     decimal(8,0),
  speed_kmh         decimal(6,1),
  compression_force_kn decimal(8,3),
  energy_wh         decimal(10,4),
  duration_ms       integer                       -- time vehicle was on strips
);
SELECT create_hypertable('vehicle_passes', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON vehicle_passes(node_id, time DESC);
```

### 4.3 `energy_harvest_daily`
Pre-aggregated daily summary per node (continuous aggregate over `node_telemetry`):

```sql
CREATE MATERIALIZED VIEW energy_harvest_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time)   AS bucket_day,
  node_id,
  sum(energy_kwh)              AS total_kwh,
  avg(efficiency_pct)          AS avg_efficiency_pct,
  max(power_kw)                AS peak_power_kw,
  count(*)                     AS reading_count
FROM node_telemetry
GROUP BY bucket_day, node_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('energy_harvest_daily',
  start_offset => INTERVAL '3 days',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);
```

### 4.4 `iot_readings`
Time-series sensor readings from Industrial and Campus IoT scenarios:

```sql
CREATE TABLE iot_readings (
  time            timestamptz NOT NULL,
  scenario_id     uuid NOT NULL,
  group_slug      varchar(100) NOT NULL,          -- 'power' | 'gas' | 'hvac' | etc.
  metrics         jsonb NOT NULL,
  -- Industrial power example: { "totalKwh": 850.2, "machineLoadPct": 72.1, "peakDemandKw": 221 }
  -- Industrial gas example:   { "hydrogenPpm": 12.4, "chemicalIndex": 24.2, "aqi": 68 }
  co2_kg          decimal(10,4),                  -- calculated emissions for this reading
  risk_level      varchar(20)                     -- 'normal' | 'warning' | 'alert'
);
SELECT create_hypertable('iot_readings', 'time', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX ON iot_readings(scenario_id, group_slug, time DESC);
```

### 4.5 `carbon_hourly_agg`
Continuous aggregate over `iot_readings` for the Telemetry Engine charts:

```sql
CREATE MATERIALIZED VIEW carbon_hourly_agg
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time)  AS bucket_hour,
  scenario_id,
  group_slug,
  avg((metrics->>'totalKwh')::numeric)      AS avg_kwh,
  avg(co2_kg)                               AS avg_co2_kg,
  max(co2_kg)                               AS peak_co2_kg,
  count(*)                                  AS reading_count
FROM iot_readings
GROUP BY bucket_hour, scenario_id, group_slug
WITH NO DATA;
```

### 4.6 `node_health_hourly`
Continuous aggregate tracking node health score over time:

```sql
CREATE MATERIALIZED VIEW node_health_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time)  AS bucket_hour,
  node_id,
  avg(efficiency_pct)          AS avg_efficiency_pct,
  min(efficiency_pct)          AS min_efficiency_pct,
  avg(temperature_c)           AS avg_temp_c,
  count(*)                     AS reading_count
FROM node_telemetry
GROUP BY bucket_hour, node_id
WITH NO DATA;
```

---

## 5. Cache Layer — Redis

All Redis keys use a consistent naming convention: `{namespace}:{entity_type}:{id}`.

| Key Pattern | Type | TTL | Content |
|-------------|------|-----|---------|
| `session:{token_hash}` | Hash | 30 days | `{ userId, email, role, createdAt }` |
| `live:node:{node_id}` | Hash | 60 seconds | Latest telemetry reading for a node |
| `live:site:{site_id}:summary` | String (JSON) | 30 seconds | Aggregate for all nodes in a site |
| `live:iot:{scenario_id}` | Hash | 10 seconds | Latest sensor readings per scenario |
| `analytics:summary` | String (JSON) | 5 minutes | Pre-computed analytics summary |
| `ratelimit:{user_id}:{endpoint}` | Counter | 1 minute | Request count for rate limiting |
| `job:ingest:lock` | String | 30 seconds | Distributed lock for telemetry ingest worker |

### 5.1 Live Telemetry Cache Pattern

When a node sends a telemetry reading:
1. Write to `node_telemetry` TimescaleDB table (durable)
2. Atomically update `live:node:{node_id}` Redis hash (fast read for dashboard)
3. After write, publish to Redis Pub/Sub channel `telemetry:{site_id}` (real-time push to subscribed clients via Socket.IO)

When the dashboard polls `/api/telemetry/live`:
1. Read from Redis `live:node:*` (sub-millisecond)
2. If cache miss → query TimescaleDB `ORDER BY time DESC LIMIT 1` per node
3. Repopulate cache with 60s TTL

---

## 6. Table Relationship Map

```
users ──────────────────────────────────────────────────────────────┐
  │                                                                  │
  ├─── sessions (1:N)                                              │
  ├─── carbon_scenarios (1:N)                                       │
  │      └─── carbon_scenario_items (1:N)                           │
  ├─── maintenance_alerts.acknowledged_by / resolved_by (N:1)      │
  └─── maintenance_work_orders.completed_by (N:1)                  │
                                                                    │
powamov_sites ────────────────────────────────────────────────────  │
  └─── powamov_nodes (1:N) ──────────────────────────────────────  │
         │                                                          │
         ├─── node_strips (1:N)                                     │
         │                                                          │
         ├─── node_telemetry (1:N, TimescaleDB hypertable)         │
         │      └─── energy_harvest_daily (continuous agg)          │
         │      └─── node_health_hourly (continuous agg)            │
         │                                                          │
         ├─── vehicle_passes (1:N, TimescaleDB hypertable)         │
         │                                                          │
         └─── maintenance_alerts (1:N) ──────────────────────────  │
                └─── maintenance_work_orders (1:N) ───────────────  │
                       └─── field_teams (N:1) ──────────────────── │
                              └─── team_members (N:N) ──────────── ┘

iot_scenarios ──────────────────────────────────────────────────────
  ├─── iot_sensor_groups (1:N)
  └─── iot_readings (1:N, TimescaleDB hypertable)
         └─── carbon_hourly_agg (continuous agg)

carbon_datasets ────────────────────────────────────────────────────
  └─── carbon_readings (1:N)

deployments ────────────────────────────────────────────────────────
  └─── field_teams (1:N)
         └─── team_members (N:N) ─── users
```

---

## 7. API-to-Database Mapping

| API Endpoint | Primary DB | Cache | Notes |
|-------------|-----------|-------|-------|
| `GET /api/healthz` | — | — | No DB call |
| `POST /api/auth/login` | `users` READ | `sessions` WRITE | Verify hash, issue token |
| `POST /api/auth/signup` | `users` WRITE | `sessions` WRITE | Hash password, create session |
| `POST /api/auth/logout` | — | `sessions` DELETE | Redis key delete |
| `GET /api/nodes` | `powamov_nodes` JOIN `powamov_sites` | — | |
| `GET /api/nodes/:id/telemetry` | `node_telemetry` (TimescaleDB) | `live:node:{id}` | Hypertable range query |
| `POST /api/digital-twin/:id/simulate` | — (compute only) | — | Physics calculation, no DB write |
| `GET /api/telemetry/live` | — | `live:node:*` (Redis MGET) | Redis-first, DB fallback |
| `GET /api/maintenance/alerts` | `maintenance_alerts` | — | Filtered by status |
| `GET /api/maintenance/forecasts` | `node_health_hourly` (TimescaleDB view) | — | Continuous aggregate |
| `GET /api/analytics/summary` | `energy_harvest_daily` agg | `analytics:summary` (5min TTL) | Cached aggregate |
| `GET /api/analytics/energy-history` | `energy_harvest_daily` | — | Date range query |
| `POST /api/calculator/scenarios` | `carbon_scenarios` + `carbon_scenario_items` | — | Transaction |
| `GET /api/calculator/scenarios` | `carbon_scenarios` (user filter) | — | Ordered by created_at |
| `POST /api/iot/readings/batch` | `iot_readings` (TimescaleDB) | `live:iot:{scenario}` | Bulk insert + cache update |
| `GET /api/iot/summary/:scenarioId` | `carbon_hourly_agg` | `live:iot:{scenario}` | Cache-first |
| `GET /api/carbon/datasets` | `carbon_datasets` | — | |
| `GET /api/carbon/readings` | `carbon_readings` | — | Replaces static JSON in prod |

---

## 8. Index Strategy

### 8.1 PostgreSQL Indexes

```sql
-- Auth
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

-- Nodes
CREATE INDEX idx_nodes_site ON powamov_nodes(site_id) WHERE status != 'decommissioned';
CREATE INDEX idx_nodes_status ON powamov_nodes(status);

-- Maintenance
CREATE INDEX idx_alerts_node ON maintenance_alerts(node_id, status, created_at DESC);
CREATE INDEX idx_alerts_open ON maintenance_alerts(created_at DESC) WHERE status = 'open';
CREATE INDEX idx_workorders_node ON maintenance_work_orders(node_id, scheduled_date);

-- Carbon
CREATE INDEX idx_scenarios_user ON carbon_scenarios(user_id, created_at DESC);
CREATE INDEX idx_items_scenario ON carbon_scenario_items(scenario_id, scope);
```

### 8.2 TimescaleDB Compression

TimescaleDB chunks older than 7 days should be compressed for significant storage savings (~10–20× compression ratio on telemetry data):

```sql
ALTER TABLE node_telemetry SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'node_id'
);
SELECT add_compression_policy('node_telemetry', INTERVAL '7 days');

ALTER TABLE iot_readings SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'scenario_id, group_slug'
);
SELECT add_compression_policy('iot_readings', INTERVAL '7 days');
```

---

## 9. Data Volumes & Retention Policy

### 9.1 Estimated Write Volumes

| Table | Frequency | Est. Rows/Day | Est. Rows/Year |
|-------|-----------|--------------|----------------|
| `node_telemetry` | 30s × 20 nodes | 57,600 | 21M |
| `vehicle_passes` | varies | 50,000–200,000 | 18–73M |
| `iot_readings` (industrial) | 2s × 6 groups | 259,200 | 94.6M |
| `iot_readings` (campus) | 5–20s × 5 groups | 43,200 | 15.8M |
| `sessions` | low | ~100 | 36,500 |
| `carbon_scenarios` | very low | ~20 | 7,300 |

### 9.2 Retention Recommendations

| Table | Raw Retention | Aggregate Retention |
|-------|-------------|-------------------|
| `node_telemetry` | 90 days raw | 2 years (via `energy_harvest_daily`) |
| `vehicle_passes` | 30 days raw | 2 years (via daily counts) |
| `iot_readings` | 30 days raw | 1 year (via `carbon_hourly_agg`) |
| `carbon_readings` | Permanent (source data) | — |
| `maintenance_alerts` | Permanent | — |
| `sessions` | 90 days (after expiry) | — |

```sql
-- Add drop retention policies for raw data
SELECT add_retention_policy('node_telemetry', INTERVAL '90 days');
SELECT add_retention_policy('vehicle_passes', INTERVAL '30 days');
SELECT add_retention_policy('iot_readings',   INTERVAL '30 days');
```

---

## 10. Migration & Seeding Strategy

### 10.1 Migration Tool

Drizzle Kit is already scaffolded in `lib/db`. The recommended migration workflow:

```bash
# Generate migration from schema changes
pnpm --filter @workspace/db run generate

# Apply migrations to development database
pnpm --filter @workspace/db run push

# Apply to production (generates SQL files, review before applying)
pnpm --filter @workspace/db run migrate
```

### 10.2 TimescaleDB Setup Order

TimescaleDB must be set up after the base PostgreSQL tables are created, using this sequence:

```sql
-- 1. Install extension (run once as superuser)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Create regular tables first (via Drizzle migration)
-- 3. Convert to hypertables
SELECT create_hypertable('node_telemetry', 'time');
SELECT create_hypertable('vehicle_passes', 'time');
SELECT create_hypertable('iot_readings',   'time');

-- 4. Create continuous aggregates
-- (run the CREATE MATERIALIZED VIEW statements from Section 4)

-- 5. Add compression policies
-- (run the compression policy statements from Section 8.2)
```

### 10.3 Required Seed Data

The following tables need baseline data before the app is usable:

```sql
-- 1. Admin user
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@ecosphere.bw', '{argon2_hash}', 'System', 'Admin', 'admin');

-- 2. IoT scenarios
INSERT INTO iot_scenarios (slug, label, site_name, country, is_simulation)
VALUES
  ('regional',   'Regional Dataset',        NULL,              'BW', true),
  ('industrial', 'Industrial Facility',     'Taurus Batteries','BW', true),
  ('campus',     'Institutional Campus',    'Botho University','BW', true);

-- 3. Carbon datasets metadata
INSERT INTO carbon_datasets (country, year, granularity, source, storage_path)
VALUES
  ('BW', 2023, 'monthly', 'Electricity Maps', 'data/BW_2023_monthly.json'),
  ('ZA', 2023, 'monthly', 'Electricity Maps', 'data/ZA_2023_monthly.json'),
  ('BW', 2024, 'monthly', 'Electricity Maps', 'data/BW_2024_monthly.json'),
  ('ZA', 2024, 'monthly', 'Electricity Maps', 'data/ZA_2024_monthly.json');

-- 4. POWAMOV sites (Gaborone arterials)
INSERT INTO powamov_sites (name, road_label, corridor, country, speed_base_kmh)
VALUES
  ('A1 North Corridor',      'A1 North',      'Rasesa → Gaborone',   'BW', 105),
  ('A1 South Corridor',      'A1 South',      'Ramotswa → Gaborone', 'BW', 98),
  ('Tlokweng Border Route',  'Tlokweng',      'Tlokweng Corridor',   'BW', 72),
  ('Tsolamosese Corridor',   'Tsolamosese',   'West Corridor',       'BW', 55);
```

---

*Ecosphere v2.1 — Database & Backend Architecture — Design Reference*  
*Status: Design document only — no code has been modified*
