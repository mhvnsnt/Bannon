# CODEDUMMY — capability spec to beat Claude Code / Google AI Studio

Goal: CODEDUMMY (local abliterated model + agent hands) should out-perform cloud
agents on THIS codebase — no token limits, private, 24/7 — while never making the
amateur mistakes a raw LLM makes. The model is the brain; the DISCIPLINE below is
what makes it better. Honest gap analysis, no parts left out.

## The mistakes CODEDUMMY currently makes (and the fix for each)
1. **Merge clobbering** (it reverted BANNON_v150.html to an older baseline, dropping
   ~2400 lines). → NEVER wholesale-replace a file on merge; `git fetch` + rebase onto
   the latest tip first; run `scripts/verify_integrity.cjs` as a **pre-commit hook**
   and abort on non-zero. One source of truth per file. (See CODEDUMMY_merge_safety.md.)
2. **Ships without verifying.** A cloud agent that edits and commits blind is worse
   than one that proves the change. → MANDATORY verify-before-commit: rebuild the
   vendored `test.html`, syntax-gate every `<script>` block, run a real match, and
   MEASURE the change (`.claude/skills/bannon-verify/SKILL.md`). No green, no commit.
3. **Hallucinated APIs / wrong function names.** → The agent must `grep` the actual
   symbol before calling it; never invent a resolver/prop name. (Cost me hours the
   first time — `playerAttack` not `resolveMove`, Spring3 `.tgt.y` not `.y`.)
4. **Loses project context between runs.** → Read `CLAUDE.md` (session memory) +
   `.claude/agents/bannon_dev_agent.md` (role/laws) at the START of every task. Honor
   the owner-veto list (e.g. NO timing-minigame grapples).
5. **Breaks physics laws to satisfy a request.** → If a change conflicts with the
   immutable constants (MAX_BODY_VEL 3.8, poise-driven crumple), FLAG the math
   conflict before writing code — don't silently "fix" it.

## Architecture (make it real, not a chatbot)
- **Brain:** local OpenAI-compatible endpoint (Ollama / llama.cpp) running an
  abliterated coder model; a dynamic fallback matrix — when one model rate-limits or
  OOMs, swap to the next (7B ⇄ 32B, or a second host) with zero downtime.
- **Hands:** an agent loop with real tools: read/grep/glob, edit (surgical string
  replace, not full-file rewrite), bash (git, node, the verify harness), and a
  screenshot/vision step so it can SEE the game like this agent does.
- **Nervous system:** the God-Mode OS heartbeat runs it 24/7 against `mhvnsnt/BANNON`;
  every autonomous change goes verify → integrity-guard → commit → push, and posts a
  one-line status. It NEVER pushes red.
- **Memory:** Supabase/pgvector RAG over the codebase + canon/*.md + CLAUDE.md, so it
  answers from the repo, not from training priors.
- **The two-agent safeguard:** this in-repo agent and the CODEDUMMY agent are two
  sides of one mind. Each verifies the other's diffs against the integrity guard
  before merge; neither can clobber the other's shipped systems.

## The bar
Better than a cloud agent on BANNON means: it never drops a shipped system, never
commits red, never breaks a physics law, cites the repo not its priors, and runs
unattended for hours moving the roadmap forward. The guardrails above — not raw model
IQ — are what clear that bar.
