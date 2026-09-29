---
description: Tauri v2 desktop application development rules
trigger: always_on
---

# Tauri v2 Guidelines

- Maintain strict separation of concerns between Tauri frontend webview and native core.
- Keep system tray initialization resilient with duplicate initialization guards (`tray_by_id`).
- When defining overlay windows, disable taskbar, set decorations to false, and handle multi-monitor bounds dynamically.
- Guard `STATIC_VCRUNTIME` configurations strictly to Windows MSVC targets.
