---
description: Security boundaries for Tauri IPC commands and local storage
trigger: always_on
---

# Tauri IPC & Filesystem Security Guidelines

1. **IPC Surface Minimization**: Never expose unrestricted shell command execution or raw file write primitives over Tauri IPC.
2. **Path Sanitization**: All file read/write operations for settings and notifications must be strictly scoped to application directories. Prevent directory traversal attacks (`../`).
3. **Content Security Policy (CSP)**: Maintain strict CSP in `tauri.conf.json`:
   - `default-src 'self'`
   - `connect-src ipc: http://ipc.localhost`
   - Disallow external script execution.
4. **Secrets & Credentials**: Never hardcode API keys, signing passwords, or personal credentials into repository source files.
