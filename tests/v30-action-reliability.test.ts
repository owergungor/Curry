import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { safeInvoke, DEFAULT_IPC_TIMEOUT_MS } from "../src/lib/ipc.ts";

describe("Curry v3.0 — Action & IPC Reliability Contract", () => {
  beforeEach(() => {
    if (typeof (globalThis as any).window === "undefined") {
      (globalThis as any).window = globalThis;
    }
  });

  it("1. safeInvoke: enforces default 10s timeout constant", () => {
    assert.equal(DEFAULT_IPC_TIMEOUT_MS, 10000);
  });

  it("2. safeInvoke: rejects with descriptive timeout error if backend hangs", async () => {
    (globalThis as any).window.__TAURI_INTERNALS__ = {
      invoke: () => new Promise(() => {}), // never resolves
    };

    const start = Date.now();
    try {
      await safeInvoke("slow_command", {}, 80);
      assert.fail("safeInvoke should have timed out");
    } catch (err: any) {
      const elapsed = Date.now() - start;
      assert.ok(elapsed >= 70, `Should have waited close to 80ms, took ${elapsed}ms`);
      assert.ok(
        err.message.includes("slow_command") && err.message.includes("timed out"),
        `Error message should mention command name and timeout: ${err.message}`
      );
    }
  });

  it("3. safeInvoke: resolves promptly when command finishes normally", async () => {
    (globalThis as any).window.__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: any) => ({ success: true, cmd, args }),
    };

    const res: any = await safeInvoke("fast_command", { foo: "bar" }, 2000);
    assert.equal(res.success, true);
    assert.equal(res.cmd, "fast_command");
    assert.deepEqual(res.args, { foo: "bar" });
  });

  it("4. UI Action Audit: all major actions in +page.svelte use safeInvoke or guaranteed finally", () => {
    const pagePath = path.resolve("src/routes/+page.svelte");
    const content = fs.readFileSync(pagePath, "utf8");

    // All critical operations must use safeInvoke
    assert.ok(content.includes('safeInvoke("preview_global_glow")'), "previewDefaultGlow must use safeInvoke");
    assert.ok(
      content.includes('safeInvoke<Notification>("send_test_notification")') ||
        content.includes('safeInvoke("send_test_notification")'),
      "sendTestNotification must use safeInvoke"
    );
    assert.ok(content.includes('safeInvoke("mark_all_notifications_as_read")'), "markAllNotificationsAsRead must use safeInvoke");
    assert.ok(content.includes('safeInvoke("clear_notifications")'), "confirmClearAll must use safeInvoke");
    assert.ok(content.includes('safeInvoke<ConnectionInfo>("check_backend_connection")'), "checkConnection must use safeInvoke");
    assert.ok(content.includes('safeInvoke<boolean>("toggle_app_state")'), "toggleAppState must use safeInvoke");
    assert.ok(content.includes('safeInvoke<boolean>("set_startup_status"'), "toggleStartup must use safeInvoke");
    assert.ok(content.includes('safeInvoke("play_sound_preview")'), "testSoundAlert must use safeInvoke");
    assert.ok(content.includes('safeInvoke("dismiss_notification"'), "removeNotification must use safeInvoke");
    assert.ok(content.includes('safeInvoke<ApplicationProfile>("save_application_profile"'), "saveProfile must use safeInvoke");
    assert.ok(content.includes('safeInvoke("delete_application_profile"'), "deleteProfile must use safeInvoke");

    // Guaranteed finally blocks
    assert.ok(content.includes("isSendingTest = false;"), "isSendingTest must reset in finally");
    assert.ok(content.includes("isMarkingAllRead = false;"), "isMarkingAllRead must reset in finally");
    assert.ok(content.includes("isClearing = false;"), "isClearing must reset in finally");
    assert.ok(content.includes("isToggling = false;"), "isToggling must reset in finally");
    assert.ok(content.includes("isPinging = false;"), "isPinging must reset in finally");
  });

  it("5. Overlay Threading Safety: dispatch_overlay must never block caller thread", () => {
    const managerPath = path.resolve("src-tauri/src/glow/manager.rs");
    const managerCode = fs.readFileSync(managerPath, "utf8");

    assert.ok(
      managerCode.includes("std::thread::spawn(move ||"),
      "dispatch_overlay must offload WebView2 overlay creation to a dedicated OS thread to prevent STA deadlock"
    );
  });
});

describe("Curry v3.0 — Update Notification Toast Contract", () => {
  it("1. UpdateToast component exists and adheres to design system", () => {
    const toastPath = path.resolve("src/lib/components/UpdateToast.svelte");
    assert.ok(fs.existsSync(toastPath), "UpdateToast.svelte component must exist");

    const code = fs.readFileSync(toastPath, "utf8");
    assert.ok(code.includes('role="alert"'), "Toast must have role='alert'");
    assert.ok(code.includes('aria-live="polite"'), "Toast must have aria-live='polite'");
    assert.ok(code.includes("toastSlideIn"), "Toast must have slide-in animation");
    assert.ok(code.includes("prefers-reduced-motion"), "Toast must respect reduced motion");
    assert.ok(code.includes("handleKeydown"), "Toast must handle Escape key dismiss");
    assert.ok(code.includes("onUpdate"), "Toast must handle update trigger");
    assert.ok(code.includes("onDismiss"), "Toast must handle dismiss trigger");
  });

  it("2. UpdateToast is registered and exported from components index", () => {
    const indexPath = path.resolve("src/lib/components/index.ts");
    const content = fs.readFileSync(indexPath, "utf8");

    assert.ok(
      content.includes('export { default as UpdateToast } from "./UpdateToast.svelte";'),
      "UpdateToast must be exported from $lib/components"
    );
  });

  it("3. UpdateToast translations exist across all 5 official languages", () => {
    const i18nPath = path.resolve("src/lib/i18n/index.ts");
    const content = fs.readFileSync(i18nPath, "utf8");

    assert.ok(content.includes("'updater.toast_title': \"Update Available\""), "en toast_title must exist");
    assert.ok(content.includes("'updater.toast_title': \"Actualización Disponible\""), "es toast_title must exist");
    assert.ok(content.includes("'updater.toast_title': \"Mise à jour disponible\""), "fr toast_title must exist");
    assert.ok(content.includes("'updater.toast_title': \"Update verfügbar\""), "de toast_title must exist");
    assert.ok(content.includes("'updater.toast_title': \"Yeni Güncelleme Mevcut\""), "tr toast_title must exist");

    assert.ok(content.includes("'updater.toast_update': \"Update Now\""), "en toast_update must exist");
    assert.ok(content.includes("'updater.toast_update': \"Güncelle\""), "tr toast_update must exist");

    assert.ok(content.includes("'updater.toast_dismiss': \"Dismiss\""), "en toast_dismiss must exist");
    assert.ok(content.includes("'updater.toast_dismiss': \"Kapat\""), "tr toast_dismiss must exist");
  });

  it("4. UpdateToast is mounted in main application view", () => {
    const pagePath = path.resolve("src/routes/+page.svelte");
    const content = fs.readFileSync(pagePath, "utf8");

    assert.ok(content.includes("<UpdateToast"), "UpdateToast must be rendered in +page.svelte");
    assert.ok(content.includes("updateToastDismissed"), "updateToastDismissed flag must govern toast visibility");
  });
});
