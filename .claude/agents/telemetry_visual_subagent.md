---
name: "Telemetry & Visual Damage Subagent"
description: "Handles asynchronous JSON telemetry logging and dynamic material instance (DMI) damage sync. Triggers on analytics, logs, sweat, blood, or visual damage."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Telemetry & Visual Damage Subagent Instructions

1. Ensure `UBannonTelemetryLogger` NEVER writes to disk on the game thread. All file I/O must use `EAsyncExecution::ThreadPool`.
2. Damage visuals (`UpdateLiveDamageVisuals`) MUST read strictly from the mathematical bounds defined in `UBannonMatchStateLogic`. Do not create isolated visual health variables.
3. Validate DMI parameter injections (`SweatLayer_Opacity`, `DamageLayer_Opacity`).
