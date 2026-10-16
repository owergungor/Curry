# Curry — Release Policy & Tag Preservation

## 1. Versioning Architecture
Curry maintains a dual-tier versioning format:
- **User-Facing Releases**: Standard two-part format `vX.Y` (e.g. `v2.0`). All Git tags, release titles, and user-facing distribution packages must follow this prefix convention:
  - `Curry_vX.Y_win-x64-setup.exe`
  - `Curry_vX.Y_win-x64.zip`
  - `Curry_vX.Y_mac-arm64.dmg`
  - `Curry_vX.Y_mac-arm64.app.zip`
- **Technical Package Manifests**: Three-part SemVer `X.Y.0` (e.g. `2.0.0`) in:
  - `package.json` (`"version": "2.0.0"`)
  - `src-tauri/Cargo.toml` (`version = "2.0.0"`)
  - `src-tauri/tauri.conf.json` (`"version": "2.0.0"`)

## 2. Future-Proof Tag Preservation
- **Immutability of Historical Tags**: All historical tags (`v1.0`, `v1.1`, `v1.1.0`, `v1.2`, `v1.3`, `v1.4`, `v1.5`, `v1.6`, `v1.7`, `v1.8`, `v1.9`, `v2.0`) and all future release tags (`v*`) are strictly immutable.
- **Prohibited Git Actions**:
  - `git push origin <tag> --force` is strictly forbidden.
  - Deleting remote or local release tags is prohibited.
  - Moving existing tags to new commits is prohibited.

## 3. Required Release Artifacts
Every release build must generate and verify the following distribution artifacts:
### Windows x64:
1. `dist_release/Curry_vX.Y_win-x64-setup.exe` — Primary NSIS setup installer with Start menu integration and updater support.
2. `dist_release/Curry_vX.Y_win-x64.zip` — Portable archive containing installer and standalone binary.
3. `dist_release/Curry.exe` — Standalone native executable.
### macOS Apple Silicon (arm64):
1. `dist_release/Curry_vX.Y_mac-arm64.dmg` — Drag-and-drop installer disk image.
2. `dist_release/Curry_vX.Y_mac-arm64.app.zip` — Symlink-preserving application bundle archive.
### Updater & Metadata:
- If Tauri signing private key is configured: `.tar.gz`, `.sig`, and `latest.json` updater manifests.

### Target Platform Scope (`workflow_dispatch`):
- **`all` (Default)**: Full dual-platform production release (Windows x64 + macOS arm64). Requires all 5 distribution packages, both platform updater archives, and unified dual-platform `latest.json`. Apple signing and notarization credentials remain strictly mandatory.
- **`windows-only`**: Official Windows x64 production release (used when Apple Developer signing credentials are not yet provisioned). Bypasses macOS build without relaxing official Windows updater signing or producing unverified macOS metadata. `latest.json` is scoped strictly to `windows-x86_64`.

## 4. Release Integrity & Verification Checks
Before publishing any release or uploading assets to GitHub Releases:
1. **Zero-Byte Guard**: Confirm file size > 0 for all assets.
2. **Digest Verification**: Generate and log SHA-256 checksums for every artifact.
3. **No Unsafe Overwrites**: Never use `--clobber` automatically in release scripts; explicit user approval is required before replacing any previously uploaded asset.
4. **Approval Gate**: Release creation, tag pushing, and asset uploads require explicit user confirmation.
