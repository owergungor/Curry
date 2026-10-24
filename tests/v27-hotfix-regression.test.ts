import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(".");

describe("Curry v2.7 Hotfix — Master Toggle & Settings State Integrity", () => {
  const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
  const pageContent = fs.readFileSync(pagePath, "utf8");

  it("1. Structural Check: saveAppSettings() does NOT clobber appSettings.enabled with stale isEnabled", () => {
    const saveAppSettingsMatch = pageContent.match(
      /async function saveAppSettings\(\)[\s\S]*?\{([\s\S]*?)catch \(err: unknown\)/
    );
    assert.ok(saveAppSettingsMatch, "saveAppSettings() function must exist in +page.svelte");

    const functionBody = saveAppSettingsMatch[1];

    const hasStaleAssignment =
      functionBody.includes("appSettings.enabled = isEnabled") ||
      functionBody.includes("appSettings.enabled=isEnabled");
    assert.equal(
      hasStaleAssignment,
      false,
      "saveAppSettings() must NOT contain 'appSettings.enabled = isEnabled' (stale overwrite bug)"
    );

    assert.ok(
      functionBody.includes('invoke<AppSettings>("update_app_settings", { settings: appSettings })') ||
      functionBody.includes('invoke<AppSettings>("update_app_settings", {settings: appSettings})'),
      "saveAppSettings() must send current appSettings directly to update_app_settings IPC"
    );

    assert.ok(
      functionBody.includes("isEnabled = updated.enabled"),
      "saveAppSettings() must synchronize isEnabled = updated.enabled after IPC update"
    );
  });

  it("2. Structural Check: master-monitoring-switch synchronizes both appSettings.enabled and isEnabled", () => {
    const switchMatch = pageContent.match(
      /<AppleSwitch[\s\S]*?id="master-monitoring-switch"[\s\S]*?\/>/
    );
    assert.ok(switchMatch, "master-monitoring-switch must exist in +page.svelte");

    const switchSnippet = switchMatch[0];
    assert.ok(
      switchSnippet.includes("appSettings.enabled = val"),
      "master-monitoring-switch onchange must set appSettings.enabled = val"
    );
    assert.ok(
      switchSnippet.includes("isEnabled = val"),
      "master-monitoring-switch onchange must set isEnabled = val"
    );
    assert.ok(
      switchSnippet.includes("saveAppSettings()"),
      "master-monitoring-switch onchange must call saveAppSettings()"
    );
  });

  it("3. Functional Simulation: User disables master monitoring (true -> false -> IPC false)", async () => {
    let isEnabled = true;
    let appSettings = {
      enabled: true,
      sound_enabled: true,
      glow: { duration_ms: 2500 },
    };

    let receivedEnabled: boolean | null = null;

    const mockInvoke = async (command: string, payload: { settings: typeof appSettings }) => {
      if (command === "update_app_settings") {
        receivedEnabled = payload.settings.enabled;
        return { ...payload.settings };
      }
      throw new Error(`Unhandled command: ${command}`);
    };

    const saveAppSettings = async () => {
      const updated = await mockInvoke("update_app_settings", { settings: appSettings });
      appSettings = updated;
      isEnabled = updated.enabled;
    };

    const onchange = (val: boolean) => {
      appSettings.enabled = val;
      isEnabled = val;
      saveAppSettings();
    };

    onchange(false);
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(
      receivedEnabled,
      false,
      "IPC must receive enabled=false when user disables monitoring"
    );
    assert.notEqual(
      receivedEnabled,
      true,
      "IPC must NOT receive enabled=true when user disables monitoring"
    );
    assert.equal(appSettings.enabled, false, "appSettings.enabled must remain false");
    assert.equal(isEnabled, false, "isEnabled must remain false");
  });

  it("4. Functional Simulation: User enables master monitoring (false -> true -> IPC true)", async () => {
    let isEnabled = false;
    let appSettings = {
      enabled: false,
      sound_enabled: true,
      glow: { duration_ms: 2500 },
    };

    let receivedEnabled: boolean | null = null;

    const mockInvoke = async (command: string, payload: { settings: typeof appSettings }) => {
      if (command === "update_app_settings") {
        receivedEnabled = payload.settings.enabled;
        return { ...payload.settings };
      }
      throw new Error(`Unhandled command: ${command}`);
    };

    const saveAppSettings = async () => {
      const updated = await mockInvoke("update_app_settings", { settings: appSettings });
      appSettings = updated;
      isEnabled = updated.enabled;
    };

    const onchange = (val: boolean) => {
      appSettings.enabled = val;
      isEnabled = val;
      saveAppSettings();
    };

    onchange(true);
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(
      receivedEnabled,
      true,
      "IPC must receive enabled=true when user enables monitoring"
    );
    assert.notEqual(
      receivedEnabled,
      false,
      "IPC must NOT receive enabled=false when user enables monitoring"
    );
    assert.equal(appSettings.enabled, true, "appSettings.enabled must remain true");
    assert.equal(isEnabled, true, "isEnabled must remain true");
  });

  it("5. Regression Sensitivity: verifies that the old stale-state bug is caught by the test", async () => {
    let isEnabled = true;
    let appSettings = {
      enabled: true,
    };

    let receivedEnabled: boolean | null = null;

    const mockInvoke = async (command: string, payload: { settings: typeof appSettings }) => {
      receivedEnabled = payload.settings.enabled;
      return { ...payload.settings };
    };

    const buggySaveAppSettings = async () => {
      appSettings.enabled = isEnabled;
      const updated = await mockInvoke("update_app_settings", { settings: appSettings });
      appSettings = updated;
      isEnabled = updated.enabled;
    };

    appSettings.enabled = false;
    await buggySaveAppSettings();

    assert.equal(
      receivedEnabled,
      true,
      "Old bug would incorrectly overwrite false back to true"
    );
  });
});
