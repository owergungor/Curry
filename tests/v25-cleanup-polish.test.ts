import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { t, setLanguage, translations, type SupportedLocale } from "../src/lib/i18n/index.ts";

const LOCALES: SupportedLocale[] = ["en", "tr", "de", "fr", "es"];

describe("Curry v2.5 — i18n Completeness & Quality", () => {
  it("Every language has explicit translations for all required v2.5 keys", () => {
    const requiredKeys = [
      "glow.preview_btn",
      "settings.themes",
      "notifications.empty_history_title",
      "notifications.empty_history_desc",
      "notifications.empty_unread_title",
      "notifications.empty_unread_desc",
      "notifications.empty_priority_title",
      "notifications.empty_priority_desc",
      "notifications.marking",
      "notifications.no_title",
      "notifications.no_body",
      "updater.title",
      "updater.desc",
      "updater.auto_updates",
      "updater.auto_updates_desc",
      "updater.check_frequency",
      "updater.check_frequency_desc",
      "status.default",
      "status.perpetuity",
      "apps.previewing",
    ];

    for (const locale of LOCALES) {
      setLanguage(locale);
      for (const key of requiredKeys) {
        const val = t(key);
        assert.ok(val, `Key '${key}' returned empty value in locale '${locale}'`);
        assert.notEqual(val, key, `Key '${key}' leaked raw key string in locale '${locale}'`);
        assert.ok(
          !val.startsWith("notifications.") &&
            !val.startsWith("glow.") &&
            !val.startsWith("settings.") &&
            !val.startsWith("updater.") &&
            !val.startsWith("apps.") &&
            !val.startsWith("status."),
          `Key '${key}' appears to leak a raw namespace prefix in locale '${locale}': '${val}'`
        );
      }
    }
  });

  it("All t('...') keys referenced across src/ exist in all 5 supported languages", () => {
    const srcDir = path.resolve("src");
    const foundKeys = new Set<string>();

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".svelte") || entry.name.endsWith(".ts")) {
          const content = fs.readFileSync(fullPath, "utf8");
          const matches = content.matchAll(/\bt\(\s*["']([^"'\s]+)["']/g);
          for (const m of matches) {
            const key = m[1];
            if (!key.includes("${") && !key.endsWith(".")) {
              foundKeys.add(key);
            }
          }
        }
      }
    }

    scanDir(srcDir);
    assert.ok(foundKeys.size > 20, `Expected scan to find keys, found ${foundKeys.size}`);

    const missingPerLocale: Record<string, string[]> = {};
    for (const locale of LOCALES) {
      missingPerLocale[locale] = [];
      const dict = translations[locale];
      for (const key of foundKeys) {
        if (!dict[key]) {
          missingPerLocale[locale].push(key);
        }
      }
    }

    for (const locale of LOCALES) {
      assert.deepEqual(
        missingPerLocale[locale],
        [],
        `Locale '${locale}' is missing translations for keys: ${missingPerLocale[locale].join(", ")}`
      );
    }
  });

  it("t() provides humanized fallbacks rather than leaking raw dotted key strings", () => {
    setLanguage("en");
    const fallback = t("test_category.some_action_btn");
    assert.equal(fallback, "Some Action Btn");
    assert.ok(!fallback.includes("test_category."));
  });
});

describe("Curry v2.5 — Dropdown Single Panel & Accessibility", () => {
  const dropdownPath = path.resolve("src/lib/components/Dropdown.svelte");
  const dropdownSource = fs.readFileSync(dropdownPath, "utf8");

  it("Dropdown panel has no nested scrollbar or fixed max-height: 280px", () => {
    assert.ok(
      !dropdownSource.includes("max-height: 280px"),
      "Dropdown should not have arbitrary 280px max-height cap"
    );
    assert.ok(
      !dropdownSource.includes("overflow-y: auto"),
      "Dropdown should not introduce nested internal scrollbars"
    );
    assert.ok(
      dropdownSource.includes("open-upward"),
      "Dropdown should support upward positioning when near viewport bottom"
    );
  });

  it("Dropdown outside-click mousedown listener is attached only while isOpen", () => {
    assert.ok(
      dropdownSource.includes("$effect(() => {"),
      "Dropdown must manage document listener via reactive $effect"
    );
    assert.ok(
      dropdownSource.includes('document.addEventListener("mousedown", handleClickOutside)'),
      "Dropdown must attach outside-click handler"
    );
    assert.ok(
      dropdownSource.includes('document.removeEventListener("mousedown", handleClickOutside)'),
      "Dropdown must clean up outside-click handler"
    );
  });

  it("Dropdown preserves keyboard accessibility and escape key dismissal", () => {
    assert.ok(dropdownSource.includes('"Escape"'), "Must handle Escape key");
    assert.ok(dropdownSource.includes('"ArrowDown"'), "Must handle ArrowDown key");
    assert.ok(dropdownSource.includes('"ArrowUp"'), "Must handle ArrowUp key");
    assert.ok(dropdownSource.includes('role="listbox"'), "Must declare listbox role");
    assert.ok(dropdownSource.includes('role="option"'), "Must declare option role");
  });
});

