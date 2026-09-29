---
description: Cross-platform compiler and runtime safety rules for Windows and macOS
trigger: always_on
---

# Cross-Platform Architecture & Safety Rules

Curry is a dual-platform desktop application targeting **Windows x64** (`x86_64-pc-windows-msvc`) and **Apple Silicon macOS** (`aarch64-apple-darwin`).

## 1. Platform Isolation
- All Windows-specific APIs (WinRT `UserNotificationListener`, Win32 `HWND`, `HMONITOR`, Windows Registry, Shell commands) **MUST** be strictly guarded with `#[cfg(target_os = "windows")]`.
- All Windows-specific imports must be guarded at the import level:
  ```rust
  #[cfg(target_os = "windows")]
  use windows::...;
  ```
- Windows-specific structs, trait implementations, and functions must never leak into macOS compilation units.
- macOS implementations must use Tauri native windowing APIs or Cocoa/AppKit abstraction behind `#[cfg(target_os = "macos")]`.
- For code executing on other platforms, provide clean fallback implementations behind `#[cfg(not(target_os = "windows"))]` or `#[cfg(not(target_os = "macos"))]`.

## 2. Tauri v2 Feature Gates
- macOS window transparency requires `tauri/macos-private-api` feature and `"macOSPrivateApi": true` in `tauri.conf.json`. Any builder calls using `.transparent(true)` must be guarded:
  ```rust
  #[cfg(any(not(target_os = "macos"), feature = "macos-private-api"))]
  let builder = builder.transparent(true);
  ```

## 3. Multi-Monitor Coordinate Handling
- Screen geometry and virtual coordinate systems can include negative coordinates or high-DPI scaling.
- Always use Tauri's `available_monitors()` and `current_monitor()` APIs rather than raw platform handles.
- Ensure "All Displays" mode synchronizes overlays cleanly across primary and secondary displays.
