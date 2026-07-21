# Setting up UE_GITHUB_TOKEN for Cloud-Based Unreal Engine Builds

To compile the native Unreal Engine C++ project (BannonCore) in the cloud using GameCI on GitHub Actions, you must set up the `UE_GITHUB_TOKEN` secret. This token grants the cloud runner access to Epic Games' private repository if required, or simply allows it to authenticate the GitHub Action runner to pull necessary LFS and submodule assets for the autonomous build process.

## Instructions

1. **Generate a GitHub Personal Access Token (PAT):**
   - Go to your GitHub Settings > Developer settings > Personal access tokens (Tokens (classic)).
   - Click **Generate new token (classic)**.
   - Set an expiration and give it the `repo` scope (Full control of private repositories) if your repo is private, as well as `read:packages` if you are pulling any registry items.
   - Click **Generate token** and copy the generated token string.

2. **Epic Games Account Link (Optional but required for Unreal Engine Source):**
   - If your build requires pulling Unreal Engine from source, ensure your GitHub account is linked to your Epic Games account. You must have access to the `EpicGames/UnrealEngine` repository.

3. **Add Secret to Repository:**
   - Go to the Bannon repository on GitHub.
   - Navigate to **Settings** > **Secrets and variables** > **Actions**.
   - Click **New repository secret**.
   - **Name:** `UE_GITHUB_TOKEN`
   - **Secret:** *(Paste your generated token here)*
   - Click **Add secret**.

Once added, the `Autonomous Build & Verify Loop` action will use this token to authenticate during the `build-unreal-physics` job and correctly compile all custom C++ systems including Jolt, GGPO, llama.cpp, and the Bannon Creation Suite modules on every push to `main`.