describe("Curry v2.5 — Memory & Lifecycle Cleanup", () => {
  const pagePath = path.resolve("src/routes/+page.svelte");
  const pageSource = fs.readFileSync(pagePath, "utf8");

  it("+page.svelte startup IPC calls are deduplicated", () => {
    const duplicatePattern = /checkConnection\(\);\s*fetchAppSettings\(\);/;
    assert.ok(
      !duplicatePattern.test(pageSource),
      "checkConnection() must not be immediately followed by redundant individual fetch calls"
    );
  });

  it("+page.svelte unmount clears all active timers", () => {
    assert.ok(pageSource.includes("pipelineThrottleTimer = null"), "pipelineThrottleTimer must be cleared");
    assert.ok(pageSource.includes("saveDebounceTimer = null"), "saveDebounceTimer must be cleared");
    assert.ok(pageSource.includes("settingsErrorTimer = null"), "settingsErrorTimer must be cleared");
    assert.ok(pageSource.includes("glowTimeout = null"), "glowTimeout must be cleared");
    assert.ok(pageSource.includes("profileGlowTimeout = null"), "profileGlowTimeout must be cleared");
  });

  it("+page.svelte unlistens to all registered event listeners on unmount", () => {
    assert.ok(pageSource.includes("unlistenStatePromise.then("), "Must unlisten to state changes");
    assert.ok(pageSource.includes("unlistenSettingsPromise.then("), "Must unlisten to settings updates");
    assert.ok(pageSource.includes("unlistenNotifPromise.then("), "Must unlisten to notification-received");
    assert.ok(pageSource.includes("unlistenAllReadPromise.then("), "Must unlisten to notifications-all-read");
    assert.ok(pageSource.includes("unlistenReadStatusPromise.then("), "Must unlisten to read-status-changed");
    assert.ok(pageSource.includes("unlistenGlowFinishedPromise.then("), "Must unlisten to glow-finished");
  });

  it("ColorPicker attaches keydown/mousedown listeners only while open and clears copy timer", () => {
    const cpPath = path.resolve("src/lib/ColorPicker.svelte");
    const cpSource = fs.readFileSync(cpPath, "utf8");
    assert.ok(cpSource.includes("copyTimer"), "Must track copy timer");
    assert.ok(cpSource.includes("clearTimeout(copyTimer)"), "Must clean up copy timer on unmount");
    assert.ok(
      !cpSource.includes("<svelte:window onkeydown"),
      "Must not keep a permanent window keydown listener while closed"
    );
  });

  it("Rust glow manager avoids duplicate event emission per window", () => {
    const glowPath = path.resolve("src-tauri/src/glow/manager.rs");
    const glowSource = fs.readFileSync(glowPath, "utf8");
    assert.ok(
      !glowSource.includes('window.emit("trigger-glow", payload)'),
      "Should not emit duplicate trigger-glow event on window instance when emit_to is used"
    );
  });

  it("Rust lib.rs unifies notification read status changes", () => {
    const libPath = path.resolve("src-tauri/src/lib.rs");
    const libSource = fs.readFileSync(libPath, "utf8");
    assert.ok(
      !libSource.includes('app.emit("notification-read-updated"'),
      "Should not emit legacy redundant notification-read-updated"
    );
    assert.ok(
      !libSource.includes('app.emit("notification-unread-updated"'),
      "Should not emit legacy redundant notification-unread-updated"
    );
    assert.ok(
      libSource.includes('app.emit("notification-read-status-changed"'),
      "Should emit unified notification-read-status-changed"
    );
  });
});
