# Universal Video Production Kit

The reusable production contract now lives in TRIPPEDD Production Studios:

- `docs/UNIVERSAL_ENTRANCE_VIDEO_KIT.md`
- `docs/UNIVERSAL_VIDEO_PRODUCTION_KIT.md`
- `docs/UNIVERSAL_VIDEO_PRODUCTION_MANIFEST.schema.json`

Official shared source:
https://github.com/mhvnsnt/TRIPPEDD-Production-studios-/tree/main/docs

## Bannon adapter

Bannon is the reference implementation. Its verified entrance system supplies:
- sequential character entrances
- per-character titantron/mini-tron
- arena/dark/spot/strobe/colour lighting
- smoke and pyro modes
- saved entrance timelines
- animated trons
- real arena FX
- custom tron media persisted through the existing IndexedDB library
- broadcast camera phase cues

Historical implementation commits:
- 7cf8bafd48741a95cf56b36871b349932311e57e
- 521fb9503afc88b14d1bcd84ae0dc5e90edf10bc
- 5b9ccad590cb377e083c1d83e17a57a6a50f058a
- 9e15a70abb15b6ee49b24fa5141371527c07e263

The shared kit is a production contract, not a request to make other games visually identical to Bannon. Each game keeps its own arena, UI, lighting, character assets, gameplay and canon.

Do not certify a generated or relabeled clip as gameplay. Runtime evidence remains mandatory.
