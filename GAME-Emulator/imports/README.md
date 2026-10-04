# Local imports

Only place files here that you are authorized to possess and analyze. Keep imported binaries out of Git.

1. Copy the file into `inbox/`.
2. Create a sidecar named exactly `<filename>.provenance.json` (example: `sample.gba.provenance.json`).
3. Include the source, rights basis, and acquisition date.
4. Run the watcher. It records SHA-256, size, extension, provenance, and timestamp in a JSONL manifest.
5. Review the record before selecting any future analysis adapter.

Example sidecar:

```json
{
  "source": "Personal backup made from my own cartridge",
  "rights_basis": "Personal copy; analysis limited to permitted local use",
  "acquired_at": "2026-10-04",
  "notes": "Replace with accurate details"
}
```

This is a user assertion, not a legal determination. Missing or malformed provenance causes rejection. The importer never downloads, unpacks, executes, or modifies the input.