import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translations } from "../src/lib/i18n/index.ts";
import { scanInstalledApps, getScanStatus, DEFAULT_IPC_TIMEOUT_MS } from "../src/lib/ipc.ts";

describe("Curry v3.1 — Auto App Scan Feature Contract", () => {
  const pagePath = path.resolve(process.cwd(), "src/routes/+page.svelte");
  const pageSource = fs.readFileSync(pagePath, "utf-8");

  test("1. Scan button is present in Applications view with Apple styling and loading state", () => {
    assert.ok(pageSource.includes('id="scan-applications-btn"'), "Scan button id missing");
    assert.ok(pageSource.includes("onclick={triggerAppScan}"), "Scan button onclick missing");
    assert.ok(pageSource.includes("disabled={isScanningApps}"), "Scan button disabled guard missing");
    assert.ok(pageSource.includes("aria-busy={isScanningApps}"), "Scan button aria-busy missing");
    assert.ok(pageSource.includes("isScanningApps ? 'spin' : ''"), "Scan button spin icon missing");
    assert.ok(pageSource.includes("t('apps.scan_btn')"), "Scan button label missing");
  });

  test("2. Duplicate scan click protection is enforced in triggerAppScan", () => {
    assert.ok(
      pageSource.includes("if (isScanningApps) return;"),
      "Duplicate scan guard missing in triggerAppScan"
    );
    assert.ok(
      pageSource.includes("isScanningApps = true;"),
      "Scanning flag activation missing"
    );
    assert.ok(
      pageSource.includes("finally {\n      isScanningApps = false;\n    }") ||
      pageSource.includes("finally {\r\n      isScanningApps = false;\r\n    }"),
      "Guaranteed finally reset of isScanningApps missing"
    );
  });

  test("3. Scan status banner displays localized results and auto-dismisses", () => {
    assert.ok(
      pageSource.includes("scanStatusBanner = {"),
      "scanStatusBanner update missing"
    );
    assert.ok(
      pageSource.includes("apps.new_apps_found"),
      "New apps found translation missing in triggerAppScan"
    );
    assert.ok(
      pageSource.includes("apps.no_new_apps"),
      "No new apps translation missing in triggerAppScan"
    );
    assert.ok(
      pageSource.includes("scan-status-banner"),
      "scan-status-banner class missing in template"
    );
  });

  test("4. Auto App Scan setting toggle and frequency dropdown exist in Settings view", () => {
    assert.ok(
      pageSource.includes('id="auto-app-scan-switch"'),
      "Auto app scan switch missing"
    );
    assert.ok(
      pageSource.includes("appSettings.auto_app_scan_enabled"),
      "auto_app_scan_enabled binding missing"
    );
    assert.ok(
      pageSource.includes('id="auto-scan-frequency-dropdown"'),
      "Auto scan frequency dropdown missing"
    );
    assert.ok(
      pageSource.includes("appSettings.auto_app_scan_frequency"),
      "auto_app_scan_frequency binding missing"
    );
    assert.ok(
      pageSource.includes("disabled={!(appSettings.auto_app_scan_enabled ?? false)}"),
      "Frequency dropdown disable guard missing"
    );
  });

  test("5. Real-time background scan event listener (apps-scanned) is attached in onMount", () => {
    assert.ok(
      pageSource.includes('listen<ScanResult>("apps-scanned"'),
      "apps-scanned event listener missing in onMount"
    );
    assert.ok(
      pageSource.includes("unlistenAppsScannedPromise.then"),
      "unlisten cleanup missing in onMount return"
    );
  });

  test("6. IPC module exports scanInstalledApps and getScanStatus helpers with safe timeouts", () => {
    assert.equal(typeof scanInstalledApps, "function");
    assert.equal(typeof getScanStatus, "function");
    assert.equal(DEFAULT_IPC_TIMEOUT_MS, 10000);
  });

  test("7. All 5 supported languages have complete Auto App Scan translations", () => {
    const requiredKeys = [
      "apps.scan_btn",
      "apps.scanning",
      "apps.scan_completed",
      "apps.new_apps_found",
      "apps.no_new_apps",
      "apps.scan_error",
      "settings.auto_scan_title",
      "settings.auto_scan_desc",
      "settings.auto_scan_frequency",
      "settings.auto_scan_frequency_desc",
    ];

    const locales = ["en", "es", "fr", "de", "tr"] as const;

    for (const loc of locales) {
      const dict = translations[loc] as Record<string, string>;
      assert.ok(dict, `Locale ${loc} missing in translations`);
      for (const k of requiredKeys) {
        assert.ok(
          dict[k] && dict[k].trim().length > 0,
          `Key '${k}' missing or empty in locale '${loc}'`
        );
      }
    }
  });
});
