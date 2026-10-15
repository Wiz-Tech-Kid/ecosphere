# Ecosphere 2.3 (ecov230)

**An energy management and energy intelligence platform for buildings,campuses and connected infrastructure.**

Ecosphere 2.3 is the next development line of Ecosphere. Its primary purpose is to collect energy telemetry from infrastructure,organize that data around physical locations and energy systems,and turn individual measurements into information that facilities teams,energy managers and decision makers can use.

This version shifts the product emphasis away from a Powamov centric interface and toward a general energy management platform. Powamov may eventually contribute telemetry as one infrastructure or energy source integration,but Ecosphere must not depend on Powamov to make sense as a product.

This README explains the product intent,known prototype architecture,telemetry model,Node-RED and MQTT work,planned frontend connection,development priorities and current limitations. It distinguishes what exists from what is planned; it must not be read as a claim that every planned integration is already operational.

## Local development quick start and verified status

This is a pnpm workspace. The production UI is the Svelte 5 + TypeScript + Vite application in `artifacts/ecosphere-23`; `artifacts/mockup-sandbox` is a separate React mockup and is not the production UI.

### Prerequisites and install

- Node.js 24 (the workspace was configured and previously run with Node 24).
- pnpm 12.11.2 (the lockfile uses format 9; the root manifest does not pin a `packageManager` field).
- PostgreSQL only for Drizzle schema operations or future API features that use the database. It is not required to run the current frontend or the API health route.
- Mosquitto and Node-RED are optional external tools; this repository does not install or start them.

From the repository root:

```sh
node --version
pnpm --version
pnpm install
```

The root `preinstall` script rejects npm/yarn and removes root `package-lock.json` and `yarn.lock` files. Use pnpm only.

Copy `.env.example` to `.env` and replace database credentials if database access is needed. The app does not load that file itself before evaluating its Vite configuration; explicitly export it in each terminal:

```sh
set -a
. ./.env
set +a
```

`.env` is ignored by Git. Never commit credentials. `VITE_NODE_RED_WS_URL` is shipped to the browser and must never contain a secret.

### Start and stop the application

