# Curry — Master Governance & Architectural Standards

## 1. Project Identity & Architecture
- **Application Name**: Curry
- **Repository**: [https://github.com/owergungor/Curry](https://github.com/owergungor/Curry)
- **Architecture**: Modern, local-first ambient desktop notification companion and screen-edge glow utility built with Tauri v2, Rust, and Svelte 5.
- **Privacy & Offline First**: Curry is 100% offline, zero-telemetry, and strictly preserves user privacy.

## 2. Platform Tiers & Isolation
Curry follows a tiered cross-platform support model:
- **Tier 1 — Officially Supported & Packaged**:
  - **Windows x64** (`x86_64-pc-windows-msvc`): Native WinRT notification listener, Win32 window geometry detection, NSIS installer (`Curry_vX.Y_win-x64-setup.exe`), portable zip (`Curry_vX.Y_win-x64.zip`), and standalone executable.
  - **Apple Silicon macOS** (`aarch64-apple-darwin`): Native AppKit window abstractions, DMG bundle (`Curry_vX.Y_mac-arm64.dmg`), notarization, and Gatekeeper compliance.
- **Tier 2 — Experimental / Scaffolding**:
  - **Linux** (`x86_64-unknown-linux-gnu`): Platform provider stub (`linux.rs`) providing graceful `NotImplemented` fallbacks. Must compile without breaking, but is not packaged or distributed in official release pipelines.

### Compiler & API Guarding Rules
- Windows-specific APIs (`windows::UI::Notifications::*`, `windows::Win32::*`) must be guarded with `#[cfg(target_os = "windows")]` at module, import, struct, and function levels.
- macOS-specific APIs must be guarded with `#[cfg(target_os = "macos")]`.
- Window transparency requires `#[cfg(any(not(target_os = "macos"), feature = "macos-private-api"))]`.
- Non-Windows / non-macOS platforms must have non-panicking, clean fallbacks behind `#[cfg(not(target_os = "..."))]`.

## 3. Technology Stack & Coding Standards
- **Desktop Runtime**: Tauri v2. Never replace or compromise Tauri's core architecture without explicit architectural review.
- **Frontend**: Svelte 5 with modern runes (`$state`, `$derived`, `$effect`, `$props`). Avoid legacy Svelte 3/4 reactive stores where runes are applicable.
- **Styling**: Scoped CSS with custom design tokens, dark/light/system theme isolation, and OLED burn-in protection limits.
- **Backend**: Rust 2021 edition. Thread synchronization must use safe primitives (`Arc<RwLock<T>>`, atomic types, `tokio` time). Never block async runtimes; use `tokio::task::spawn_blocking` for heavy synchronous OS operations.

## 4. Preservation of Existing Work & Permission Boundaries
- **Uncommitted Work Protection**: Never run `git reset --hard`, `git clean`, or discard existing working-tree modifications. Existing user-authored work must be preserved.
- **Explicit Approval Requirements**:
  - Deleting files of uncertain ownership.
  - Creating, moving, or pushing Git tags.
  - Committing or pushing changes to remotes.
  - Publishing, modifying, or deleting GitHub releases or assets.
  - Changing the Git remote URL.
  - Modifying global IDE settings outside the repository.
- **Destructive Operations**: Prohibited without prior explicit user consent.

## 5. Agent Responsibilities & Handoff Boundaries
- **Lead / Pair Programmer (`coding-agent`)**: Responsible for implementing Rust backend and Svelte frontend logic while strictly adhering to platform guards and runes.
- **Quality & Verification (`testing-agent`, `test-runner`)**: Executes the 7-step quality gate defined in [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md). Reports actual outcomes honestly.
- **Reviewer (`code-review-agent`)**: Reviews git diffs for platform boundary leaks, unused imports, formatting issues, and architectural coherence.
- **Security Auditor (`security-review-agent`, `desktop-security-guard`)**: Audits Tauri IPC command surface, CSP, file permissions, and secrets according to [SECURITY_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/SECURITY_POLICY.md).
- **Release Manager (`git-release-workflow`)**: Executes release verification and asset staging according to [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md). Requires explicit approval before any release publication.

## 6. Authoritative Governance References
- [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md) — Versioning, tag preservation, installer assets, and release gating.
- [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md) — Mandatory verification commands and honest reporting standards.
- [SECURITY_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/SECURITY_POLICY.md) — IPC surface, CSP, path sanitization, credentials, and updater signing.
