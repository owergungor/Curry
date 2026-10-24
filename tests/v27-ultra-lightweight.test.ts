import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(".");

describe("Curry v2.7 — Ultra-Lightweight & Memory Architecture", () => {
  it("1. ErrorIsland Window Listener Isolation: attached dynamically via $effect only when active errors exist", () => {
    const filePath = path.join(rootDir, "src", "lib", "components", "ErrorIsland.svelte");
    const content = fs.readFileSync(filePath, "utf8");

    assert.ok(
      content.includes("errorStore.activeErrors.length === 0") || content.includes("errorStore.activeErrors.length > 0"),
      "ErrorIsland must check errorStore.activeErrors"
    );
    assert.ok(
      content.includes("window.addEventListener(\"keydown\", handleWindowKeyDown)"),
      "ErrorIsland must dynamically add keydown listener"
    );
    assert.ok(
      content.includes("window.removeEventListener(\"keydown\", handleWindowKeyDown)"),
      "ErrorIsland must clean up keydown listener"
    );
    assert.ok(
      !content.includes("<svelte:window"),
      "ErrorIsland must not use unconditional root <svelte:window>"
    );
  });

  it("2. ErrorModal Window Listener Isolation: attached dynamically via $effect only when an error is inspected", () => {
    const filePath = path.join(rootDir, "src", "lib", "components", "ErrorModal.svelte");
    const content = fs.readFileSync(filePath, "utf8");

    assert.ok(content.includes("if (!currentError"), "ErrorModal must guard listener when no error inspected");
    assert.ok(
      content.includes("window.addEventListener(\"keydown\", handleKeyDown)"),
      "ErrorModal must dynamically add keydown listener"
    );
    assert.ok(
      content.includes("window.removeEventListener(\"keydown\", handleKeyDown)"),
      "ErrorModal must clean up keydown listener"
    );
    assert.ok(
      !content.includes("<svelte:window"),
      "ErrorModal must not use unconditional root <svelte:window>"
    );
  });

  it("3. GPU Compositor Optimization: backdrop-filter eliminated from active rendering paths", () => {
    const filesToCheck = [
      path.join(rootDir, "src", "routes", "+page.svelte"),
      path.join(rootDir, "src", "lib", "AppearanceTabs.svelte"),
      path.join(rootDir, "src", "lib", "ColorPicker.svelte"),
      path.join(rootDir, "src", "lib", "components", "Dropdown.svelte"),
      path.join(rootDir, "src", "lib", "components", "ErrorIsland.svelte"),
      path.join(rootDir, "src", "lib", "components", "ErrorModal.svelte"),
    ];

    for (const f of filesToCheck) {
      const content = fs.readFileSync(f, "utf8");
      assert.ok(
        !content.includes("backdrop-filter: blur("),
        `File ${path.basename(f)} must not contain expensive GPU backdrop-filter blur passes`
      );
    }
  });

  it("4. AppleSwitch Pure Native Implementation: zero runtime framework dependencies", () => {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    assert.ok(!deps["framer-motion"], "Must not depend on framer-motion");
    assert.ok(!deps["motion"], "Must not depend on motion");
    assert.ok(!deps["@heroui/react"], "Must not depend on heroui");
    assert.ok(!deps["react"], "Must not depend on react");

    const switchPath = path.join(rootDir, "src", "lib", "components", "AppleSwitch.svelte");
    const switchContent = fs.readFileSync(switchPath, "utf8");
    assert.ok(switchContent.includes("<button"), "AppleSwitch must be a native HTML button");
    assert.ok(switchContent.includes('role="switch"'), "AppleSwitch must have role='switch'");
  });

  it("5. View Lifecycle Isolation: top tabs conditionally unmount inactive views", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const content = fs.readFileSync(pagePath, "utf8");

    assert.ok(content.includes('{#if activeTab === "dashboard"}'), "Dashboard tab must be conditionally mounted");
    assert.ok(content.includes('{:else if activeTab === "notifications"}'), "Notifications tab must be conditionally mounted");
    assert.ok(content.includes('{:else if activeTab === "applications"}'), "Applications tab must be conditionally mounted");
    assert.ok(content.includes('{:else if activeTab === "glow"}'), "Glow tab must be conditionally mounted");
  });

  it("6. Lazy Overlay Architecture Preserved: no overlay window in startup config", () => {
    const configPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const windows = config.app?.windows ?? [];

    const overlay = windows.find((w: any) => w.label === "glow-overlay");
    assert.equal(overlay, undefined, "glow-overlay must NOT exist in tauri.conf.json startup windows");
    assert.equal(windows.length, 1, "Exactly one startup window ('main') must be configured");
  });

  it("7. Inactive Glow DOM Teardown: glow viewport unmounts when animation stops", () => {
    const glowPath = path.join(rootDir, "src", "routes", "glow", "+page.svelte");
    const content = fs.readFileSync(glowPath, "utf8");

    assert.ok(content.includes("{#if isGlowing}"), "Glow overlay viewport must be wrapped in {#if isGlowing}");
  });

  it("8. Event Listener Teardown: all promises unlistened on component unmount", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const content = fs.readFileSync(pagePath, "utf8");

    assert.ok(content.includes("unlistenStatePromise.then("), "app-state-changed listener must be cleaned up");
    assert.ok(content.includes("unlistenSettingsPromise.then("), "app-settings-updated listener must be cleaned up");
    assert.ok(content.includes("unlistenRestoredPromise.then("), "window-restored listener must be cleaned up");
    assert.ok(content.includes("unlistenClearedPromise.then("), "notifications-cleared listener must be cleaned up");
  });

  it("9. Memory Growth Protection: no aggressive unthrottled intervals", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const content = fs.readFileSync(pagePath, "utf8");

    assert.ok(!content.includes("setInterval(" + "() => {},"), "No empty or arbitrary intervals");
    assert.ok(!content.includes(", 1000)"), "No 1s rapid intervals");
    assert.ok(!content.includes(", 2000)"), "No 2s rapid intervals");
  });

  it("10. Package Manifest Minimalism: only approved Tauri v2 dependencies", () => {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = Object.keys(pkg.dependencies || {});

    assert.deepEqual(
      deps.sort(),
      ["@tauri-apps/api", "@tauri-apps/plugin-dialog", "@tauri-apps/plugin-updater"].sort(),
      "Runtime dependencies must be strictly minimal and approved"
    );
  });
});
