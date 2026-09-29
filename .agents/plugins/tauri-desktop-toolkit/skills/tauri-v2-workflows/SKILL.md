---
name: tauri-v2-workflows
description: Procedural runbook for developing, building, and debugging Tauri v2 desktop applications.
---

# Tauri v2 Workflows

## Development Cycle
1. Start frontend dev server: `npm run dev`
2. Launch Tauri application: `npm run tauri dev`
3. Inspect Webview console logs and Tauri IPC responses via DevTools (`Ctrl+Shift+I` on Windows / `Cmd+Option+I` on macOS).

## Cross-Platform Compilation
- Windows: `cargo check` and `cargo build --release --manifest-path src-tauri/Cargo.toml`
- macOS Apple Silicon: `cargo check --target aarch64-apple-darwin` or CI job using `macos-14` runner.
