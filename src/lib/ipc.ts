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
