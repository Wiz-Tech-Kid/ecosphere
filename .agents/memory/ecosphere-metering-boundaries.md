---
name: Ecosphere metering boundaries
description: Product rules for separating room circuit readings from shared ICT readings.
---

For Ecosphere, direct room power covers the room's HVAC, lighting, and socket circuits. Camera and access-point readings are endpoint attribution, not additional room loads. The floor-level DBR rack is the authoritative shared ICT electrical boundary and must not be added again to room direct power.

**Why:** The user specified this accounting boundary to prevent double-counting shared ICT consumption.

**How to apply:** Prefer reported room aggregates; when presenting component readings, keep ICT attribution and the DBR rack separate from direct room load.
