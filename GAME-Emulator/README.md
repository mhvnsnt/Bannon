# GAME: Emulator

A local-first game lab for files you are authorized to use. Import files you already possess, catalog them, inspect supported metadata, and compose compatible mods through reversible profiles. This is an initial scaffold, not an emulator core.

## First architecture

```text
User-selected local file -> provenance sidecar -> watchdog intake -> SHA-256 manifest
   -> quarantine/review -> explicit adapter selection -> mod profile -> compatible core
```

The intake pipeline does not download games, bypass anti-bot controls or DRM, unpack arbitrary archives, execute imported binaries, or automatically convert commercial decompilation output into replacement engine code.

## Open-source components under consideration

- [watchdog](https://github.com/gorakhargosh/watchdog): detect local files copied into the inbox.
- [Playwright Python](https://github.com/microsoft/playwright-python): test the local web interface.
- [browser-use](https://github.com/browser-use/browser-use): optional UI exploration of sites you control; not an anti-bot or protected-download bypass.
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) and [radare2](https://github.com/radareorg/radare2): optional, separately invoked analysis for material and purposes you are authorized to analyze.
- [AssetStudio](https://github.com/Perfare/AssetStudio): optional Unity asset inspection where supported and authorized.

LangChain is deferred until a deterministic, auditable job runner exists.

## Quick start

Python 3.11+:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m game_emulator.watcher --once
pytest
```

Put an authorized local file in `imports/inbox/` and create a sidecar named `<filename>.provenance.json`. See `imports/README.md`. The initial version only records metadata and a SHA-256 hash.

## Roadmap

1. Provenance-gated intake and tests.
2. Local library UI and import queue.
3. Isolated adapter interface with declared formats and resource limits.
4. Reversible mod profiles, load order, conflict detection, rollback.
5. Integration with compatible, appropriately licensed emulator cores.
6. Optional, explicit analysis adapters with audit logs and sandboxing.

No game images, BIOS files, ROMs, APKs, or proprietary assets are included. Current status: scaffold only; it does not yet emulate games or mix runtime assets.