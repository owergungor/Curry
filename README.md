# Curry

A modern Windows desktop notification enhancement application.

Curry listens for incoming Windows toast notifications and delivers elegant, ambient screen-edge glow effects, a searchable notification history feed, and deep Windows desktop integration — all with a strict 100% offline, privacy-first design.

---

## Overview

Windows notifications often disappear into the Action Center unnoticed while you are focused on work or media. **Curry** bridges this gap by rendering a hardware-accelerated, transparent screen-edge glow overlay whenever a notification arrives. In addition, Curry provides a searchable notification feed, customizable visual themes, granular per-app suppression rules, and background tray management.

---

## Features

- **Ambient Screen-Edge Glow**: Dynamic screen-border glow effects upon receiving any Windows desktop toast notification.
- **7 Curated Visual Themes**: Tailored dark-mode and aesthetic palettes with matching interface elements and glow swatches.
- **Searchable Notification History**: In-memory ring buffer backed by atomic local JSON persistence with full-text search, app filtering, and urgency sorting.
- **Smart Urgency Inference**: Privacy-preserving on-device keyword heuristic (Urgent / Warning / Normal) for notification categorization.
- **System Tray Management**: Clean minimize-to-tray lifecycle, live status indicators, quick toggle, and one-click access.
- **Windows Autostart Integration**: Windows startup registry management (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`) executed silently without command prompt flashes.
- **Single-Instance Protection**: Native Win32 named system mutex preventing duplicate instances while coordinating window focus.
- **Legacy Migration Engine**: Non-destructive automatic data migration from previous NotiGlow installations.
- **Zero Telemetry & 100% Offline**: Operates strictly on the local machine with no external network requests or analytics.

---

## Screenshots

<!-- Placeholder: Add screenshots here -->
```
+-----------------------------------------------------------------------+
|  CURRY                      [Search...]        (● Listening) [Theme]  |
+-----------------------------------------------------------------------+
|                                                                       |
|  [Notifications]   [Glow Settings]   [Rules]   [System]               |
|                                                                       |
|  • Slack          Important release update                   10:42 AM |
|  • GitHub         Pull request approved                      10:39 AM |
|  • Outlook        Team sync in 15 minutes                    10:30 AM |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Themes

Curry includes seven themes. **Perpetuity** is the default theme.

| Theme | Label | Description | Primary Colors |
|---|---|---|---|
| **Perpetuity** *(Default)* | Perpetuity | Precision obsidian slate & futuristic cyan-indigo glow | `#0b0f19`, `#121826`, `#6366f1`, `#38bdf8` |
| **Catppuccin** | Catppuccin Mocha | Soothing pastel palette with mauve & blue accents | `#1e1e2e`, `#181825`, `#cba6f7`, `#89b4fa` |
| **Vintage Paper** | Vintage Paper | Warm sepia & muted parchment for low eye strain | `#181614`, `#221f1c`, `#d4a373`, `#e09f67` |
| **Amethyst Haze** | Amethyst Haze | Deep midnight violet & luminous neon purple glow | `#0e0b16`, `#161224`, `#a855f7`, `#ec4899` |
| **Sage Mist** | Sage Mist | Calming eucalyptus slate with mint & emerald accents | `#0d1412`, `#131d1a`, `#10b981`, `#34d399` |
| **Bubblegum** | Bubblegum | High-energy retro cyberpunk pink & electric blue | `#120914`, `#1a0f1d`, `#f43f5e`, `#06b6d4` |
| **Amberstate** | Amberstate | Industrial dark charcoal with warm amber glow | `#14120e`, `#1c1914`, `#f59e0b`, `#fbbf24` |

---

## Glow System

The ambient glow system renders a transparent, click-through, always-on-top overlay around display borders:

- **Animation Styles**:
  - **Pulse**: Rhythmic breathing glow with smooth cubic-bezier easing.
  - **Breathing**: Slow, ambient luminosity expansion and relaxation.
  - **Ripple**: Edge-traveling wave animation.
  - **Solid**: Instant illumination with smooth alpha fadeout.
- **Customizable Dynamics**:
  - **Color**: Select from theme-matched palettes or custom hex codes.
  - **Duration**: Configurable from 500ms to 10,000ms.
  - **Border Thickness**: 1px to 32px edge footprint.
  - **Max Opacity**: 10% to 100% luminosity scaling.
- **Multi-Monitor Targeting**: Direct the glow overlay to the Primary Monitor or across All Displays.
- **Input Transparency**: The glow window uses Win32 click-through styles (`WS_EX_TRANSPARENT` / `skipTaskbar`), never intercepting mouse or keyboard input.

---

## Notification History

Curry captures and manages incoming desktop notifications:

- **Capture Pipeline**: Listens to Windows Action Center toasts via Microsoft WinRT `UserNotificationListener`.
- **Deduplication Engine**: Bounded hash-map with 15-minute TTL preventing duplicate alerts from repeated app updates or Action Center re-queries.
- **Search & Filters**: Instant full-text search across titles, message bodies, and application names.
- **Bounded Retention**: Stores up to 1,000 historical notifications in an in-memory ring buffer with automatic FIFO eviction.
- **Batch Operations**: Clear all history, dismiss individual items, or filter by source application.

---

## Windows Integration

Curry integrates with Windows desktop APIs:

- **WinRT UserNotificationListener**: Official modern Windows API (`Windows.UI.Notifications.Management`) for reading toasts without administrative elevation.
- **System Tray Icon**: Native system tray icon (`tauri::tray::TrayIcon`) with double-click window restore, status tooltips, and a context menu (Open, Pause/Resume, Quit).
- **Silent Startup Management**: Queries and writes to `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` using `reg.exe` with the `CREATE_NO_WINDOW` flag (`0x08000000`), guaranteeing no black command prompt popups during login.
- **Single-Instance Mutex**: Uses a named Win32 system mutex (`Global\Curry`) to enforce single-instance execution. Launching a secondary instance automatically brings the existing main window into focus and exits cleanly.

---

## Privacy

Curry is built with a local-only privacy architecture:

- **100% Offline**: No network calls, telemetry, analytics, or external cloud dependencies.
- **Strict Content Security Policy (CSP)**: Tauri CSP restricts network communication to local IPC only (`connect-src ipc: http://ipc.localhost`).
- **Local Data Storage**: All notification text, timestamps, application titles, and user preferences remain stored exclusively on your local machine in `%APPDATA%\com.curry.app\`.
- **Zero Third-Party Sharing**: No data is ever transmitted off your device.

---

## Architecture

```
Curry Application Architecture
─────────────────────────────────────────────────────────────────────────────
[ Windows Desktop Toasts ]
           │
           ▼
[ WinRT UserNotificationListener ] (windows crate 0.62)
           │
           ▼
[ WindowsNotificationProvider ] (Dedicated background thread + snapshot scan)
           │
           ▼
[ Deduplication Engine ] (SHA-256 / Content fingerprint + 15m TTL)
           │
           ▼
[ NotificationManager / Engine ] (Rust Backend)
     ├── AppState Gatekeeper (Dropped if paused)
     ├── Storage Engine (Atomic JSON write: .tmp → atomic rename)
     ├── GlowManager (Coordinates overlay lifecycle)
     └── Tauri Event Emitter ("notification-received", "state-changed")
           │
           ├──────────────────────────────┐
           ▼                              ▼
[ Svelte 5 Main Window ]       [ Transparent Glow Overlay ]
  - Top navigation bar           - /glow route
  - Dynamic theme engine         - CSS hardware acceleration
  - Notification history feed    - Always-on-top, click-through
  - Settings & Glow controls     - Multi-monitor support
─────────────────────────────────────────────────────────────────────────────
```

- **Frontend**: Svelte 5 + TypeScript + Vite. Reactive UI, theme engine, and virtualized feed.
- **Desktop Runtime**: Tauri 2. Lightweight WebView2 abstraction with low memory overhead.
- **Backend**: Rust. High-performance, memory-safe native thread management and Win32/WinRT interop.
- **IPC Layer**: Tauri 2 command invocation (`invoke`) and bi-directional event emission.

---

## Tech Stack

- **Tauri 2**: Cross-platform desktop application framework.
- **Rust**: Native backend, system hooks, concurrency, and persistence.
- **Svelte 5**: Modern reactive frontend UI framework.
- **TypeScript**: Static typing across all UI state and theme definitions.
- **Vite 6**: Fast frontend development server and production bundler.
- **Windows Runtime (WinRT) APIs**: `Windows.UI.Notifications.Management` via the `windows` crate (`v0.62`).
- **Windows System Tray**: Native tray management through Tauri 2 tray capabilities.
- **Atomic Local Persistence**: Safe file replacement (`.tmp` write followed by atomic rename) for zero data corruption risk.

---

## Requirements

- **Operating System**: Windows 10 (Version 1607+ / Build 14393+) or Windows 11.
- **Notification Access**: Windows Settings > Privacy & Security > Notifications must permit notification access.
- **Build Prerequisites**:
  - [Node.js](https://nodejs.org/) `20.x` or later (`22.x` / `24.x` recommended).
  - [Rust](https://www.rust-lang.org/) `1.85.0` or later with the `x86_64-pc-windows-msvc` target.
  - Microsoft C++ Build Tools (via Visual Studio Build Tools).
  - [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11).

---

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<owner>/curry.git
   cd curry
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Verify the Rust toolchain**:
   ```bash
   rustc --version
   cargo --version
   ```

---

## Running in Development

Start the Vite development server with Tauri hot-reloading:

```bash
npm run tauri dev
```

- The Svelte frontend runs at `http://localhost:1420` with instant HMR.
- The Rust backend compiles into `src-tauri/target/debug/` with automatic recompilation on changes.

---

## Building for Production

To build the optimized production executable and native Windows installers:

```bash
# 1. Type check and build frontend assets
npm run check
npm run build

# 2. Check and test the Rust backend
cd src-tauri
cargo check
cargo test
cargo build --release
cd ..

# 3. Create production installer packages (NSIS & MSI)
npm run tauri build
```

Production build outputs:
- **Optimized Binary**: `src-tauri/target/release/curry.exe`
- **NSIS Setup Installer**: `src-tauri/target/release/bundle/nsis/Curry_<version>_x64-setup.exe`
- **WiX MSI Package**: `src-tauri/target/release/bundle/msi/Curry_<version>_x64_en-US.msi`

---

## Testing

Run the automated test suite:

```bash
# Frontend Svelte and TypeScript diagnostic checks
npm run check

# Rust automated unit & integration test suite (39 tests)
cd src-tauri
cargo test
cd ..
```

---

## Project Structure

```
curry/
├── src/                          # Svelte 5 + TypeScript frontend
│   ├── lib/
│   │   └── themes.ts             # 7 theme definitions and color tokens
│   ├── routes/
│   │   ├── glow/
│   │   │   └── +page.svelte      # Transparent screen-edge glow overlay window
│   │   ├── +layout.ts            # SvelteKit SPA prerendering configuration
│   │   └── +page.svelte          # Main Curry dashboard, history feed & settings
│   └── app.html                  # HTML entry point
├── src-tauri/                    # Rust native application backend
│   ├── capabilities/
│   │   └── default.json          # Tauri 2 security capabilities
│   ├── icons/                    # Multi-resolution application icons
│   ├── src/
│   │   ├── glow/                 # Glow manager, models & storage
│   │   ├── notification/         # Notification engine, WinRT listener & storage
│   │   ├── settings/             # Settings state, startup manager & storage
│   │   ├── lib.rs                # Tauri command registration & legacy migration
│   │   ├── main.rs               # WinMain entry point & test suite
│   │   ├── single_instance.rs    # Win32 named system mutex implementation
│   │   ├── state.rs              # Thread-safe global application state
│   │   └── tray.rs               # System tray icon & context menu
│   ├── Cargo.toml                # Rust crate metadata & dependencies
│   ├── Cargo.lock                # Deterministic dependency lockfile
│   ├── build.rs                  # Tauri build hook
│   └── tauri.conf.json           # Tauri window, security & bundle configuration
├── static/                       # Static public assets (icons, SVGs)
├── .gitignore                    # Git exclusions for dependencies, builds & caches
├── package.json                  # NPM project metadata & build scripts
├── package-lock.json             # NPM lockfile
├── svelte.config.js              # SvelteKit static adapter configuration
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.js                # Vite bundler configuration
└── README.md                     # Project documentation
```

---

## Configuration

Curry stores configuration and state in `%APPDATA%\com.curry.app\`:

- `settings.json`: Master application preferences (startup toggle, notification sound, urgency filters).
- `glow_settings.json`: Glow animation configuration (style, color, duration, thickness, monitor target).
- `notifications.json`: Notification feed history (capped ring buffer).

All configuration writes use atomic temporary file replacement (`.tmp` → atomic rename) to guarantee file integrity even during abrupt shutdowns.

---

## Migration from Legacy Installations

For users upgrading from previous NotiGlow installations, Curry includes an automatic, non-destructive migration system:

1. **Automatic Data Migration**: On startup, Curry checks for existing data directories (`%APPDATA%\com.notiglow.app`, `%APPDATA%\notiglow`, `%APPDATA%\com.curry.desktop`). If found and valid JSON is verified, files are safely copied to `%APPDATA%\com.curry.app` without modifying the original legacy files.
2. **Startup Registry Migration**: Cleans up legacy `NotiGlow` and `GlowBorder` entries from `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` and registers `Curry`.
3. **Dual Mutex Co-locking**: On startup, Curry acquires `Global\Curry` while also locking `Global\NotiGlow` to prevent legacy and new instances from running concurrently.
4. **Theme Setting Fallback**: The frontend checks `localStorage.curry_selected_theme`, falling back gracefully to `notiglow_selected_theme` if present.

---

## License

No license file is currently present in this repository.

> **Recommendation**: The [MIT License](https://opensource.org/licenses/MIT) is recommended for Curry, allowing broad open-source adoption and distribution while protecting contributors.
> This repository remains unlicensed until an official LICENSE file is explicitly committed.
