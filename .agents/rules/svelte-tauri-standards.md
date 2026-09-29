---
description: Frontend and Tauri IPC coding standards
trigger: always_on
---

# Svelte 5 and Tauri IPC Standards

## 1. Svelte 5 Runes & Reactivity
- Use modern Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) instead of legacy Svelte 3/4 stores where applicable.
- Keep UI primitives modular in `src/lib/components/` (Button, Slider, Modal, Dropdown, Tabs, ThemeSelector, Skeleton, ColorPicker).
- Maintain CSS token architecture and dark/light/system theme isolation. Never overwrite user glow preferences during theme toggles.

## 2. Tauri IPC Conventions
- Commands must return typed `Result<T, String>` or structured models.
- Avoid blocking the async runtime in command handlers; use `tokio::task::spawn_blocking` for heavy synchronous operations.
- State mutation must be synchronized via thread-safe abstractions (`Arc<RwLock<AppState>>` or atomic primitives).
- Event names between Rust and Svelte must be standardized (`app-state-changed`, `window-restored`, `glow-preview-trigger`).
