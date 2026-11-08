import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translations } from "../src/lib/i18n/index.ts";
import * as ipc from "../src/lib/ipc.ts";

describe("Curry v3.5 — Scanner Cleanup, Icon Refresh & Precise Location Removal Contract", () => {
  const winScannerPath = path.resolve(process.cwd(), "src-tauri/src/scanner/platform/windows.rs");
  const winScannerSource = fs.readFileSync(winScannerPath, "utf-8");

  test("1. Scanner rejects resource-based names (@{...} and ms-resource:)", () => {
    assert.ok(winScannerSource.includes("fn is_resource_based_name"), "is_resource_based_name helper missing");
    assert.ok(winScannerSource.includes('trimmed.starts_with("@{")'), "Rejection of @{ missing");
    assert.ok(winScannerSource.includes('trimmed.starts_with("ms-resource:")'), "Rejection of ms-resource missing");
  });

  test("2. Scanner excludes system store packages and internal brokers", () => {
    assert.ok(winScannerSource.includes("fn is_system_store_package"), "is_system_store_package helper missing");
    assert.ok(winScannerSource.includes("microsoft.aad.brokerplugin"), "microsoft.aad.brokerplugin blacklist missing");
    assert.ok(winScannerSource.includes("appresolverux"), "appresolverux blacklist missing");
    assert.ok(winScannerSource.includes("windowsappruntime"), "windowsappruntime blacklist missing");
    assert.ok(winScannerSource.includes("accountscontrolhost"), "accountscontrolhost blacklist missing");
    assert.ok(winScannerSource.includes("shellexperiencehost"), "shellexperiencehost blacklist missing");
  });

  test("3. Scanner checks Framework and ResourcePackage manifests", () => {
    assert.ok(winScannerSource.includes("fn is_framework_or_resource_manifest"), "is_framework_or_resource_manifest missing");
    assert.ok(winScannerSource.includes("<framework>true</framework>"), "Framework manifest check missing");
    assert.ok(winScannerSource.includes("<resourcepackage>true</resourcepackage>"), "ResourcePackage manifest check missing");
  });

  test("4. Scanner rejects non-launchable AppListEntry='none' applications", () => {
    assert.ok(winScannerSource.includes("fn is_unlisted_app_entry"), "is_unlisted_app_entry helper missing");
    assert.ok(winScannerSource.includes("applistentry"), "AppListEntry check missing");
    assert.ok(winScannerSource.includes('none'), "none entry check missing");
  });

  test("5. Scanner checks SystemComponent and ParentKeyName in registry entries", () => {
    assert.ok(winScannerSource.includes('"SystemComponent"'), "SystemComponent check missing");
    assert.ok(winScannerSource.includes('"ParentKeyName"'), "ParentKeyName check missing");
  });

  test("6. Precise location feature is completely eradicated from backend and frontend", () => {
    const locationFileExists = fs.existsSync(path.resolve(process.cwd(), "src-tauri/src/location.rs"));
    assert.equal(locationFileExists, false, "location.rs must be deleted");

    const tauriLibSource = fs.readFileSync(path.resolve(process.cwd(), "src-tauri/src/lib.rs"), "utf-8");
    assert.ok(!tauriLibSource.includes("get_precise_location"), "get_precise_location command still registered in lib.rs");
    assert.ok(!tauriLibSource.includes("pub mod location;"), "location module still declared in lib.rs");

    // Check ipc.ts
    assert.equal((ipc as any).getPreciseLocation, undefined, "getPreciseLocation still exported in ipc.ts");

    // Check translations in all languages
    for (const [lang, dict] of Object.entries(translations)) {
      assert.equal((dict as any)["settings.location_title"], undefined, `location_title still exists in ${lang}`);
      assert.equal((dict as any)["settings.get_location_btn"], undefined, `get_location_btn still exists in ${lang}`);
    }

    // Check +page.svelte
    const pageSource = fs.readFileSync(path.resolve(process.cwd(), "src/routes/+page.svelte"), "utf-8");
    assert.ok(!pageSource.includes("location-card"), "location-card still in +page.svelte");
    assert.ok(!pageSource.includes("fetchExactLocation"), "fetchExactLocation still in +page.svelte");
    assert.ok(!pageSource.includes("getPreciseLocation"), "getPreciseLocation still imported in +page.svelte");
  });
});
