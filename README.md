# BANNON

A wrestling game inspired by the "Off The Top Rope" book series, drawing on
MDickie's wrestling sim games, WWE games, and Steve Masson's Neckbreaker /
Visceral Pro Wrestling active ragdoll physics work.

## What this is

BANNON is a single-file, browser-based 3D wrestling engine built with Three.js
(`index.html` / `BANNON_v150.html`), currently packaged as an Android app via a
Kotlin WebView wrapper (`com.bannon.game`). Development is active and ongoing.

## Status

BANNON is being built natively in Unreal Engine 5 (C++), under `unreal/`.
This is the primary, actively developed version of the game, targeting a
real installable mobile app (Android/iOS).

The original Three.js/HTML build (`index.html` / `BANNON_v150.html`) is kept
as a legacy/retro mode — a nostalgia arena and model option inside the game,
not the main experience.

## License

All rights reserved. See LICENSE.md. This repository is public for
development/reference purposes only — no license to use, copy, modify, or
distribute any part of it is granted.

## Repository housekeeping note

This repo previously had a COPYING.txt (GPL-3.0) file and README content
belonging to an unrelated third-party project (a Unity ML-Agents grid-sensor
tool) that was accidentally included via a dropped-in archive. That content
has been removed — it was never integrated into BANNON and does not apply to
this project.