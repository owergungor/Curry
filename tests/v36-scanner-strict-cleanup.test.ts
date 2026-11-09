import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Curry v3.6 — Scanner Strict Cleanup & Profile Sanitization Contract", () => {
  const classificationPath = path.resolve(process.cwd(), "src-tauri/src/scanner/classification.rs");
  const winScannerPath = path.resolve(process.cwd(), "src-tauri/src/scanner/platform/windows.rs");
  const settingsModelPath = path.resolve(process.cwd(), "src-tauri/src/settings/model.rs");
  const settingsStoragePath = path.resolve(process.cwd(), "src-tauri/src/settings/storage.rs");
  const scannerModPath = path.resolve(process.cwd(), "src-tauri/src/scanner/mod.rs");

  const classificationSource = fs.readFileSync(classificationPath, "utf-8");
  const winScannerSource = fs.readFileSync(winScannerPath, "utf-8");
  const settingsModelSource = fs.readFileSync(settingsModelPath, "utf-8");
  const settingsStorageSource = fs.readFileSync(settingsStoragePath, "utf-8");
  const scannerModSource = fs.readFileSync(scannerModPath, "utf-8");

  test("1. Architectural classification module exists and is decoupled from platform specifics", () => {
    assert.ok(fs.existsSync(classificationPath), "classification.rs must exist");
    assert.ok(classificationSource.includes("pub fn is_invalid_system_profile"), "is_invalid_system_profile must be defined");
    assert.ok(classificationSource.includes("pub fn is_resource_based_name"), "is_resource_based_name must be defined");
    assert.ok(classificationSource.includes("pub fn is_system_app_path"), "is_system_app_path must be defined");
    assert.ok(classificationSource.includes("pub fn is_blacklisted_executable"), "is_blacklisted_executable must be defined");
  });

  test("2. Excludes all screenshot regression examples", () => {
    // AppResolverUX
    assert.ok(classificationSource.includes("appresolverux"), "appresolverux must be excluded");
    // Microsoft.AAD.BrokerPlugin
    assert.ok(classificationSource.includes("brokerplugin"), "brokerplugin must be excluded");
    // AccountsControlHost
    assert.ok(classificationSource.includes("accountscontrolhost"), "accountscontrolhost must be excluded");
    // PinningConfirmationDialog
    assert.ok(classificationSource.includes("pinningconfirmationdialog"), "pinningconfirmationdialog must be excluded");
    // Microsoft.AsyncTextService
    assert.ok(classificationSource.includes("asynctextservice"), "asynctextservice must be excluded");
    // NVIDIA Container
    assert.ok(classificationSource.includes("nvcontainer.exe"), "nvcontainer.exe must be blacklisted");
    assert.ok(classificationSource.includes("nvidia container"), "nvidia container name must be excluded");
    // NVIDIA FrameView SDK
    assert.ok(classificationSource.includes("nvfvsdksvc"), "nvfvsdksvc must be blacklisted");
    assert.ok(classificationSource.includes("frameview sdk"), "frameview sdk must be excluded");
  });

  test("3. Path-based system app exclusion prevents scanning C:\\Windows\\SystemApps", () => {
    assert.ok(classificationSource.includes("systemapps"), "Windows SystemApps path check missing");
    assert.ok(winScannerSource.includes("is_system_app_path"), "Windows scanner must check is_system_app_path");
  });

  test("4. Registry scanner prevents DLL-based DisplayIcon and background service fallback", () => {
    assert.ok(winScannerSource.includes('.ends_with(".dll")'), "Registry scanner must reject DLL DisplayIcons");
    assert.ok(winScannerSource.includes("is_system_app_path(clean)"), "Registry InstallLocation must reject system app paths");
    assert.ok(winScannerSource.includes("is_invalid_system_profile"), "Registry scan must validate resolved executable");
  });

  test("5. Microsoft Store package scanning rejects synthetic names for unlisted packages", () => {
    // When a package has no user-facing display name, process_store_package_key must return instead of inventing synthetic names
    assert.ok(winScannerSource.includes("// Do NOT create synthetic profile names for packages that lack a human-facing display name"), "Synthetic profile creation must be disabled");
    assert.ok(winScannerSource.includes("is_system_app_path(&root_folder)"), "Must reject packages in SystemApps folders");
  });

  test("6. Settings profile sanitization purges invalid profiles on load and save", () => {
    assert.ok(settingsModelSource.includes("is_invalid_system_profile"), "AppSettings::sanitized must invoke is_invalid_system_profile");
    assert.ok(settingsModelSource.includes("self.applications.retain"), "AppSettings::sanitized must retain only valid profiles");
    assert.ok(settingsStorageSource.includes("sanitized.applications.len() != loaded_app_count"), "SettingsStorage must auto-persist sanitized profiles on load");
    assert.ok(scannerModSource.includes("is_invalid_system_profile"), "execute_app_scan must purge invalid system profiles");
  });
});
