---
name: verify-all
description: Executes the complete end-to-end verification suite across frontend and backend.
---

# Verify All Protocol

Execute the full verification sequence in sequence:
```powershell
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo build --release --manifest-path src-tauri/Cargo.toml
git diff --check
```
If any command fails, halt the workflow immediately and report the root cause before attempting fixes.
