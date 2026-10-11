# Curry — Desktop Security & IPC Policy

## 1. IPC Surface Minimization
- **Strict Command Registry**: All Tauri command handlers (`#[tauri::command]`) must be explicitly declared and registered in `src-tauri/src/lib.rs`.
- **No Unrestricted Execution**: Never expose shell execution, arbitrary process spawning, or raw filesystem write primitives over Tauri IPC.
- **Typed Input Validation & Error Handling**: All IPC input parameters must be strongly typed with Serde. Return structured, sanitized error models via `Result<T, String>` without leaking system paths or internal runtime exceptions.

## 2. Filesystem & Path Sanitization
- **Scoped Storage**: All local data persistence (notifications, settings, profiles) must be strictly confined to Curry's application data directory (`com.curry.app` / `%APPDATA%\com.curry.app`).
- **Traversal Defense**: Reject any path argument containing `..`, directory traversal patterns, or absolute paths outside the designated sandbox.
- **Atomic Operations**: Settings and profile writes must write to a temporary file before atomically renaming to prevent corruption during sudden system shutdowns.

## 3. Content Security Policy (CSP)
Maintain a strict CSP in `src-tauri/tauri.conf.json`:
```text
default-src 'self'; connect-src ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'
```
- Disallow loading scripts or styles from remote network endpoints.
- Webviews must operate with local assets and IPC connections only.

## 4. Secrets, Credentials & Privacy
- **Zero Credentials in Code**: Never commit API keys, signing passwords, private keys, or personal tokens to Git repository files or logs.
- **Zero Telemetry**: Curry is 100% offline and local-first. No analytics, tracking beacons, or telemetry endpoints may be introduced.
- **Diagnostic Sanitization**: Diagnostic exports and error logs must pass through `redactSensitiveString()` to redact user directories, tokens, and authorization headers.

## 5. Updater Signing & Release Security
- **Minisign Verification**: The Tauri updater public key is committed to `tauri.conf.json`. Releases must never be published with unverified or forged updater manifests.
- **Explicit Signing Policy in CI**:
  - In tagged release workflows, if the private signing key (`TAURI_SIGNING_PRIVATE_KEY`) is present, updater manifests (`latest.json`, `.sig`) are generated and signed.
  - If credentials are absent, the CI logs an explicit warning and does not publish forged or empty signature files.