Run the frontend and API in separate terminals at the repository root:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ecosphere-23 dev
```

Open <http://localhost:5173>. `PORT` is required; change it to another available port to override it. `BASE_PATH` is also required and should remain `/` for local root hosting.

```sh
PORT=5000 pnpm --filter @workspace/api-server run dev
```

The API requires `PORT`; its documented local port is 5000 and can be changed to another available port. Verify its implemented health route at <http://localhost:5000/api/healthz> (adjust the URL if you changed the port). The API entry point currently exposes the health route only; it does not serve frontend telemetry.

Press **Ctrl+C** in each terminal to stop that process. The browser app does not require the API, database, Mosquitto, or Node-RED to display its local demo readings.

### Database setup

`lib/db` contains a PostgreSQL Drizzle schema and one schema-push command. There are no migration-generation, migration-run, or seed scripts in this repository. A database must already be provisioned and reachable before using:

```sh
DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE' pnpm --filter @workspace/db run push
```

Use credentials for a development database you control and review the schema changes before confirming Drizzle's prompt. Do not use `push-force` as a routine setup step. The current API health route and Svelte demo do not require `DATABASE_URL`; the Drizzle config and database package do.

### Build, type-check, lint, tests, and code generation

Available workspace commands include:

```sh
pnpm --filter @workspace/ecosphere-23 run typecheck
pnpm --filter @workspace/ecosphere-23 run build
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
```

The root `build` runs the workspace type-check first, then builds packages that define a build script. The API `dev` script also builds its bundle before starting it. No lint or test scripts are currently defined in the root or the active app/API package manifests; do not treat a type-check or build as a test suite. API-spec code generation rewrites generated API client/Zod output and then type-checks library projects.

### Environment variables and local ports

| Variable | Used by | Requirement / current behavior |
|---|---|---|
| `PORT` | Svelte Vite config and API entry point | Required by both; use 5173 for the frontend and 5000 for the API in the commands above. |
| `BASE_PATH` | Svelte Vite config | Required by the frontend; use `/` for local root hosting. |
| `VITE_NODE_RED_WS_URL` | Browser telemetry startup | Optional WebSocket URL for an independently provided browser-compatible bridge. Leave empty for demo data. This repository does not provide that bridge. |
| `DATABASE_URL` | Drizzle database package/config | Required for `db push` or code that opens the PostgreSQL pool; not required by the current API health route or frontend demo. |

Ports 5173 and 5000 are application ports in the commands above. A local PostgreSQL server normally listens on 5432; this repository has no Compose file or database provisioning script. Mosquitto and Node-RED default ports are discussed below, but are external services and are not configured by this workspace.

### Mosquitto and Node-RED (optional, external)

There is no Mosquitto configuration, Node-RED flow export, Compose service, or repository script for either service. If the executables are installed and use their default local configuration, start each in its own terminal:

```sh
mosquitto -v
```

The usual local MQTT listener is `127.0.0.1:1883`. In another terminal, subscribe to the intended energy topic namespace:

```sh
mosquitto_sub -h 127.0.0.1 -p 1883 -t 'ecosphere/v2.3/telemetry/energy/#' -v
```

This verifies that the broker is reachable and displays messages only if something publishes them. With no flow export in the repository, it does not establish that the listed topics are actually emitted by a configured Node-RED flow.

Start Node-RED with its installed CLI:

```sh
node-red
```

The usual editor URL is <http://localhost:1880>. Import or create the required flows in that editor; none are supplied here. The existing files do not establish a repeating Inject cadence. To make a demo publish periodically, configure a repeat interval on the relevant Inject node in the editor; disable the repeat option or disable the Inject node to stop that cadence. Suggested intervals in the design notes are not an implemented setting.

Press **Ctrl+C** in each foreground terminal to stop Mosquitto or Node-RED. If these tools are managed as operating-system services instead, use that machine's service manager; service names and permissions are not defined by this repository.

### Telemetry topics and payload status

The topic patterns and examples in the design section below are the **intended contract recorded in this README**, not verified live flow configuration: no Node-RED JSON flow, Mosquitto config, publisher, or subscriber is present in the repository. The contract describes room HVAC, lighting, and socket topics; a floor-level DBR rack topic; and camera/AP attribution topics. Reconcile actual Node-RED publishers/subscribers against those paths before treating them as canonical. The README's suggested QoS/retain values and simulation timings are likewise not verified against a current flow.

The browser-side demo provider generates an object shaped like this (with changing timestamps and values):

```json
{
  "schema_version": "2.3",
  "telemetry_type": "power",
  "organization_id": "BU",
  "site_id": "BU_MAIN_CAMPUS",
  "building_id": "SWANENG",
  "floor_id": "S1",
  "room_id": "S1_02",
  "device_id": "HVAC_S1_02",
  "source_type": "HVAC",
  "measurement_boundary": "system",
  "timestamp": "ISO-8601 timestamp",
  "measurements": { "active_power_w": 1148.7 },
  "state": { "status": "ON", "system": "HVAC" },
  "quality": "good",
  "data_origin": "simulated"
}
```

That is the frontend's locally generated demo envelope, not evidence that a Node-RED/MQTT producer publishes it. The browser telemetry client can open a WebSocket URL and parse JSON telemetry, but the API server has no WebSocket/SSE route and no MQTT bridge. `VITE_NODE_RED_WS_URL` (or the WebSocket URL saved in browser settings) only points the client at an external bridge; it does not turn the Mosquitto TCP listener into a browser transport. Consequently there is no in-repository end-to-end MQTT-to-Svelte test yet. Publishing an event with `mosquitto_pub` can test broker delivery to an MQTT subscriber, but cannot verify that the UI receives it.

The connection badge and measurement provenance are different facts:

- `DEMO` means the browser is generating local reference telemetry, explicitly marked `data_origin: "simulated"`.
- `LIVE` means the browser WebSocket is open; it does not prove that readings are physical or measured.
- `OFFLINE` means that configured WebSocket endpoint could not be reached or closed.
- `data_origin` on an individual reading records provenance such as `simulated`, `measured`, `calculated`, `inferred`, or `reported`. Inspect it separately from the connection badge.

### Implemented behavior and validation caveats

- The Svelte UI starts local simulated readings when no WebSocket URL is configured. With a URL configured, the browser expects JSON telemetry from an external WebSocket bridge and retries failed connections.
- Room, device, and alert state is held in browser memory. The power chart keeps a short rolling buffer (up to 120 seconds / 300 points); there is no telemetry persistence or historical database query in the current UI.
- The current room snapshot is for `S1_02`. The displayed room direct load is HVAC + lighting + socket; ICT attribution and the shared DBR rack are kept outside that room total.
- Site/floor parent totals are not calculated from child rooms. Floor aggregation is a design rule, not a validated implementation.
- The three BU energy sources remain unmodelled; their IDs, types, capacities, and contribution are not available in this implementation.
- The previously reported `store_invalid_shape` error named `rack` and was traced to the Sites page's `$rack` template reference even though `rack` is a `$derived` value, not a store. That source reference was changed to `rack`; this repository session has not completed a browser runtime check, so do not treat the runtime fix as independently verified.
- A previous full workspace type-check reported Vite plugin type incompatibilities in `artifacts/mockup-sandbox/vite.config.ts`. That config has since been simplified, but the full type-check has not been rerun here.
- Build/type-check commands were attempted in the current environment, but command execution was blocked by the host sandbox's missing `slirp4netns` support. Re-run the commands above in a normal local terminal and record their actual results.

## 1. Product vision

Ecosphere is intended to answer these questions:

1. How much power is being used or generated now?
2. Where is energy being used?
3. Which systems and devices account for the consumption?
4. How has consumption changed over time?
5. Is a reading current,stale,missing or anomalous?
6. What does the measured or estimated usage cost?
7. What is its emissions impact?
8. What deserves attention and what action should follow?

The core product is energy monitoring and management. Analytics,benchmarking,alerts,cost management,sustainability reporting,forecasting and optimization are capabilities built on top of a dependable energy data foundation.

Ecosphere is **not** intended to become a Node-RED interface. Node-RED is currently a simulation,telemetry and orchestration tool behind the prototype. The user facing product should explain the energy system,not expose development wires,Inject nodes or Debug output as its main experience.

## 2. Product scope and principles

### Core capabilities

- Hierarchical energy monitoring from organization and site down to building,floor,room,system and device.
- Current electrical measurements and changing telemetry.
- Historical trends and short rolling live charts.
- System level consumption breakdowns such as HVAC,lighting,sockets and ICT.
- Data quality,device health and telemetry freshness.
- A foundation for comparisons,baselines,energy costs,emissions,alerts and reports.
- A configurable model for energy sources and meters.
- Integration of different telemetry producers without requiring every producer to use identical field names.

### Design principles

- **Energy first:** energy use and operational performance are the core,not carbon accounting alone.
- **Location aware:** telemetry belongs to a known place and system where possible.
- **Measurement boundaries matter:** never double count electrical loads because they appear at multiple levels.
- **Honest data state:** missing values must not be presented as real zero readings.
- **Provenance is visible:** simulated,measured,calculated,inferred and reported data must remain distinguishable.
- **Integration neutral:** MQTT and Node-RED are current prototype technologies,not permanent assumptions that must shape every screen.
- **Progressive delivery:** first prove working telemetry and room monitoring,then expand into advanced analysis and automation.

## 3. Current prototype environment

The current validation environment is Botho University (BU),using the SWANENG building and first floor as a campus model.

```text
Organization: BU
Site:         BU_MAIN_CAMPUS
Building:     SWANENG
Floor:        S1
Rooms:        S1_01 through S1_13
Demo room:    S1_02
```

The current S1_02 scenario represents a lecture room with approximately 35 occupants. The modeled room systems include HVAC,lighting and a wall socket serving a projector. ICT infrastructure includes a floor distribution rack,PoE cameras and access points.

The location hierarchy is a prototype data model,not a hardcoded product limit. Future sites,buildings,floors,rooms and energy sources should be configurable rather than requiring changes to page components.

## 4. Technology and repository overview

The repository is a pnpm workspace/monorepo for Ecosphere 2.3. The local commands and environment variables above reflect the current package scripts and application configuration.

Known repository areas include:

```text
artifacts/
  ecosphere-23/       Svelte frontend application
  api-server/         TypeScript API server
  mockup-sandbox/     Separate UI/mockup workspace; may contain React code

