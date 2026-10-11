---
name: github-release-manager
description: Manage and verify GitHub releases, tags, assets, and checksums using the GitHub CLI.
---

# GitHub Release Manager Workflow

> [!IMPORTANT]
> Always obtain explicit user approval before publishing releases, uploading assets, or modifying existing tags.
> Refer to [docs/governance/RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md) for authoritative rules.

1. Inspect release state:
   ```powershell
   gh release view <tag> # e.g. v2.0
   ```
2. Verify local release assets before upload (ensure SHA-256 digests and file sizes are non-zero):
   - Windows Installer: `dist_release/Curry_<tag>_win-x64-setup.exe`
   - Windows Portable: `dist_release/Curry_<tag>_win-x64.zip`
   - Windows Binary: `dist_release/Curry.exe`
   - macOS DMG: `dist_release/Curry_<tag>_mac-arm64.dmg`
   - macOS App Archive: `dist_release/Curry_<tag>_mac-arm64.app.zip`
3. Upload assets (only after user approval; do NOT use `--clobber` unless user explicitly requests asset replacement):
   ```powershell
   gh release upload <tag> "dist_release/Curry_<tag>_win-x64-setup.exe" "dist_release/Curry_<tag>_win-x64.zip" "dist_release/Curry_<tag>_mac-arm64.dmg"
   ```
4. Verify download integrity:
   Download published assets into a temporary directory and verify SHA-256 digests match local build artifacts.
