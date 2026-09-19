# BANNON — AI WORKING CONTRACT (BINDING for EVERY AI: Claude, Google AI Studio, CODEDUMMY, any agent)

Owner directive, 2026-07-18. A year of work across multiple AIs produced features that do not add up
to a finished game — spaghetti, shallow stubs, and false "done" claims. This contract exists to STOP
that. It overrides convenience. Read it before every task. If you cannot follow it, say so plainly
instead of faking compliance.

---

## 0. THE PRIME DIRECTIVE
Build toward ONE complete, cohesive, shippable game. Every change must move the whole game closer to
done and must connect to what already exists. A feature that isn't wired into the real game, reachable
by the player, and verified is NOT done — it's a liability.

## 1. SCOPE RECOGNITION — read what the owner actually asked for
Classify the request before writing anything:
- **Specific feature** ("add a reversal on the dodge button") → implement THAT, surgically, wired in,
  verified. Don't sprawl.
- **FULL integration / FULL clone / "add all of X" / "pull the whole repo"** ("add all MDickie
  Wrestling Empire legacy files", "pull the full Lyra starter and build on it", "integrate the whole
  repo", "everything we're missing") → this is a COMPLETE-INGEST job, not a sample. See §2.
When unsure which one it is, default to the LARGER interpretation the owner's words support, and say
what you're doing. Never silently downscope a "full" request into a token demo.

## 2. FULL-INTEGRATION PROTOCOL (no partial, no stub, no lying)
When the ask is a full clone / full repo / "add all X":
1. **Get the real source.** Pull the ACTUAL upstream code/files/assets (clone the repo, fetch the
   files, decode the archives). Do not hand-write a partial reimplementation from memory. Real code
   beats invented code.
2. **Inventory it.** Enumerate EVERY system/file/asset in the source into a written checklist
   (a `docs/*_integration.md` with a table). That checklist is the definition of done.
3. **Port it in full, turned proprietary.** Convert each item to work in OUR engine and rename to our
   universe (no trademarks — see the character/gen rules in CLAUDE.md). Every checklist row gets
   integrated, wired into the live game, and checked off — or explicitly marked BLOCKED with the exact
   reason (missing asset, needs GPU, needs owner input). No row is left silently unaddressed.
4. **Verify each part in the real game** (§4), not in isolation.
5. **Report the checklist state honestly** — "X of N integrated, these M blocked because …". Never
   report "done" while rows remain unintegrated.
Licensing: distilled/derived data and our own reimplementations are fine to commit; raw third-party
source and commercial manuscripts are NOT (see CLAUDE.md "SECURITY / DO NOT COMMIT").

## 3. PULL, DON'T REINVENT
Prefer a real, proven open-source implementation over writing your own from scratch — especially for
hard, well-solved problems (rigging/skinning, physics solvers, IK, pathfinding, format decoders).
- Example lesson: the hand-written skinner `tools/rigready/skin.cjs` produced BROKEN models for
  months. The correct move was to adopt UniRig (`docs/MODEL_RIGGING.md`). Do that FIRST, not last.
- Before writing a nontrivial system, search GitHub / HF / open-source for a complete solution and
  integrate it. Only hand-roll when nothing suitable exists, and say why.

## 4. VERIFY WITH THE SENSES — NEVER CLAIM WHAT YOU HAVEN'T OBSERVED
- Run the harness (`.claude/skills/bannon-verify/SKILL.md`): rebuild, syntax-gate, run a real match,
  MEASURE state, and LOOK at screenshots. Report the numbers you actually measured.
- **Anti-hallucination rule (hard):** never say "done", "verified", "clean", "coherent", "works", or
  "complete" unless you observed it THIS session with a tool. If you did not/could not verify, write
  "NOT verified — <why>". Looking at a broken model and calling it "coherent" is a contract violation.
- If a tool can't run here (e.g. GPU work in a CPU sandbox), say so and hand off the exact command —
  do not pretend it ran.

## 5. NO SHALLOW STUBS PRESENTED AS FEATURES
A stub/placeholder is allowed ONLY if it is (a) explicitly labeled a stub in the code and the report,
and (b) tracked as a follow-up. Printing narrative and computing nothing (the bannonengine "cout"
pattern) is not a feature. Don't decorate a stub as complete.

## 6. ANTI-SPAGHETTI / ARCHITECTURE
- Before building, scan for an existing system (MANIFESTO/BLUEPRINT/CLAUDE.md/grep). Extend it; do not
  add a second parallel system that does the same thing.
- Additive + surgical. `BANNON_v150.html` is the sacred single source of truth — run
  `scripts/verify_integrity.cjs`, never wholesale-replace on merge (see bannon_dev_agent.md §2).
- Keep this branch and `main` always mergeable.

## 7. HONESTY & REPORTING
State outcomes faithfully: what you changed, what you verified and how, what failed, what's still
open. No flattery, no filler, no inflated "shipped" language. If you were wrong earlier, say so and
correct it. The owner would rather hear "3 of 10 done, 7 blocked on the GPU host" than a false "done".

## 8. SECRETS
Never commit tokens/keys (HF, GitHub PAT, Telegram, Tripo, Railway). They belong in environment
secrets, not files. If you find a committed secret, flag it for rotation immediately (see the AGENTS.md
token incident). A fresh session not having a key is CORRECT — ask the owner to set it as an env secret
so it persists without living in the repo.

---
Every AI working on BANNON is bound by this. When in doubt, do the complete, honest, verified thing.
