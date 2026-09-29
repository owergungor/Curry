---
description: Mandatory test and verification gates prior to committing or releasing
trigger: always_on
---

# Verification Gates

Before any branch commit or release:
1. `npm run check`: Zero TypeScript/Svelte diagnostics errors.
2. `npm run build`: Production frontend build must succeed.
3. `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: Zero formatting issues.
4. `cargo test --manifest-path src-tauri/Cargo.toml`: All unit and integration tests must PASS.
5. `cargo build --release --manifest-path src-tauri/Cargo.toml`: Release binary builds without compiler errors.
6. `git diff --check`: No trailing whitespace or broken line ending markers.
