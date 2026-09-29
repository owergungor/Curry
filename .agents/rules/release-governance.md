---
description: Release management and Git safety governance rules
trigger: always_on
---

# Release Governance & Versioning Rules

## 1. Tag Preservation
- Never delete, force-overwrite, or mutate existing historical release tags (`v1.0`, `v1.1`, `v1.2`, `v1.3`).
- Target release tags must match the standard convention: `vX.Y` (e.g., `v1.4`).
- Technical package manifests use SemVer `1.4.0`, but user-facing tags and assets must be prefixed with `v1.4`.

## 2. Asset Integrity Checks
- Every release artifact must be verified with SHA-256 and byte size before publication.
- Required release assets:
  - Windows: `Curry_vX.Y_win-x64.zip` and `Curry.exe`
  - macOS: `Curry_vX.Y_mac-arm64.dmg`
- Never publish placeholder, mock, or zero-byte installers.
