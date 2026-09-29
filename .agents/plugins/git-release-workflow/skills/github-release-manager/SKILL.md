---
name: github-release-manager
description: Manage and verify GitHub releases, tags, assets, and checksums using the GitHub CLI.
---

# GitHub Release Manager Workflow

1. Check release state:
   ```powershell
   gh release view v1.4
   ```
2. Upload assets with clobber protection:
   ```powershell
   gh release upload v1.4 "dist_release/Curry_v1.4_mac-arm64.dmg" "dist_release/Curry_v1.4_win-x64.zip" "dist_release/Curry.exe" --clobber
   ```
3. Verify download integrity:
   Download the published asset and verify SHA-256 matches the local build digest.
