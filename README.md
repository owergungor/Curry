<div align="center">

<img src="static/curry_icon.png" alt="Curry Logo" width="96" height="96" style="border-radius: 20px;" />

# Curry

A modern ambient desktop notification companion and screen glow utility built with Tauri, Svelte, and Rust.

[![GitHub Release](https://img.shields.io/github/v/release/owergungor/Curry?color=ff5c00&style=flat-square)](https://github.com/owergungor/Curry/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-0078D6?style=flat-square)](https://github.com/owergungor/Curry)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Svelte](https://img.shields.io/badge/Svelte-5.0-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Rust](https://img.shields.io/badge/Rust-1.85+-orange?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

</div>

---

Curry captures incoming desktop notifications in real time and illuminates your display borders with customizable, hardware-accelerated ambient glow animations. Built with a local-first architecture, Curry runs completely offline with zero telemetry.

## Features

- **Ambient Screen-Edge Glow**: 5 animation styles (`Pulse`, `Sweep`, `Ambient`, `Comet`, `Ripple`) with configurable thickness, duration, and opacity.
- **Real-Time Notification Capture**: Captures desktop notifications locally via native APIs (WinRT on Windows).
- **Searchable History**: In-memory ring buffer with full-text search, filtering, and read/unread states.
- **Application Profiles**: Custom glow colors, animations, monitor targets, and duration overrides per application.
- **Apps Grid & List View Modes**: Toggle between high-density card grid and streamlined list view for application profiles, with persistent layout preference.
- **Profile Deletion Safety**: Interactive confirmation modal dialog protecting against accidental deletion of application profiles.
- **Multilingual Support (i18n)**: Fully localized across 5 languages (English 🇬🇧, Türkçe 🇹🇷, Deutsch 🇩🇪, Français 🇫🇷, Español 🇪🇸) with instant reactive switching.
- **Fullscreen & Gaming Suppression**: Automatically suppresses ambient glow overlays during full-screen games and media playback.
- **OLED Mode Optimization**: Caps peak brightness and narrows border spread to preserve panel longevity and reduce power consumption.
- **Modern Desktop UI**: Refined interface with tactile controls, smooth transitions, and keyboard accessibility.
- **Appearance Modes**: Seamless switching between System, Light, and Dark appearance.
- **Start with Windows**: Native background startup option configurable during installation and in settings.
- **Multi-Display Support**: Route ambient glow to primary display, active window display, or all connected monitors.
- **System Tray & Single Instance**: Runs quietly in the system tray with global single-instance process protection.
- **Automatic Updates**: Integrated update delivery powered by Tauri's updater.
- **100% Offline & Private**: Zero analytics, telemetry, or external network requests.

## Themes

Curry features curated color themes designed for optimal contrast and visual clarity:

- **Standard (Perpetuity)** *(Default)* — Precision monochrome obsidian slate with electric cyan-indigo glow
- **Zen Linen** — Calm organic linen, airy warm stone, and refined sage-moss accents
- **Matrix Green** — High-contrast cyber terminal aesthetic with luminous emerald glow
- **Neon Magenta** — Midnight void with high-voltage neon magenta radiance
- **Catppuccin** — Soothing pastel lavender and mocha crust
- **Amethyst Haze** — Deep violet aura with vivid amethyst accents
- **Sage Mist** — Botanical evergreen tones with soft mint highlights
- **Sakura Dawn** — Soft cherry blossom dawn with delicate rose quartz
- **Mocha Mousse** — Rich velvety espresso, warm caramel, and toasted cocoa
- **Amber Slate** — Molten warm amber and industrial slate steel

## Installation

Download the latest release (**v2.0**, with **v2.1** enhancements in development) from [GitHub Releases](https://github.com/owergungor/Curry/releases).

### Windows

Supported on Windows 10 (Build 14393+) and Windows 11.

- **Installer (Recommended)**: Download and run `Curry_v2.0_win-x64-setup.exe` (or `Curry_vX.Y_win-x64-setup.exe`) for automated setup, Start menu shortcuts, and seamless updates.
- **Portable**: Download `Curry_v2.0_win-x64.zip` (or `Curry_vX.Y_win-x64.zip`), extract to any directory, and launch `Curry.exe`.

### macOS

Supported on macOS 11.0+ (Apple Silicon / arm64).

- **Disk Image**: Download `Curry_v2.0_mac-arm64.dmg` (or `Curry_vX.Y_mac-arm64.dmg`), open the DMG, and drag Curry into your `Applications` folder.
- **Portable Archive**: Download `Curry_v2.0_mac-arm64.app.zip` (or `Curry_vX.Y_mac-arm64.app.zip`), extract, and launch.

Browse all downloads and release assets on the official [Releases page](https://github.com/owergungor/Curry/releases).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher) and npm
- [Rust](https://rustup.rs/) (v1.85 or higher)
- Platform-specific Tauri build tools:
  - **Windows**: Microsoft Visual Studio C++ Build Tools and WebView2
  - **macOS**: Xcode Command Line Tools

### Setup & Run

```bash
# Clone repository
git clone https://github.com/owergungor/Curry.git
cd Curry

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

To run the full Tauri desktop application during development:

```bash
npm run tauri dev
```

### Verification & Testing

```bash
# Frontend type check & Svelte diagnostics
npm run check

# Backend unit & integration tests
cargo test --manifest-path src-tauri/Cargo.toml
```

## Build

Generate production desktop bundles:

```bash
# Build frontend bundle
npm run build

# Package desktop application via Tauri CLI
npm run tauri build
```

Production installers and standalone executables are output to `src-tauri/target/release/bundle/`.

## Release

See [GitHub Releases](https://github.com/owergungor/Curry/releases) for published versions, release assets, and release notes.

## Architecture

- **Frontend**: Svelte 5, TypeScript, and Vite for a lightweight, reactive user interface.
- **Desktop Runtime**: Tauri 2 providing secure IPC and low-footprint native webviews.
- **Backend & Native Layer**: Rust handling OS notification listening, display coordinate management, atomic storage, and system tray integration.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
