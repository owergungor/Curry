---
name: verify-all
description: Executes the complete end-to-end verification suite across frontend and backend.
---

# Verify All Protocol

Authoritative protocol: [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md)

Execute the full verification sequence:
```powershell
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo build --release --manifest-path src-tauri/Cargo.toml
git diff --check
```

If any command fails, halt the workflow immediately, record actual exit codes and stderr, and report findings honestly. Never mask failures.