lib/
  api-spec/           OpenAPI specification and generation configuration
  api-zod/            Zod validation and generated API types
  api-client-react/   Legacy React-oriented generated API client to review
  db/                 Database package and Drizzle schema

scripts/              Workspace scripts
package.json          Root workspace package manifest
pnpm-workspace.yaml   Workspace definition
pnpm-lock.yaml        Dependency lockfile
```

The production Ecosphere frontend is **Svelte 5 + TypeScript + Vite** and mounts through `artifacts/ecosphere-23/src/main.ts`. `artifacts/mockup-sandbox` is a separate React mockup and is not imported by the production frontend.

The workspace also contains an Express 5 API server, a PostgreSQL/Drizzle schema package, and Zod/OpenAPI packages. The current API entry point mounts only `/api/healthz`; it does not currently persist telemetry or expose a browser telemetry stream. The database package is not required to run the frontend demo or API health route.

### Current frontend components

The Svelte application scaffold includes files such as:

```text
artifacts/ecosphere-23/src/
  app/
    App.svelte
    routes.ts
  components/charts/
    PowerChart.svelte
  features/
    dashboard/Dashboard.svelte
    sites/Sites.svelte
    live-energy/LiveEnergy.svelte
    rooms/RoomDetails.svelte
    analytics/Analytics.svelte
    alerts/Alerts.svelte
    secondary/SecondaryModules.svelte
    settings/Settings.svelte
  services/telemetry/
    telemetryNormalizer.ts
    telemetryProvider.ts
  stores/
    alerts.ts
    devices.ts
    energySources.ts
    hierarchy.ts
    telemetry.ts
  types/
    alerts.ts
    energy.ts
    hierarchy.ts
    telemetry.ts
  main.ts
  index.css
