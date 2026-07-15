## AUTOMATED PR MAINTENANCE
When a PR is active and waiting for checks:
1. Poll the PR status (e.g., https://api.github.com/repos/mhvnsnt/Bannon/pulls/<PR_ID>) every 30 seconds.
2. If "mergeable_state" is "clean", immediately PUT /pulls/<PR_ID>/merge.
3. If blocked/behind, rebase or fix.
4. If "unstable"/"unknown", wait 30 seconds and retry.
Never ask for permission to monitor; just do it until merged.

### RECURSIVE TASK VERIFICATION
Before executing any task, GET the latest commit on main and check if that task was already completed in the last 3 commits. If it was, skip it and move to the next task.

### PLANNED
- Stun Meter and Momentum system
- Chain wrestling lock-up mini-game  
- Dual submission system
- 5 reversal types (standard done, add: Breaker, Block, Dodge, Mid-move)
- Full positional taxonomy (apron, tree-of-woe, avalanche, corner seated)
- Environmental destruction (tables, ladders)
- Visible damage accumulation (cuts, swelling per strike location)
- Ground game position transitions (full mount, half guard, back take)
- Promotion/booking sim mode
- Crowd momentum system
