## AUTOMATED PR MAINTENANCE
When a PR is active and waiting for checks:
1. Poll the PR status (e.g., https://api.github.com/repos/mhvnsnt/Bannon/pulls/<PR_ID>) every 30 seconds.
2. If "mergeable_state" is "clean", immediately PUT /pulls/<PR_ID>/merge.
3. If blocked/behind, rebase or fix.
4. If "unstable"/"unknown", wait 30 seconds and retry.
Never ask for permission to monitor; just do it until merged.

### RECURSIVE TASK VERIFICATION
Before executing any task, GET the latest commit on main and check if that task was already completed in the last 3 commits. If it was, skip it and move to the next task.

### WORK RULES
Never work on tasks not explicitly in the current PLANNED list. Finding related code in the repo is not permission to extend it.

### PLANNED
- Chain wrestling lock-up (full integration)
- Dual submission system
- Promotion/booking sim
- Crowd momentum
- Visible damage blend shapes (cuts/swelling rendering)
- Ground game full position transitions
- Ladder as weapon
- 4 remaining reversal types: Breaker, Block, Dodge, Mid-move
