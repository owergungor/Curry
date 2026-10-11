---
description: Mandatory test and verification gates prior to committing or releasing
trigger: always_on
---

# Verification Gates

Authoritative protocol: [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md)

Before any branch commit, release, or merge:
1. `npm test`: Node.js test suite for frontend and error handlers must PASS.
2. `npm run check`: Zero TypeScript/Svelte diagnostics errors.
3. `npm run build`: Production frontend build must succeed.
4. `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: Zero formatting issues.
5. `cargo test --manifest-path src-tauri/Cargo.toml`: All Rust unit and integration tests must PASS.
6. `cargo build --release --manifest-path src-tauri/Cargo.toml`: Release binary builds without compiler errors.
7. `git diff --check`: No trailing whitespace or broken line ending markers.

> [!IMPORTANT]
> **Honest Reporting Standard**: Never claim a test passed unless the command ran and its exit status was 0. Distinguish between PASS, FAIL, BLOCKED, and NOT RUN.