```

Treat this as the current observed scaffold; confirm paths against the working tree if the repository is reorganized. The existence of a component does not by itself prove that the page is fully implemented or that the real data connection works.

**Validation caveat:** a prior browser error reported `store_invalid_shape` for `rack`. The issue was the `$rack` reference in the Sites page template, not a store in `App.svelte`; it has been changed to reference the `$derived` value directly. The browser runtime was not available for a post-fix verification in this session. Run the frontend and visit Sites before describing this as runtime-verified.

## 5. Main application experiences

The MVP should prioritize these experiences:

### Dashboard

A high level view of the selected organization/site. It should surface current power,today's energy,peak demand where available,consumption by system,location breakdown,telemetry health and items requiring attention.

### Sites

A navigable physical hierarchy from site to building,floor and room. Selecting a location should open a view scoped to that location instead of requiring users to search a flat list of meters.

### Live Energy

A technical view of incoming telemetry. It should display location,device/system,latest power and energy values,device state,quality,data origin and last update time. Filters should support site,building,floor,room,system and device.

### Room Details

This is the most important current prototype view. Use `SWANENG / S1 / S1_02` as the principal demonstration. Show HVAC,lighting,socket/projector and ICT attribution separately. Show the direct room load as HVAC + lighting + socket under the current measurement model. Display a timestamp and data quality for each component and for the overall room.

### Analytics

Start with current power trends and a short rolling live history. Build toward daily,weekly and monthly profiles,peak demand,system breakdowns,baseline comparisons and building/room comparisons once persistent historical data is available.

### Alerts

Provide the information architecture for telemetry loss,device offline conditions,power thresholds,unexpected consumption and demand events. Do not pretend that advanced anomaly detection exists until it has been implemented and validated.

### Future modules

Energy Sources,Meters and Devices,Sustainability,Costs,Reports and Data Sources should fit the application architecture. They may be introduced incrementally. The three BU energy sources have not yet been modelled,so their identifiers,types,capacities and behaviour must not be invented or hardcoded.

## 6. Domain hierarchy

The intended general hierarchy is:

```text
Organization
  └── Site
      └── Building
          └── Floor
              └── Room / Zone
                  └── System / Circuit
                      └── Device / Meter
                          └── Telemetry readings
