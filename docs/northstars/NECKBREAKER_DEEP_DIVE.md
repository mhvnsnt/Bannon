# NECKBREAKER: VISCERAL PRO WRESTLING — Deep Dive

Research date: 2026-10-05. Mechanics summarized in our own words; sources cited.
Outreach status: owner reached out offering help — **no response as of 2026-10-05**. We build BANNON toward this design DNA as our own game in our own universe, regardless.

## The developer
- **Steve Masson** (@StevoMasson), solo developer and self-publisher. The rare case here: the game has a public Steam page with a full feature list, which is the primary source.

## Status
- Steam app 3083730: https://store.steampowered.com/app/3083730/Neckbreaker_Visceral_Pro_Wrestling/
- Release date: **"To be announced."** No critic or user reviews (Metacritic: tbd). Still in development as of 2026-10-05.
- A wrestling-forum thread (bethebooker.net) lists a 2026-12-27 date — treat as UNVERIFIED/placeholder; Steam itself says TBA.
- Community thread with dev discussion: https://bethebooker.net/thread/596/neckbreaker-visceral-pro-wrestling?page=4

## Core principle (their words, paraphrased)
The active physics system touches **every grapple, slam, and strike, so no two impacts are ever the same**. Lifting is a strength-vs-exhaustion gamble: fresh wrestlers power through anyone; gassed ones feel the overexertion and struggle with heavy opponents.

## Mechanics, concretely

### 1. Active-ragdoll physics engine
- Every slam and takedown gets its feel from the ragdoll simulation rather than canned animation alone.
- Standard practice for this (open-source grounding): state transitions between animated and ragdoll via IK + interpolation, with PD controllers maintaining posture after impact. BANNON's `Spring3` + `bannon_rig.h` (kp 900 / kd 60) already matches this architecture.

### 2. Overexertion on lifts
- Lifting is not binary success/fail on a stat check — it's a physical struggle scaled by lifter strength, opponent weight, and current exhaustion.
- Design read: the *attempt* itself costs stamina, and a failing lift still drains you (this is exactly what BANNON_LIFT_CHECK implements).

### 3. Environment as a weapon
- Smash opponents into **turnbuckles**; get **tangled in the ropes**; dive from a **20-foot balcony**; smash through tables; **explode light tubes**; dive off **20ft ladders**; pick up foreign objects (mature-content listing names baseball bats, folding chairs, barbed wire, household items).

### 4. Crowd Momentum
- "Feel the energy of the crowd rise and fall with the match. The unique system **influences your performance**." A two-way system: match events move the crowd, and the crowd state feeds back into wrestler performance (the "feed off the energy" line ties it to comebacks and finishers).

### 5. Deep grappling & strikes
- "Dynamic grappling and striking system, making every hit feel distinct and impactful" — variety in the move system married to the physics variance.

### 6. Modes & structure
- Career (rookie to hall-of-fame), **booker mode**, **sandbox mode**, tournaments (knockout / round-robin), fully customizable match types and rules, 4- or 6-sided ring choice.
- Booker mode is notable: the fantasy of *running the show*, adjacent to our Shot Caller thinking.

### 7. Creation suite
- Create-A-Wrestler, moveset tuning ("fine tune their moveset with adjustable moves"), detailed entrances, arena customization (colors, decorations).

### 8. Presentation
- Blood: splatter and staining effects. Taunts include crude gestures (crotch grabs, middle fingers) — attitude-era tone.

## What BANNON takes from this (design DNA, not assets)
1. "No two impacts the same" — already BANNON_IMPACT; push it further into ragdoll blend weight, not just damage/camera.
2. Overexertion — already BANNON_LIFT_CHECK; extend the struggle model to rope breaks, kickouts, and submission escapes.
3. Turnbuckle smashes — wire up the existing turnbuckle API (built, unused).
4. Rope tangling — new system on top of rope kinematics.
5. Height tiers for dives (balcony/ladder heights as real parameters, not just "a dive").
6. Crowd Momentum → performance coupling (crowd state must feed stats, not just visuals).
7. Booker mode adjacency — file under Shot Caller design space.
