# Changelog

All notable changes to **Curry** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **5 Screen-Edge Glow Animation Styles**:
  - `Pulse`: Rhythmic breathing glow from display edges with smooth harmonic intensity curve.
  - `Sweep`: Directional beam moving clockwise along monitor borders.
  - `Ambient`: Soft, low-frequency constant border illumination.
  - `Comet`: High-intensity orbiting segment leaving a smooth decaying trail along the bezel.
  - `Ripple`: Concentric border pulse expanding dynamically outward.
  - Backwards-compatible deserialization and canonical mapping for legacy `breathing` and `solid` config entries.
- **Application Profiles Engine**:
  - Per-application glow configuration (`ApplicationProfile`) matching by executable name (e.g., `Discord.exe`, `Spotify.exe`, `steam.exe`) and application name.
  - Case-insensitive, resilient process matching.
  - Granular overrides for `color`, `animation`, `intensity`, `duration`, `monitorTarget`, and `suppressInFullscreen`.
  - Atomic persistence in `%APPDATA%\com.curry.app\application_profiles.json`.
  - Graceful fallback to global settings when an application profile is absent or values are unset.
- **Native Fullscreen & Gaming Suppression**:
  - Native Win32 foreground window geometric matching (`GetForegroundWindow`, `GetWindowRect`, `MonitorFromWindow`, `GetMonitorInfoW`).
  - Three global modes: `AlwaysShow`, `SuppressInFullscreen`, and `GamingOnly`.
  - Per-profile `suppressInFullscreen` override option.
  - Eliminates distracting edge glows while playing games or watching fullscreen video.
- **OLED Panel Optimization Mode**:
  - Global toggle with hardware-saving illumination logic:
    - Maximum peak intensity capped at 60%.
    - Border thickness and spread radius halved.
    - Glow duration capped at 2,000ms.
    - Mitigates pixel wear and reduces power consumption on OLED/QD-OLED monitors.
- **Svelte 5 Applications UI Tab**:
  - Dedicated **Applications** tab in the main navigation with live profile counter badge.
  - Application search filter and list of active profiles with inline toggles.
  - Built-in profile presets for Discord, Spotify, and Steam.
  - Modal editor with color picker & preset swatches, animation selector, intensity/duration sliders, monitor selector, and fullscreen toggle.
  - **Live Preview Button**: Instantly triggers overlay demonstration without injecting dummy items into notification history.
- **Multi-Monitor Targeting Expansion**:
  - Support for `Primary`, `All`, and `Specific` monitor targeting across profiles and global settings.
- **Automated Test Suite**:
  - 20 new comprehensive Rust unit tests covering profile resolution, fallback, overrides, OLED bounds, fullscreen state detection, and legacy migration.
  - Total automated unit test suite now stands at **63 passing tests**.

### Changed
- Refactored `GlowManager` to perform runtime profile resolution, monitor targeting, fullscreen evaluation, and OLED adjustments per notification.
- Updated Tauri IPC command registry with profile management and live preview handlers.
- Enhanced overlay Webview CSS with GPU-accelerated CSS keyframe animations and `prefers-reduced-motion` compliance.
- Clarified supported platforms documentation: Windows 10 & 11 fully supported; macOS & Linux roadmapped.
