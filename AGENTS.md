# Curry — Project Governance & AI Agent Instructions

Welcome to **Curry**. This document serves as the primary entry point and authoritative instruction guide for all AI agents, pair programmers, and automated tooling operating within this repository.

## 1. Project Identity & Repository Scope
- **Project**: Curry ([https://github.com/owergungor/Curry](https://github.com/owergungor/Curry))
- **Description**: Ambient desktop notification companion and screen-edge glow utility built with Tauri v2, Rust, and Svelte 5.
- **Project Isolation**: This repository belongs strictly to Curry. Never import, reference, or cross-contaminate code, instructions, or error messages from unrelated projects (e.g. BBQ).

## 2. Core Governance Documents (Single Source of Truth)
All detailed policies are centralized under `docs/governance/`. When modifying code or running procedures, adhere strictly to these authoritative documents:
- [MASTER_GOVERNANCE.md](file:///c:/Users/omer/Projects/Curry/docs/governance/MASTER_GOVERNANCE.md): Architecture, supported platform tiers, compiler guards, and permission boundaries.
- [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md): Dual-tier versioning (`vX.Y` vs SemVer `X.Y.0`), immutable tag preservation (`v*`), required Windows/macOS assets, and release gating.
- [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md): The mandatory 7-step verification sequence and honest reporting standards (PASS / FAIL / BLOCKED / NOT RUN).
- [SECURITY_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/SECURITY_POLICY.md): Tauri IPC surface minimization, strict CSP, path traversal defense, and updater signing verification.

## 3. Preserving Existing Work & Safety Rules
- **NEVER** run `git reset --hard`, `git clean`, or discard user changes in the working tree.
- **NEVER** commit, push, create tags, or publish releases without explicit user approval.
- **NEVER** delete files whose ownership or purpose is uncertain.

## 4. Platform Support Summary
- **Tier 1 (Officially Supported & Distributed)**:
  - Windows x64 (`x86_64-pc-windows-msvc`): WinRT listener, Win32 window bounds, NSIS installer (`Curry_vX.Y_win-x64-setup.exe`), portable zip.
  - Apple Silicon macOS (`aarch64-apple-darwin`): AppKit transparent overlays, DMG (`Curry_vX.Y_mac-arm64.dmg`), codesigning/notarization.
- **Tier 2 (Experimental Scaffolding)**:
  - Linux (`x86_64-unknown-linux-gnu`): Provider stub (`linux.rs`) with clean `NotImplemented` fallbacks. Compiles cleanly, not distributed.

## 5. Agent Responsibilities & Handoffs
- **Pair Programmer / Coding Agent**: Writes Rust and Svelte 5 runes code adhering to platform gates (`#[cfg(target_os)]`).
- **Testing Agent / Test Runner**: Executes the 7-step verification sequence in [QUALITY_GATES.md](file:///c:/Users/omer/Projects/Curry/docs/governance/QUALITY_GATES.md).
- **Code Review Agent**: Inspects diffs for platform boundary leaks, dead code, formatting issues, and architectural violations.
- **Security Auditor**: Audits IPC handlers, CSP configurations, dependency CVEs, and secret hygiene.
- **Release Manager**: Stages and verifies release assets per [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md) only after explicit user approval.
