# Asset rename plan — WWE-identified filenames (owner directive, 2026-10-05)

## Goal
Remove all WWE/trademark identifiers from the repo's asset tree. These files
are the owner's own creations/mods that were saved under WWE-style filenames.
They are being reskinned into original Off The Top Rope canon characters.

## Rule: do NOT rename in place
Renaming the binaries mid-reskin would break the active reskin work. Instead:

1. Reskin each model into its new canon identity (Repo Co Dev track).
2. Export/save the reskinned model under its NEW owner-approved canon name.
3. Owner approves before/after + new names (already the agreed flow).
4. Delete the old WWE-named file only AFTER its reskinned replacement lands.
5. Update the 2 reference files listed below at the same time.

## Files to replace (all under `models/Models tripo3d/`)

| Current filename | Notes |
|---|---|
| `wwe_goldberg_2k22.glb` | Reskin → canon character (TBD by owner) |
| `wwe_brock_lesnar_2k22.glb` | Reskin → canon character (TBD by owner) |
| `wwe-rhea_ripley_2k22.glb` | Reskin → canon character (TBD by owner) |
| `wwe_damian_priest_2k22.glb` | Reskin → canon character (TBD by owner) |
| `wwe_michael_cole_2k22.glb` | Reskin → canon character (TBD by owner) |
| `wwe2k22_announcer_desk.glb` | Being rebuilt from scratch with original branding — replaced, not reskinned |
| `wwe_wrestling_ring.glb` | Reskin/rebuild → neutral ring |

Do NOT invent canon names. The owner assigns each model to a canon character
(e.g. an Andrade-style build filling in for a canon character with no GLB yet)
and approves the new name before anything ships.

## Reference files to update when old files are deleted
- `tools/drive_sync/manifest.json` (mentions `wwe2k22_announcer_desk`, `wwe_wrestling_ring`)
- `assets/reference/env_snapshots/README.md` (mentions `wwe2k22_announcer_desk`)

Verified 2026-10-05: no code loads these filenames directly (only the two
references above), so deletion after replacement is safe.

## Paid-release note
Any mesh that was ripped straight from a WWE game (rather than modeled/modded)
needs a full remodel — not just a reskin — before any paid release. Flagged
models stay out of paid builds until remodeled.
