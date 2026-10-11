---
description: Cross-platform compiler and runtime safety rules for Windows, macOS, and Linux
trigger: always_on
---

# Cross-Platform Architecture & Safety Rules

Authoritative policy: [MASTER_GOVERNANCE.md](file:///c:/Users/omer/Projects/Curry/docs/governance/MASTER_GOVERNANCE.md)

## 1. Supported Platform Tiers
- **Tier 1 (Officially Supported & Distributed)**:
  - **Windows x64** (`x86_64-pc-windows-msvc`): Full native support (WinRT notification listener, Win32 monitor rects, NSIS installer, portable zip).
  - **Apple Silicon macOS** (`aarch64-apple-darwin`): Full native support (AppKit window abstractions, DMG bundle, code signing & notarization pipeline).
- **Tier 2 (Experimental / Stub Scaffolding)**:
  - **Linux** (`x86_64-unknown-linux-gnu`): Platform provider stub (`linux.rs`) providing graceful `NotImplemented` fallbacks. Must compile cleanly, but is not packaged or distributed in official release pipelines.

## 2. Platform Isolation & Guarding
- All Windows-specific APIs (WinRT `UserNotificationListener`, Win32 `HWND`, `HMONITOR`, Windows Registry, Shell commands) **MUST** be strictly guarded with `#[cfg(target_os = "windows")]` at the module, import, struct, and function levels:
  ```rust
  #[cfg(target_os = "windows")]
  use windows::...;
  ```
- Windows-specific structs, trait implementations, and functions must never leak into macOS or Linux compilation units.
- macOS implementations must use Tauri native windowing APIs or Cocoa/AppKit abstraction behind `#[cfg(target_os = "macos")]`.
- For other platforms (including Linux and non-Windows environments), provide clean, non-panicking fallback implementations behind `#[cfg(not(target_os = "windows"))]` or `#[cfg(not(target_os = "macos"))]`.

## 3. Tauri v2 Feature Gates
- macOS window transparency requires `tauri/macos-private-api` feature and `"macOSPrivateApi": true` in `tauri.conf.json`. Any builder calls using `.transparent(true)` must be guarded:
  ```rust
  #[cfg(any(not(target_os = "macos"), feature = "macos-private-api"))]
  let builder = builder.transparent(true);
  ```

## 4. Multi-Monitor Coordinate Handling
- Screen geometry and virtual coordinate systems can include negative coordinates or high-DPI scaling.
- Always use Tauri's `available_monitors()` and `current_monitor()` APIs rather than raw platform handles.
- Ensure "All Displays" mode synchronizes overlays cleanly across primary and secondary displays.