```

Energy sources and shared infrastructure can attach at the level that represents their actual electrical boundary. For example,a distribution rack is a floor-level shared load rather than a room's direct load.

Identifiers such as `BU_MAIN_CAMPUS`, `SWANENG`, `S1` and `S1_02` are example IDs. UI labels should be human readable while stable IDs remain available for telemetry joins and navigation.

## 7. Room and ICT measurement boundaries

The current room direct-load rule is:

```text
Room direct power = HVAC power + lighting power + socket power
Room direct energy = HVAC energy + lighting energy + socket energy
```

ICT rack input is modelled as a shared infrastructure load. The DBR rack's electrical input is the authoritative ICT measurement boundary for the current floor accounting model. Camera and access-point power are valuable for endpoint attribution and operational diagnostics,but must **not** be added to the rack total again when calculating total floor usage.

The intended floor calculation is:

```text
Floor power = sum of room direct power + DBR rack input power
Floor energy = sum of room direct energy + DBR rack input energy
```

This is the intended accounting rule,not a claim that the current Floor aggregation flow is finished. Floor aggregation is currently under development and has been paused while the frontend is built. Do not rely on its output as validated until the flow has been debugged and tested.

For S1_02,previous simulations have produced values around:

- HVAC: 1,148.7 W
- Lighting: 288 W,represented as 8 panels × 36 W
- Socket/projector: 280 W
- Camera attribution: 3.7 W

The HVAC,lighting and socket figures sum to about 1,716.7 W of direct room load. These are known simulated examples from prior runs,not guaranteed live values or calibrated physical measurements. The DBR rack has previously produced a simulated input around 273.5 W,while an access point has produced around 18.18 W. Treat these as example readings only.

## 8. Telemetry fields and semantics

Telemetry producers do not all use identical field names. The normalization layer should support both forms where applicable:

| Measurement | Accepted field names |
|---|---|
| Active/real power | `active_power_w`, `real_power_w` |
| Accumulated energy | `active_energy_kwh`, `energy_kwh` |
| Voltage | `voltage_v` |
| Current | `current_a` |
| Apparent power | `apparent_power_va` |
| Power factor | `power_factor` |
| Frequency | `frequency_hz` |

Typical context fields include:

```text
schema_version
timestamp
telemetry_type
organization_id
site_id
building_id
floor_id
room_id / space_id
device_id / endpoint_id
measurement_boundary
measurements
state
quality
data_origin
```

These fields may be absent for some source types. The frontend normalizer should tolerate known schema variants without concealing invalid or incomplete data.

### Quality is not equipment state

`quality` describes the trustworthiness or validity of a reading. It is not an ON/OFF field. Device or circuit state belongs under `state` or a source-specific operational-state field.

Common quality values in the prototype include `good`, `partial`, `missing` and `unknown`. Preserve the original value where possible and define any mapping centrally.

### Data origin

The application must distinguish origins such as:

- `simulated`: generated by a model for a prototype or test.
- `measured`: read from physical equipment or a meter.
- `calculated`: derived from other measurements or a defined calculation.
- `inferred`: estimated from an inference rather than directly measured.
- `reported`: supplied as an external report or declared value.

Do not label simulated telemetry as a physical meter reading.

### Null is not zero

`null` means a usable measurement is not available. `0` means a known reading of zero. A missing,stale or offline measurement must not silently appear as `0 W`. The UI should display missing/stale status and the last-known timestamp when available.

## 9. Node-RED and MQTT architecture

Node-RED currently hosts the electrical circuit simulators and the aggregation flows under development. Mosquitto is the local MQTT broker. The local broker used in the development setup is `127.0.0.1:1883`.

The current conceptual path is:

```text
Circuit / ICT simulation
        ↓
Node-RED publisher Function
        ↓
MQTT publish
        ↓
Mosquitto broker
        ↓
Node-RED telemetry subscribers
        ↓
Normalize and update state
        ↓
Room snapshot
        ↓
Future frontend bridge
        ↓
Svelte Ecosphere UI
```

No Node-RED flow export, Mosquitto configuration, MQTT publisher/subscriber, or server-side MQTT bridge is included in this repository. The diagram is a target architecture, not a verified running path. A browser-compatible WebSocket client exists in the Svelte frontend, but no matching WebSocket/SSE server endpoint is implemented here. A browser must not use MQTT's native TCP port as if it were a browser WebSocket endpoint. A bridge and a verified message contract are still required for end-to-end telemetry.

### Current raw telemetry topic convention

The intended topic contract documented here uses this root; it has not been verified against a current Node-RED flow because no flow export is present in this repository:

```text
ecosphere/v2.3/telemetry/energy/
```

Canonical patterns are:

```text
ecosphere/v2.3/telemetry/energy/hvac/{organization}/{site}/{building}/{floor}/{room}/{device}
ecosphere/v2.3/telemetry/energy/lighting/{organization}/{site}/{building}/{floor}/{room}/{device}
ecosphere/v2.3/telemetry/energy/socket/{organization}/{site}/{building}/{floor}/{room}/{device}
ecosphere/v2.3/telemetry/energy/ict/{organization}/{site}/{building}/{floor}/{device}
ecosphere/v2.3/telemetry/energy/ict/{endpoint_type}/{organization}/{site}/{building}/{floor}/{zone_or_room}/{device}
```

Examples:

```text
ecosphere/v2.3/telemetry/energy/hvac/BU/BU_MAIN_CAMPUS/SWANENG/S1/S1_02/HVAC_S1_02
ecosphere/v2.3/telemetry/energy/lighting/BU/BU_MAIN_CAMPUS/SWANENG/S1/S1_02/LIGHTING_S1_02
ecosphere/v2.3/telemetry/energy/socket/BU/BU_MAIN_CAMPUS/SWANENG/S1/S1_02/NT_SOCKET_001
ecosphere/v2.3/telemetry/energy/ict/BU/BU_MAIN_CAMPUS/SWANENG/S1/DBR_SWANENG_S1
ecosphere/v2.3/telemetry/energy/ict/camera/BU/BU_MAIN_CAMPUS/SWANENG/S1/S1_02/CAM_S1_02
ecosphere/v2.3/telemetry/energy/ict/ap/BU/BU_MAIN_CAMPUS/SWANENG/S1/S1_CORRIDOR/AP_S1_02
```

The actual AP/camera inventory and endpoint paths should be verified against the latest Node-RED flow export when the integration is implemented. Topic structure is a contract: avoid changing it reactively in UI code.

### Aggregation topics

Room snapshots use the room topic family:

```text
ecosphere/v2.3/telemetry/energy/room/{organization}/{site}/{building}/{floor}/{room}
```

Internal normalization topics currently follow patterns such as:

```text
ecosphere/v2.3/room-normalized/{organization}/{site}/{building}/{floor}/{room}/{source_type}/{source_id}
ecosphere/v2.3/floor-normalized/{organization}/{site}/{building}/{floor}/{entity_type}/{entity_id}
```

The intended floor output family is:

```text
ecosphere/v2.3/floor/{organization}/{site}/{building}/{floor}
```

Internal normalized topics are implementation topics. The UI should normally consume a stable frontend contract or an API stream rather than hardcoding every internal processing topic.

### MQTT conventions

- Publishing Function nodes set `msg.topic`; MQTT Out nodes should use a compatible topic configuration rather than hardcoding an inconsistent second topic.
- MQTT topics are hierarchical strings. `#` can subscribe to descendants of a topic prefix; a broad subscriber must still filter telemetry types before updating state.
- QoS 1 and `retain: false` are design conventions from earlier prototype notes, not verified current Node-RED settings. Check the actual editor flow and broker configuration before relying on them.
- Do not use multiple overlapping MQTT subscriptions for the same processing path unless duplicate delivery is intentional and deduplicated.

