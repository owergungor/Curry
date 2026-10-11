---
description: Release management, tag preservation, and versioning rules
trigger: always_on
---

# Release Governance & Versioning Rules

Authoritative policy: [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md)

## 1. Tag Preservation & Safety
- **Future-Proof Tag Protection**: Never delete, force-overwrite (`git push --force`), or mutate any release tag (`v*`). Historical tags (`v1.0` through `v2.0` and subsequent) are immutable.
- **Explicit Approval Required**: Never create or push tags, never trigger GitHub releases without prior user approval.

## 2. Versioning Format
- **User-Facing Release Format**: Two-component format `vX.Y` (e.g. `v2.0`). User-facing assets, titles, and release tags follow this convention.
- **Technical Manifest Format**: Standard SemVer `X.Y.0` (e.g. `2.0.0`) in `package.json`, `Cargo.toml`, and `tauri.conf.json`.

## 3. Asset Integrity
- Windows required assets: `Curry_vX.Y_win-x64-setup.exe` (NSIS), `Curry_vX.Y_win-x64.zip`, and `Curry.exe`.
- macOS required assets: `Curry_vX.Y_mac-arm64.dmg` and `Curry_vX.Y_mac-arm64.app.zip`.
- Verify SHA-256 digests and file sizes immediately after building. Never publish placeholder or zero-byte assets.
