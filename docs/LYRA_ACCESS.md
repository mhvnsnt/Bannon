# Getting Lyra into a repo I can pull (you have Epic access — this is just the mechanics)

You have legit Epic access to Lyra, so this is fair game. The only blocker is moving it from your Epic
account into a GitHub repo **under your `mhvnsnt` account** — this session can only add repos owned by
`mhvnsnt` (it refused `EpicGames/UnrealEngine`: "cross-tier adds are not supported"). Once Lyra lives at
`mhvnsnt/lyra`, I run `add_repo mhvnsnt/lyra` and integrate it directly.

## First, the honest catch: this step needs a computer (Windows or Mac)
The **Epic Games Launcher is desktop-only** — there's no Android/iPhone version, and Lyra's project files
only exist on a PC/Mac after you "Create Project". So this one part can't be done from your phone. You need
to borrow/use a Windows or Mac computer once to do the steps below; after that everything's back in GitHub
and I take over. (No coding — the GitHub Desktop path below has zero terminal commands.)

## Easiest path — Epic Launcher → GitHub Desktop (no command line)
Lyra is already in your Epic Library, so:
1. On the PC/Mac, open **Epic Games Launcher → Unreal Engine → Library** (or the **Learn** tab). Find
   **Lyra Starter Game** → click **Create Project** → choose a folder → it writes a `LyraStarterGame/`
   folder to disk. (This is the "get it out of the launcher" step you were missing — "Create Project" is
   what turns the library entry into real files.)
2. Install **GitHub Desktop** (desktop.github.com) and sign in with your `mhvnsnt` GitHub.
3. In GitHub Desktop: **File → Add Local Repository → choose the `LyraStarterGame/` folder**. It'll say
   it's not a git repo yet → click **"create a repository"** → set name `lyra`, keep it **Private** →
   **Create Repository**.
4. It shows all the files as changes → type a summary ("Lyra Starter Game") → **Commit to main** →
   **Publish repository** (keep **Private** checked). Done — it's now at `github.com/mhvnsnt/lyra`.
   - If it warns about large files, tick **"use Git LFS"** if offered; otherwise it's fine, just slower.
5. Tell me it's up. I run `add_repo mhvnsnt/lyra` and start integrating the systems.

### Terminal alternative (if you prefer)
In the `LyraStarterGame/` folder, after making an empty private `mhvnsnt/lyra` repo on github.com:
```
git init && git lfs install && git lfs track "*.uasset" "*.umap"
git add . && git commit -m "Lyra Starter Game (my Epic-account access)"
git branch -M main && git remote add origin https://github.com/mhvnsnt/lyra.git && git push -u origin main
```

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