## 10. Node-RED circuit and ICT models

The current source models include:

### HVAC

A room HVAC model supplies simulated operating state and electrical telemetry. The S1_02 example has used an ON state and a 24°C setpoint. Active power and cumulative energy are expected to change according to the simulated operating model.

### Lighting

The lighting model represents eight ceiling LED panels rated at 36 W each for the current S1_02 scenario. All eight operating gives 288 W. The model should keep circuit state separate from telemetry quality.

### Socket/projector

The socket scenario represents an outlet load associated with the room projector. A previous S1_02 example used 280 W while on. Its outgoing topic and location payload must include the canonical `socket` namespace and floor/room hierarchy.

### ICT / DBR

The ICT subflow models the distribution rack and PoE endpoints including cameras and access points. Rack-input power is the electrical boundary used in floor accounting. Endpoint values are attribution data when the rack total is included.

### Independent circuit simulation versus room aggregation

The circuit simulations have produced individual telemetry. Room aggregation combines current component telemetry to produce a room snapshot. The Room layer should merge updates so an incoming lighting message does not erase the previously received HVAC or socket state. It should publish only the room affected by the incoming component event,not emit all known rooms on every event.

The Floor aggregation flow is not currently considered complete; it has been paused while the Svelte frontend is developed. Do not change the Floor flow as part of routine frontend work unless explicitly asked to resume that engineering task.

## 11. Periodic simulation for a live-looking frontend

Manual Inject actions are useful for testing but do not create a continuously updating dashboard. The circuit models need periodic ticks for the UI to show changing values and a live chart.

No Node-RED flow export is present, so this repository cannot establish whether any Inject node repeats or what cadence it uses. Configure the repeat cadence in the Node-RED editor for a controlled demo; disable the Inject node's repeat option (or disable the node) to stop periodic simulation. The following values are suggestions, not current settings:

- S1_02 HVAC: about once per second.
- S1_02 lighting: about once per second.
- S1_02 socket/projector: about once per second.
- ICT rack and endpoint bundle: about every five seconds.

These are proposed demonstration intervals,not a statement that every Node-RED timer is already configured this way. Start with the selected demonstration room rather than enabling every circuit and endpoint at one second across the entire campus. The ICT bundle generates multiple endpoint messages per tick,so increasing its frequency multiplies traffic.

The simulation should update cumulative energy using elapsed time and power. For constant real power:

```text
energy increment (kWh) = power (W) / 1000 × elapsed time (hours)
```

A source's energy counter must remain cumulative according to its declared model and should not be reset on every publish. Avoid producing an arbitrary random power value on every tick unless that behaviour is explicitly part of the simulation.

## 12. Frontend telemetry integration plan

The Svelte frontend should not consume Node-RED Debug output. Debug is an editor diagnostic facility,not a production data interface.

The frontend should interact with a typed provider abstraction:

```text
TelemetryProvider
  ├── Demo provider
  └── Live provider
```

