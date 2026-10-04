# Local import

The library importer accepts a **folder you select** and recursively scans its subfolders. You do not need to create a provenance JSON sidecar for every file; the CLI/dashboard records a rights-basis statement for the import batch.

Recommended source layout (folder names help classify ambiguous disc formats):

```text
my-game-dumps/
  GBA/
    example.gba
  GameCube/
    example.iso
  PS2/
    example.iso
  PS3/
    example.iso
  Switch/
    example.xci
```

The app hashes and copies recognized files into your chosen library. It never modifies or removes originals, downloads files, extracts archives, or launches game binaries. Identical bytes are deduplicated by SHA-256. The extension allowlist is documented in `src/game_emulator/library.py`.

The older low-level watcher command in this scaffold is a provenance-sidecar cataloging utility; for the end-to-end copy/store workflow use `game-emulator import` or `game-emulator-ui`.
