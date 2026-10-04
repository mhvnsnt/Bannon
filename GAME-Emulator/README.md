# GAME: Emulator

A local-first intake and library manager for game files you are authorized to use. It imports from folders you choose, fingerprints files, detects duplicate bytes, classifies systems where evidence is sufficient, stores immutable copies in a content-addressed library, and tracks them in SQLite. A loopback-only dashboard provides a no-code import form.

**Current scope:** working local import/catalog pipeline and dashboard scaffold. This is not yet an emulator frontend and does not yet launch games or merge runtime game assets/mods.

## Quick start

Python 3.11+ is required. From this directory:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -e ".[dev]"
pytest
ruff check src tests
```

### Option A: local dashboard

```bash
game-emulator-ui
```

Open http://127.0.0.1:8765 on the same computer. Enter the folder containing your files, choose a library folder, and provide a short rights-basis declaration once per import batch. The tool scans subfolders automatically, copies supported files, hashes them, classifies them, and deduplicates identical bytes. It does not upload your games to GitHub or another server.

### Option B: command line

For hands-off intake from a folder you keep copying files into, run the initial scan and then leave the watcher running:

```bash
game-emulator-watch-folder --source "/path/to/game-files" --library "$HOME/GAME-Emulator-Library" --rights-basis "personal dumps and homebrew I am authorized to use"
```

It imports existing files at startup and watches nested folders for newly created/changed files. Keep the terminal/process running; stopping it stops automatic watching. Large files should be fully copied before import settles.


```bash
game-emulator import --source "/path/to/game-files" --library "$HOME/GAME-Emulator-Library" --rights-basis "personal dumps and homebrew I am authorized to use"
game-emulator list --library "$HOME/GAME-Emulator-Library"
```

You choose the source and destination once per batch. Nested folders are scanned automatically. Original source files are not changed or deleted.

## Supported file families

The catalog recognizes common formats for Nintendo Game Boy/Color/Advance, NES/Famicom Disk System, SNES, Nintendo 64, DS, 3DS, GameCube, Wii, Wii U and Switch; Sony PlayStation, PS2, PS3, PSP and Vita-related disc/package formats; original Xbox and Xbox 360 formats; plus several generic disc-image and legacy-console formats.

**A file extension is not proof of compatibility.** `.iso`, `.bin`, `.pkg`, `.elf`, and other shared formats are intentionally labeled ambiguous unless the parent folder clearly identifies a system (for example, `PS2/mygame.iso`). Unsupported or ambiguous content is cataloged conservatively; no format is unpacked or executed.

## What the pipeline does

1. Recursively scan the user-selected local source folder.
2. Reject symlinks, empty/unsupported files, oversized files, and files changing during hashing.
3. Calculate SHA-256 and verify the stored copy matches.
4. Infer a system from a known extension and/or a clear parent-folder label.
5. Store under `library/files/<system>/<hash-prefix>/<sha256>.<ext>` and index metadata in `library.sqlite3`.
6. Deduplicate identical content by SHA-256 without deleting or modifying source files.
7. Display the catalog in the local dashboard or CLI.

The app binds to loopback only (`127.0.0.1`) by default and refuses a non-loopback host. It does not expose a file browser, accept uploads over the network, or serve ROM bytes.

## Automatic collection and storage

This version automatically collects from folders you point it at, including nested folders, and stores copies in your chosen library. It does **not** autonomously crawl piracy sites, bypass DRM/anti-bot controls, fetch BIOS/keys, or download games based only on a title. Cloud sync, removable-drive discovery, scheduled background watching, metadata enrichment, and AI-assisted matching are follow-up integrations—not claimed as implemented.

AI can later help identify ambiguous titles and recommend compatible tools, with uncertain results kept for review. It must not silently guess a system or rights status.

## Runtime and mod mixing roadmap

An explicit RetroArch launch handoff is included for a cataloged file: install RetroArch and a compatible libretro core yourself, then use `game-emulator-launch --library "$HOME/GAME-Emulator-Library" --sha256 <hash> --core /path/to/installed_core.so --dry-run` to validate the command before removing `--dry-run`. The tool verifies the library hash and refuses ambiguous disc images unless you pass `--system` to confirm the target console. It uses an argument list without a shell. This is a launch adapter, not a bundled emulator: actual compatibility depends on the installed frontend/core, OS, hardware, and any firmware the emulator legitimately requires.

A universal runtime asset mixer is not assumed possible across unrelated console formats; reversible mod profiles must be system/game/format-specific. The profile/conflict/rollback layer is still follow-up work.

## Safety and rights

- Import only files you are authorized to use.
- No automatic internet downloads, DRM bypass, archive extraction, binary execution, or decompilation-to-replacement-code pipeline.
- BIOS, keys, firmware and other required files are not included.
- Keep the library on storage you control and back it up yourself.
- Use the optional analysis tools only for authorized material, with explicit invocation and audit logs.

## Development

CI runs Ruff and pytest on pushes/PRs that touch `GAME-Emulator/`. Tests use synthetic fixtures only; no commercial game data is stored in this repository.