The live provider will connect to a browser compatible stream exposed by Node-RED or,preferably as the production architecture matures,through an API/backend bridge. Use environment configuration such as `VITE_ECOSPHERE_TELEMETRY_WS_URL` for a WebSocket endpoint if that is the chosen transport. Do not hardcode local endpoints throughout components.

The exact transport is **not yet confirmed as implemented**. Before calling the integration live,verify all of the following:

1. A real WebSocket or browser-compatible stream endpoint exists.
2. The browser can connect and reports connection state truthfully.
3. A published MQTT telemetry message reaches the bridge.
4. The bridge forwards a valid payload to the browser.
5. The frontend normalizes the message into the expected typed model.
6. The correct device and room stores update.
7. The relevant UI values and chart update without full page reloads.
8. A disconnect changes status to `OFFLINE` or reconnecting; it must not silently fall back to demo values while claiming `LIVE`.

Possible visible connection modes:

- `LIVE`: the configured stream is connected and fresh real-time messages are arriving. Source origin can still be `simulated` because Node-RED is simulating the equipment.
- `DEMO`: local fixture or generated demo state is in use.
- `OFFLINE`: no usable live stream is connected.

Do not conflate transport mode with measurement provenance. `LIVE` can describe a live connection carrying simulated readings; `data_origin: simulated` describes where those readings came from.

## 13. Frontend state and normalization

The browser should maintain typed state for at least:

- connection status and last-message time
- latest telemetry by source/device
- location hierarchy
- room component values
- device operational state and quality
- alert records
- energy source records
- short rolling chart series

A telemetry update should update the affected source/device/room rather than reconstructing the entire application state. `S1_02` HVAC updates should not cause unrelated rooms or device state to be reset.

The normalization service must accept the current spelling variants,normalize units and numeric values safely,and preserve timestamps,measurement boundaries,quality and data origin. It must tolerate absent optional values without silently converting missing data to zero.

Keep a bounded rolling window for real-time charts,for example the latest 120 seconds or a maximum of 300 points. Do not keep unbounded telemetry history in browser memory. Long range analytics needs a persistent storage and query path.

## 14. Data,history and API expectations

Current repo workspace areas indicate an API server,API specification/validation packages and a Drizzle/PostgreSQL package. The coding agent must inspect the actual endpoint definitions and database schema before documenting specific routes or claiming that the frontend persists telemetry.

A complete production design will need a clear role for:

- receiving and validating incoming telemetry
- storing the latest device state
- storing historical readings at a defined retention and resolution
- resolving organization/site/building/floor/room metadata
- aggregating consumption without double counting
- exposing current values and historical data through a frontend compatible API
- streaming live updates to the browser

Until those pieces are implemented and verified,live UI values may be in-memory prototype state and must be described accordingly.

## 15. Energy sources and sustainability

The platform should eventually support multiple sources of supply and generation without hardcoding the not-yet-modelled BU sources. A generic source record may include:

```text
source_id
source_name
source_type
location
rated_capacity
current_power
energy_today
status
quality
data_origin
```

The exact schema should be refined against actual source engineering data before use. Do not invent the BU source names,capacities or operating logic.

Sustainability is a connected product module. Ecosphere's previous carbon-calculation work can eventually inform Scope 1,Scope 2 and Scope 3 reporting,emissions intensity,source mix and emissions trends. Carbon calculations must identify emission factors,data periods and calculation assumptions; do not infer measured emissions from energy readings without a documented method.

Cost management can similarly be layered on later using validated tariffs,utility data and cost periods. Cost and carbon pages are planned product capabilities,not evidence that the current prototype already has validated tariff or emissions calculations.

## 16. Security and environment configuration

- Never commit real API keys,passwords,database credentials or private broker credentials.
- Document required environment variable names and provide safe example values only after verifying the code.
- Keep `.env` and `.env.*` files out of version control,except an explicitly safe `.env.example` template.
- A local `127.0.0.1` service address is only valid from the machine/process that owns that loopback interface. It will not automatically work from another device or a hosted browser.
- Do not expose Mosquitto or internal Node-RED editor endpoints publicly merely to make a demo UI connect.
- For deployment,provide a controlled authenticated API/WebSocket boundary and appropriate broker/network access controls.

## 17. Known current status

The following status is intentionally conservative and should be updated as work is tested.

