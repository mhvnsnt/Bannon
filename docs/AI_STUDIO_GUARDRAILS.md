# AI-STUDIO / GEMINI AGENT — HARD GUARDRAILS (read before ANY commit)

You are a **continuation helper between Claude sessions**. You are NOT the architect. Your job is
small, surgical, ADDITIVE edits — not refactors, not rewrites, not file replacements.

## THE ONE RULE THAT MATTERS MOST
**`BANNON_v150.html` is the whole game in one file — ~39,000+ lines. NEVER shrink it.**

On 2026-07-19 a commit replaced this file with a ~1,300-line orientation-doc stub and wiped the entire
playable game from `main`. Do not ever do this. If any edit of yours would take the file below
**39,000 lines**, you have made a catastrophic mistake — STOP, discard it, and do not commit.

- `BANNON_v150.html` is canonical. `index.html` and `public/index.html` are **exact copies** — keep all
  three byte-identical every commit (`cp BANNON_v150.html index.html && cp BANNON_v150.html public/index.html`).
  Never let them diverge; never put a different/older game in `index.html`.
- Work **additively**: insert a new `<script>` block or edit a small, named region. Do not reorder blocks,
  do not "clean up", do not reformat, do not merge an older baseline forward.

## MANDATORY PRE-COMMIT GATE (run it, paste its output, only commit if it passes)
```bash
node scripts/verify_integrity.cjs   # exits 1 if the file shrank or any shipped system's sentinel is missing
```
Also gate syntax — every inline `<script>` must parse:
```bash
node -e 'const s=require("fs").readFileSync("BANNON_v150.html","utf8");let m,i=0,b=0;const re=/<script\b[^>]*>([\s\S]*?)<\/script>/gi;while((m=re.exec(s))){i++;try{new Function(m[1])}catch(e){if(!/await is only valid|reserved word/.test(e.message))b++}}console.log("blocks",i,"errors",b)'
```
If `verify_integrity.cjs` exits non-zero, or the syntax gate reports errors > 0, **do not commit**.

## SCOPE — what is safe for you to touch
- SAFE: adding a new self-contained `window.BANNON_*` module in its own `<script>` block near the end of body;
  adding data files under `assets/`; small bug fixes inside ONE clearly-named function you can see.
- NOT SAFE (leave for Claude): anything that deletes/moves large regions; the physics/ragdoll solver;
  the GLB bind/retarget path; the arena builder; any change that touches more than a few hundred lines.

## MERGE DISCIPLINE
- Before you start, `git fetch origin main` and base your work on the LATEST `main`. Never force-push `main`.
- If you see a merge would drop lines from `BANNON_v150.html`, abort the merge — the newer, LARGER file wins.
- When your PR/commit is done, the integrity workflow (`.github/workflows/integrity.yml`) must be green.

If in doubt, do nothing and leave a note — a no-op is always better than clobbering the game.
