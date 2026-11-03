<div align="center">

<img src="static/curry_icon.png" alt="Curry Logo" width="104" height="104" style="border-radius: 22px; box-shadow: 0 8px 24px rgba(255, 92, 0, 0.35);" />

# Curry

### Ambient Desktop Notification Companion & Screen Glow Utility

Curry illuminates your display borders with customizable, hardware-accelerated ambient glow animations for incoming desktop notifications. Built with a local-first architecture, Curry processes notification data locally with zero telemetry.

[![Microsoft Store](https://img.shields.io/badge/Microsoft%20Store-Get%20Curry-0078D6?style=for-the-badge&logo=microsoft&logoColor=white)](https://apps.microsoft.com/detail/9P2STBW88PDQ)
[![Download Latest](https://img.shields.io/badge/Download-v3.3%20Windows%20Setup-ff5c00?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/owergungor/Curry/releases/download/v3.3/Curry_v3.3_win-x64-setup.exe)
[![Official Website](https://img.shields.io/badge/Website-owergungor.github.io%2FCurry-10b981?style=for-the-badge&logo=safari&logoColor=white)](https://owergungor.github.io/Curry/)

<br/>

[![GitHub Release](https://img.shields.io/github/v/release/owergungor/Curry?color=ff5c00&style=flat-square&label=Release)](https://github.com/owergungor/Curry/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(x64)-0078D6?style=flat-square&logo=windows)](https://github.com/owergungor/Curry)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Svelte](https://img.shields.io/badge/Svelte-5.0-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Rust](https://img.shields.io/badge/Rust-1.85+-orange?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Telemetry-success?style=flat-square)](https://owergungor.github.io/Curry/privacy-policy.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

</div>

---

## Overview

Traditional notification banners are intrusive, often covering vital user interface elements or pulling your attention away from active tasks. **Curry** solves this problem by transforming incoming notifications into subtle, non-disruptive, ambient screen-edge glows.

With native Windows Runtime (WinRT) listener integration, Curry captures alerts with **0ms latency** and **zero polling overhead**, rendering fluid animations using your GPU while consuming less than 1% CPU in the background.

- 🌐 **Landing Page & Documentation**: [https://owergungor.github.io/Curry/](https://owergungor.github.io/Curry/)
- 🛍️ **Microsoft Store Product**: [Curry: Notification Companion](https://apps.microsoft.com/detail/9P2STBW88PDQ) (`9P2STBW88PDQ`)
- 🔒 **Privacy Policy**: [https://owergungor.github.io/Curry/privacy-policy.html](https://owergungor.github.io/Curry/privacy-policy.html)

---

## Key Features

### 🌟 Ambient Edge Glow Engine
- **5 Animation Styles**: `Pulse`, `Sweep`, `Ambient`, `Comet`, and `Ripple`.
- **Complete Visual Customization**: Granular control over border thickness, glow spread, animation duration, cycle speed, and opacity.
- **Hardware-Accelerated**: Rendered via direct GPU compositing for silk-smooth 60+ FPS motion without frame drops.

### ⚡ Native WinRT Event Capture
- Direct integration with Windows 10 & 11 `Windows.UI.Notifications.Management.UserNotificationListener`.
- Pure event-driven notification stream with zero background CPU polling.
- In-memory ring buffer with full-text search, filtering, and read/unread status management.

### 🔍 Auto App Discovery & Custom Profiles
- **Auto App Scan**: Automatically scans installed Start Menu and Registry shortcuts to detect desktop applications.
- **Per-Application Overrides**: Configure distinct colors, animations, durations, and monitor targets for individual apps (e.g., Slack, Discord, Outlook, Teams).
- **Layout Switcher**: Toggle between high-density card grid and streamlined list view for application profiles.

### 🛡️ Smart Suppression & OLED Care
- **Fullscreen & Gaming Suppression**: Automatically suppresses ambient glow overlays during full-screen games, media playback, or fullscreen presentations.
- **OLED Panel Burn-In Protection**: Dynamic peak luminance capping and border spread narrowing to preserve OLED / QD-OLED display longevity.
- **Low-Battery Awareness**: Gracefully pauses intense glow animations when your laptop transitions to battery saver mode.

### 🎨 Curated Themes & Modern UI
- **10 Handcrafted Colorways**: *Perpetuity (Standard Obsidian)*, *Matrix Green*, *Neon Magenta*, *Catppuccin*, *Amethyst Haze*, *Zen Linen*, *Sage Mist*, *Amber Slate*, *Sakura Dawn*, and *Mocha Mousse*.
- **Tactile Svelte 5 Interface**: Built with modern Svelte 5 runes (`$state`, `$derived`, `$effect`) for instant reactive UI updates and accessible controls.
- **Multilingual Support (i18n)**: Fully localized in English 🇬🇧, Türkçe 🇹🇷, Deutsch 🇩🇪, Français 🇫🇷, and Español 🇪🇸.

### 🖥️ Multi-Monitor Display Synchronization
- Route ambient glows to your **Primary Display**, the display housing your **Active Window**, or synchronize simultaneously across **All Displays**.
- Dynamic DPI-aware coordinate handling with negative coordinate virtual desktop support.

---

## Downloads & Installation

Curry is distributed officially via the **Microsoft Store** and **GitHub Releases**.

### Official Packages (v3.3)

| Package Format | Filename / Target | Size | Description |
| :--- | :--- | :--- | :--- |
| **Microsoft Store** | Store ID `9P2STBW88PDQ` | Cloud | **Recommended**: Verified, sandboxed, and automatic background updates. |
| **Windows Installer** | [`Curry_v3.3_win-x64-setup.exe`](https://github.com/owergungor/Curry/releases/download/v3.3/Curry_v3.3_win-x64-setup.exe) | 3.9 MB | Standard NSIS installer with Start Menu shortcuts and auto-updater. |
| **Windows MSIX** | [`Curry_v3.3_win-x64.msix`](https://github.com/owergungor/Curry/releases/download/v3.3/Curry_v3.3_win-x64.msix) | 5.2 MB | Modern MSIX package for clean installation and enterprise deployment. |
| **Portable ZIP** | [`Curry_v3.3_win-x64.zip`](https://github.com/owergungor/Curry/releases/download/v3.3/Curry_v3.3_win-x64.zip) | 9.2 MB | Portable archive. Extract anywhere and launch `Curry.exe` directly. |
| **Standalone Binary**| [`Curry.exe`](https://github.com/owergungor/Curry/releases/download/v3.3/Curry.exe) | 14.0 MB | Single portable executable without installer. |

> All release packages include SHA-256 digests in [`SHA256SUMS.txt`](https://github.com/owergungor/Curry/releases/download/v3.3/SHA256SUMS.txt) and cryptographic signatures (`.sig`).

### System Requirements
- **OS**: Windows 10 (Build 14393 or later) or Windows 11 (64-bit).
- **Runtime**: Microsoft Edge WebView2 (pre-installed on Windows 10/11).
- **Notification Access**: Notification Listener permission enabled in Windows Settings (`Settings > Privacy & security > Notifications`).

---

## Privacy & Security

Curry is built from the ground up as a **local-first, privacy-respecting** utility:

- 🔒 **Zero Telemetry**: No analytics libraries, no tracking scripts, no advertising SDKs.
- 🚫 **No Cloud Sync**: Notification titles, text, sender names, and icons are never uploaded to any remote server. Network connectivity is limited strictly to checking GitHub for release updates.
- 💾 **Local Configuration**: Settings and profiles are saved strictly in `%LOCALAPPDATA%\com.curry.app`.
- 📖 Read our full [Privacy Policy](https://owergungor.github.io/Curry/privacy-policy.html).

---

## Development

Curry is developed using **Tauri v2**, **Rust**, and **Svelte 5**.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher) and npm
- [Rust](https://rustup.rs/) (v1.85 or higher with MSVC target)
- Microsoft Visual Studio C++ Build Tools & WebView2

### Setup & Run
```bash
# Clone repository
git clone https://github.com/owergungor/Curry.git
cd Curry

# Install frontend dependencies
npm install

# Start development server with hot-reload
npm run dev

# Run the complete Tauri desktop app
npm run tauri dev
```

### Verification & Testing
```bash
# SvelteKit diagnostics & TypeScript typecheck
npm run check

# Frontend unit tests
npm test

# Rust unit and integration tests
cargo test --manifest-path src-tauri/Cargo.toml
```

### Production Build
```bash
# Generate production frontend and packaged desktop binaries
npm run build
npm run tauri build
```

Production installers and standalone executables will be output to `src-tauri/target/release/bundle/`.

---

## Architecture

- **Frontend**: Svelte 5 runes (`$state`, `$derived`, `$props`), TypeScript, and Vite for reactive desktop UI.
- **Tauri Core**: Tauri v2 with secure IPC commands, window lifecycle events, and tray management.
- **Native OS Layer (Rust)**:
  - `src-tauri/src/listener/`: WinRT `UserNotificationListener` integration.
  - `src-tauri/src/glow/`: Multi-monitor overlay management and display coordination.
  - `src-tauri/src/scanner/`: Fast Windows Start Menu & Registry desktop app discovery.
  - `src-tauri/src/settings/`: Atomic JSON configuration storage with rollback protection.

---

## License

Curry is open source software licensed under the **[MIT License](LICENSE)**.

Copyright &copy; 2026 Ömer Güngör &amp; Curry Contributors.
