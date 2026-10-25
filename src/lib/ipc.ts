import { invoke as tauriInvoke, type InvokeArgs } from "@tauri-apps/api/core";

export const DEFAULT_IPC_TIMEOUT_MS = 10000;

/**
 * Invokes a Tauri backend command with guaranteed timeout protection.
 * If the native backend fails to respond within `timeoutMs`, the returned promise
 * rejects with a descriptive Error, preventing the UI action lifecycle from hanging.
 */
export async function safeInvoke<T>(
  cmd: string,
  args?: InvokeArgs,
  timeoutMs: number = DEFAULT_IPC_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Curry IPC command '${cmd}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const invokePromise =
      typeof globalThis !== "undefined" &&
      (globalThis as any).window?.__TAURI_INTERNALS__?.invoke
        ? (globalThis as any).window.__TAURI_INTERNALS__.invoke(cmd, args)
        : tauriInvoke<T>(cmd, args);

    const result = await Promise.race([invokePromise, timeoutPromise]);
    return result as T;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export interface DiscoveredApp {
  name: string;
  executableName: string;
  executablePath?: string | null;
  iconPath?: string | null;
  source: string;
  isNew: boolean;
}

export interface ScanResult {
  totalFound: number;
  newAdded: number;
  alreadyExisting: number;
  discoveredApps: DiscoveredApp[];
  timestamp: number;
}

export interface ScanStatus {
  state: "idle" | "scanning" | "completed" | "failed";
  progressMessage?: string | null;
  lastResult?: ScanResult | null;
  error?: string | null;
}

export async function scanInstalledApps(): Promise<ScanResult> {
  return safeInvoke<ScanResult>("scan_installed_apps", undefined, 30000);
}

export async function getScanStatus(): Promise<ScanStatus> {
  return safeInvoke<ScanStatus>("get_scan_status", undefined, 5000);
}
