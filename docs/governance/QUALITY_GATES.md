# Curry — Quality Gates & Verification Standards

## 1. Single Source of Truth for Verification
All agents, skills, and developers must execute and verify the following sequence before committing code, merging branches, or staging releases:

```powershell
# 1. Frontend & Error Management Tests
npm test

# 2. Svelte & TypeScript Diagnostics Check
npm run check

# 3. Production Frontend Bundle Build
npm run build

# 4. Rust Backend Code Formatting Check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check

# 5. Rust Unit & Integration Test Suite
cargo test --manifest-path src-tauri/Cargo.toml

# 6. Standalone Release Binary Build Verification
cargo build --release --manifest-path src-tauri/Cargo.toml

# 7. Git Diff Integrity Check
git diff --check
```

## 2. Gating Criteria
- **Zero Diagnostics Errors**: `npm run check` must report 0 errors and 0 fatal warnings.
- **100% Test Pass Rate**: `npm test` and `cargo test` must exit with code 0. Zero ignored or failing regressions.
- **Zero Formatting Violations**: `cargo fmt -- --check` must produce clean diffs.
- **Clean Production Bundles**: `npm run build` and `cargo build --release` must exit with code 0 without compiler warnings or missing chunk errors.
- **Diff Cleanliness**: `git diff --check` must detect no trailing whitespaces, merge conflicts, or CRLF line ending corruptions.

## 3. Honest Reporting Standards
Agents must strictly follow the honest reporting protocol:
- **Never Claim Unverified Success**: A test or check must NEVER be reported as PASS unless its command actually executed and returned exit status 0 in the current session.
- **Mandatory Status Classification**:
  - `PASS`: Command ran and completed with code 0.
  - `FAIL`: Command ran and completed with non-zero exit code.
  - `BLOCKED`: Command could not run due to missing environment tool, missing platform SDK, or dependency error.
  - `NOT RUN`: Command was intentionally or unintentionally omitted.
- **Root-Cause Analysis**: When a check fails, report the exact error, command output, and root cause before proposing remediation.
