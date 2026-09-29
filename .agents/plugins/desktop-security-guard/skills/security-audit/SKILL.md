---
name: security-audit
description: Audits IPC commands, dependencies, and CSP configuration for security vulnerabilities.
---

# Security Audit Protocol

1. Audit cargo dependencies for known CVEs:
   ```powershell
   cargo audit # if installed, or review Cargo.lock updates
   ```
2. Audit npm packages:
   ```powershell
   npm audit
   ```
3. Inspect `src-tauri/tauri.conf.json` security block:
   Verify CSP rules and disable unused Tauri permissions.
4. Verify file permission masks on sensitive settings files.
