# Getting Lyra into a repo I can pull (you have Epic access — this is just the mechanics)

You have legit Epic access to Lyra, so this is fair game. The only blocker is moving it from your Epic
account into a GitHub repo **under your `mhvnsnt` account** — this session can only add repos owned by
`mhvnsnt` (it refused `EpicGames/UnrealEngine`: "cross-tier adds are not supported"). Once Lyra lives at
`mhvnsnt/lyra`, I run `add_repo mhvnsnt/lyra` and integrate it directly.

## Easiest path — the standalone Lyra download (recommended)
You don't need the whole 100GB engine. Lyra ships as its own sample project.
1. **Epic Games Launcher → Unreal Engine → Learn** (or Samples/Marketplace) → find **"Lyra Starter
   Game"** → **Create Project** (or Download). You get a `LyraStarterGame/` folder on your PC.
2. Make a new **private** repo on GitHub: `mhvnsnt/lyra` (private is fine — I can still add it).
3. Push it. In a terminal in the `LyraStarterGame/` folder:
   ```
   git init
   git lfs install            # Lyra has big binary Content; LFS keeps the push sane
   git lfs track "*.uasset" "*.umap"
   git add .gitattributes
   git add .
   git commit -m "Lyra Starter Game (Epic sample, my Epic-account access)"
   git branch -M main
   git remote add origin https://github.com/mhvnsnt/lyra.git
   git push -u origin main
   ```
   (If `git lfs` isn't installed: get it from git-lfs.com, or skip LFS and just `git add .` — the push is
   bigger but works.)
4. Tell me it's up. I'll `add_repo mhvnsnt/lyra` and start integrating.

## What I actually need for integration (if the full push is a pain)
For mining Lyra's systems and adopting them (foot-IK locomotion, Motion Warping, GAS combat — see
`docs/LYRA_BASE.md`), I mostly need the **C++ and config**, which is SMALL. If the full Content push is
too heavy, push just these folders to `mhvnsnt/lyra`:
- `Source/` (the game C++)
- `Plugins/` (GameFeatures, ability sets, etc. — the good stuff)
- `Config/`  and the `.uproject`
That's a few MB and lets me pull the real systems in. The binary Content (art/maps) is only needed to
actually *build* on a desktop, which is a UE-editor step anyway.

## If you'd rather use the full engine source
If you cloned `EpicGames/UnrealEngine` locally (Lyra is at `Samples/Games/Lyra` inside it), just copy
that `Lyra` folder into a fresh `mhvnsnt/lyra` repo and push — same result.

## After it's in
Once `mhvnsnt/lyra` exists, I will: add it to the session → mine `Source/`+`Plugins/` → adopt the
locomotion/foot-IK, Motion Warping, GAS ability structure, and hit-reaction blending into `unreal/`
(our module is already built to drop in as a Lyra Game Feature) → keep the physics LAWS in `native/`.
No EULA issue: it's your licensed access, kept in your private repo, and we ship only our own game.
