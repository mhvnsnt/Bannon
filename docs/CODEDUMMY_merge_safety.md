# CODEDUMMY merge safety — how to stop merges clobbering newer work

## What went wrong
CODEDUMMY (and the `master`/CODEDUMMY-side repo) carried its own **older copy** of
`BANNON_v150.html`. When those branches were merged forward, git took the whole
older file (a fast-path "take theirs" on a file that had diverged from a stale
base), silently dropping ~2,400 lines of newer systems (multi-man match engine,
menu multi-slots, ring-post contact, stun mash-out). The other repo's actual new
work was in *other* files (Firebase/Supabase/daemon) — the HTML reversion was pure
collateral damage.

## The rule: ONE source of truth for the game file
`BANNON_v150.html` must have a **single owning line of history** (this BANNON repo /
the `claude/*` branch). CODEDUMMY should treat it as read-mostly:
- CODEDUMMY may READ it, run it, analyze it.
- If CODEDUMMY must EDIT it, it must first `git fetch` + `rebase` onto the latest
  BANNON tip, edit on top, and never merge an older baseline *forward*.
- Never let a second repo keep a divergent long-lived copy of this file.

## Merge mechanics (in CODEDUMMY's git layer)
1. **Never wholesale-replace a file on merge.** Use a real 3-way merge
   (`git merge` with the true common ancestor, or `git merge-file`/diff3), never
   `git checkout --theirs <file>` or a file-copy sync.
2. **Pull-before-merge, then rebase**, so the merge base is current — a stale base
   is what makes git think the whole older file is "the change."
3. **Run the integrity guard as a merge/push gate** (below). If it fails, block.

## The automated guard (already in this repo)
- `scripts/verify_integrity.cjs` — asserts a minimum line count + that every shipped
  system's sentinel string is still present. Exit 1 on any miss. **Add a sentinel
  the moment you ship a system.**
- `.github/workflows/integrity.yml` — runs it on every push/PR; a clobbering merge
  fails CI instead of shipping.
- Wire it into CODEDUMMY too: run `node scripts/verify_integrity.cjs` as a
  pre-commit / pre-push hook. If it exits non-zero, refuse the commit and surface
  which system was dropped.

## Recovery when it does happen
`git checkout <last-good-commit> -- BANNON_v150.html`  (the last-good is a strict
superset), then re-apply only the intentional edits on top. That is exactly how the
v155 reversion was recovered.