| Area | Current status |
|---|---|
| Svelte 5 frontend scaffold | Present in the repository; runtime/build validation still required |
| Main product page components | Scaffolded; completeness and interactions must be tested |
| HVAC simulation | Individual simulated telemetry has been produced |
| Lighting simulation | Individual simulated telemetry has been produced |
| Socket/projector simulation | Individual simulated telemetry has been produced; canonical topic/hierarchy must be verified against the latest code |
| ICT / DBR simulation | Rack and endpoint telemetry have been produced |
| Mosquitto MQTT broker | Used locally at `127.0.0.1:1883` in the current development setup |
| Room aggregation | Implemented in prototype form and under validation; confirm all expected room components and correct single-room update behaviour |
| Floor aggregation | Under development and intentionally paused |
| Three BU power sources | Not yet modelled |
| Periodic Inject schedule | Proposed for the demo; verify actual Node-RED configuration |
| Node-RED-to-browser live bridge | Planned; do not claim operational until tested end to end |
| Persistent history and live UI data API | Must be verified; do not assume the current provider persists data |
| Production deployment and security | Not established by this prototype description |

## 18. Recommended development milestones

### Milestone 1: stabilize the Svelte application

Confirm one Svelte entry point,one root app component and Svelte-compatible dependencies. Fix the observed runtime error. Run build,type-check and any available tests. Keep React mockup code isolated from the production frontend.

### Milestone 2: reliable demo data and telemetry state

Use a controlled S1_02 demo provider to ensure the dashboard and room pages behave correctly even before live transport is connected. Display provenance clearly.

### Milestone 3: periodic Node-RED simulation

Configure periodic ticks for the selected HVAC,lighting and socket circuits and a slower ICT cadence. Check cumulative energy behaviour and message volume.

### Milestone 4: end-to-end browser stream

Implement and verify the transport bridge. Confirm a live MQTT message changes the intended Svelte store and the room view. Add connection-state and stale-data handling.

### Milestone 5: validate Room aggregation

Confirm that HVAC,lighting and socket telemetry for a room are merged rather than overwriting each other,that camera attribution stays separate,and that a single component event publishes only the affected room snapshot.

### Milestone 6: resume Floor aggregation

Only after the room contract is stable,return to the Floor state machine. Test Room snapshots,DBR rack input and ICT endpoint attribution independently. Verify floor calculations and confirm no duplicate subscriptions or message multiplication.

### Milestone 7: persistence and analysis

Establish a validated backend ingestion/history model before presenting long-range history,benchmarks,forecasts,costs or emissions as production results.

## 19. Definition of a working prototype demonstration

A minimum credible demonstration is:

1. The Svelte app launches without a runtime error.
2. The user can navigate to `SWANENG / S1 / S1_02`.
3. The page clearly distinguishes HVAC,lighting,socket and ICT attribution.
4. The data source is labelled as simulated where appropriate.
5. Starting the Node-RED periodic simulator changes source readings over time.
6. A verified live transport delivers those messages to the browser.
7. The intended UI values and chart update without a page reload.
8. Missing,stale or disconnected telemetry is represented honestly.
9. The room total follows the defined measurement boundaries.
10. Floor results are not presented as validated until the Floor aggregation flow has passed separate tests.

## 20. Operational instructions

**This section must be completed by Codex after inspecting the actual repository.** Do not infer commands or ports from filenames.

The completed operational guide must document:

- supported Node.js and pnpm versions
- installation commands
- root and per-workspace development commands
- how to start the API server and Svelte frontend
- expected ports and how to override them
- required environment variables and safe `.env.example` setup
- database creation,migration and seed commands if applicable
- how to run build,type checks,linting and tests
- how to troubleshoot common Svelte/Vite/API/database errors
- how to start Mosquitto and Node-RED in the local environment
- how to enable periodic circuit simulation
- how to verify the MQTT topic and payload for HVAC,lighting,socket and ICT
- how to configure and verify the frontend stream bridge
- how to distinguish demo mode from live transport and simulated data from physical measurement
- how to stop all local services cleanly

No command should be included as an established procedure unless it has been checked against current scripts,configuration or successful execution.

## 21. Product direction

Ecosphere 2.3 should mature in this order:

```text
Reliable source telemetry
        ↓
Consistent telemetry contract
        ↓
Room aggregation
        ↓
Building/floor/site aggregation
        ↓
Reliable storage and history
        ↓
Live monitoring interface
        ↓
Trends and comparisons
        ↓
Alerts and operational insights
        ↓
Costs and sustainability
        ↓
Forecasting and optimization
```

The immediate goal is to make the source-to-room-to-frontend data path work transparently. The bigger business goal is to provide an extensible energy management platform across buildings,campuses and eventually other infrastructure,without depending on a single hardware project or a single telemetry vendor.
