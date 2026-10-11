---
description: Security boundaries for Tauri IPC commands, filesystem access, CSP, and credentials
trigger: always_on
---

# Tauri IPC & Filesystem Security Guidelines

Authoritative policy: [SECURITY_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/SECURITY_POLICY.md)

1. **IPC Surface Minimization**: Never expose unrestricted shell command execution or raw arbitrary file write primitives over Tauri IPC. All commands must use typed parameters and structured error mapping.
2. **Path Sanitization**: All file read/write operations for settings, profiles, and notifications must be strictly scoped to application directories (`com.curry.app`). Prevent directory traversal attacks (`../`).
3. **Content Security Policy (CSP)**: Maintain strict CSP in `tauri.conf.json`:
   - `default-src 'self'`
   - `connect-src ipc: http://ipc.localhost`
   - `img-src 'self' asset: http://asset.localhost`
   - Disallow external script execution.
4. **Secrets & Credentials**: Never hardcode API keys, signing passwords, private keys, or personal credentials into repository source files, commits, or logs.
