import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Curry v2.6 — Memory Optimization & WebView2 Architecture", () => {
  const rootDir = path.resolve(".");

  it("1. Startup Window Isolation: tauri.conf.json creates only 'main' window at startup", () => {
    const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
    const windows = tauriConf.app?.windows ?? [];

    assert.equal(windows.length, 1, "Exactly one window ('main') must be configured for startup");
    assert.equal(windows[0].label, "main", "Startup window must be 'main'");
    assert.ok(
      !windows.some((w: any) => w.label === "glow-overlay"),
      "glow-overlay must NOT be configured in tauri.conf.json startup windows"
    );
  });

  it("2. Overlay Capability Verification: default.json grants capabilities to dynamic glow-overlay windows", () => {
    const capPath = path.join(rootDir, "src-tauri", "capabilities", "default.json");
    const cap = JSON.parse(fs.readFileSync(capPath, "utf8"));
    const windows: string[] = cap.windows ?? [];

    assert.ok(windows.includes("main"), "Capability must include 'main'");
    assert.ok(
      windows.includes("glow-overlay") || windows.some((w) => w.startsWith("glow-overlay")),
      "Capability must permit dynamically generated 'glow-overlay' windows"
    );
  });

  it("3. Startup Warm Overlays Eliminated: no warm_overlays references in backend startup", () => {
    const libRsPath = path.join(rootDir, "src-tauri", "src", "lib.rs");
    const libRs = fs.readFileSync(libRsPath, "utf8");

    assert.ok(
      !libRs.includes("warm_overlays"),
      "src-tauri/src/lib.rs must NOT invoke warm_overlays at application startup"
    );

    const managerRsPath = path.join(rootDir, "src-tauri", "src", "glow", "manager.rs");
    const managerRs = fs.readFileSync(managerRsPath, "utf8");

    assert.ok(
      !managerRs.includes("pub fn warm_overlays"),
      "GlowManager must not define eager warm_overlays startup method"
    );
  });

  it("4. Race Condition Guard: get_active_glow_payload IPC command registered and exposed", () => {
    const libRsPath = path.join(rootDir, "src-tauri", "src", "lib.rs");
    const libRs = fs.readFileSync(libRsPath, "utf8");

    assert.ok(
      libRs.includes("fn get_active_glow_payload"),
      "lib.rs must define get_active_glow_payload command handler"
    );
    assert.ok(
      libRs.includes("get_active_glow_payload,"),
      "lib.rs must register get_active_glow_payload in generate_handler!"
    );

    const managerRsPath = path.join(rootDir, "src-tauri", "src", "glow", "manager.rs");
    const managerRs = fs.readFileSync(managerRsPath, "utf8");

    assert.ok(
      managerRs.includes("pub fn get_active_payload"),
      "GlowManager must expose get_active_payload method"
    );
    assert.ok(
      managerRs.includes("active_payload.write()"),
      "GlowManager::dispatch_overlay must store payload in active_payload before window creation"
    );
  });

  it("5. Overlay Dynamic Hydration: glow/+page.svelte queries pending payload on mount", () => {
    const glowPagePath = path.join(rootDir, "src", "routes", "glow", "+page.svelte");
    const glowPage = fs.readFileSync(glowPagePath, "utf8");

    assert.ok(
      glowPage.includes('invoke<GlowPayload | null>("get_active_glow_payload")'),
      "glow/+page.svelte must call get_active_glow_payload in onMount to prevent race condition"
    );
    assert.ok(
      glowPage.includes('import { invoke } from "@tauri-apps/api/core"'),
      "glow/+page.svelte must import invoke from @tauri-apps/api/core"
    );
  });

  it("6. GPU Compositing Optimization: glow/+page.svelte conditionally mounts glow viewport", () => {
    const glowPagePath = path.join(rootDir, "src", "routes", "glow", "+page.svelte");
    const glowPage = fs.readFileSync(glowPagePath, "utf8");

    assert.ok(
      glowPage.includes("{#if isGlowing}"),
      "glow/+page.svelte must wrap the glow edge DOM in {#if isGlowing} to avoid idle GPU box-shadow layers"
    );
  });

  it("7. GPU Layer Reduction: .hero-page-container will-change is scoped only to active transitions", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const pageContent = fs.readFileSync(pagePath, "utf8");

    // .hero-page-container alone must not have will-change
    const heroStaticRegex = /\.hero-page-container\s*\{[^}]*will-change:[^}]*\}/s;
    assert.ok(
      !heroStaticRegex.test(pageContent),
      ".hero-page-container base class must NOT have permanent will-change"
    );

    // .page-forward and .page-backward must have will-change during animation
    assert.ok(
      pageContent.includes(".hero-page-container.page-forward"),
      "page-forward class must be defined"
    );
    assert.ok(
      pageContent.includes(".hero-page-container.page-backward"),
      "page-backward class must be defined"
    );
  });

  it("8. Polling Heap & IPC Churn Reduction: interval relaxed from 4s to 30s", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const pageContent = fs.readFileSync(pagePath, "utf8");

    assert.ok(
      !pageContent.includes("fetchPipelineStatus();\r\n    }, 4000);") &&
        !pageContent.includes("fetchPipelineStatus();\n    }, 4000);"),
      "4000ms aggressive polling interval must not exist in +page.svelte"
    );

    assert.ok(
      pageContent.includes("fetchPipelineStatus();\r\n    }, 30000);") ||
        pageContent.includes("fetchPipelineStatus();\n    }, 30000);"),
      "Fallback polling interval must be relaxed to 30000ms in +page.svelte"
    );

    // Ensure interval is cleared on unmount
    assert.ok(
      pageContent.includes("clearInterval(interval);"),
      "Interval must be cleared in onMount return teardown"
    );
  });

  it("9. Pointer Listener Lifecycle: ColorPicker cleans up window drag listeners on unmount", () => {
    const cpPath = path.join(rootDir, "src", "lib", "ColorPicker.svelte");
    const cpContent = fs.readFileSync(cpPath, "utf8");

    assert.ok(
      cpContent.includes("activeDragCleanup"),
      "ColorPicker must maintain activeDragCleanup tracker"
    );
    assert.ok(
      cpContent.includes("if (activeDragCleanup)"),
      "ColorPicker must invoke activeDragCleanup on teardown/cleanup"
    );
  });

  it("10. Event Listener Teardown Integrity: all Tauri event promises unlistened in +page.svelte", () => {
    const pagePath = path.join(rootDir, "src", "routes", "+page.svelte");
    const pageContent = fs.readFileSync(pagePath, "utf8");

    const requiredUnlistens = [
      "unlistenStatePromise.then",
      "unlistenSettingsPromise.then",
      "unlistenTraySettingsPromise.then",
      "unlistenNotifPromise.then",
      "unlistenHiddenPromise.then",
      "unlistenRestoredPromise.then",
      "unlistenClearedPromise.then",
      "unlistenRemovedPromise.then",
      "unlistenAllReadPromise.then",
      "unlistenReadStatusPromise.then",
      "unlistenGlowFinishedPromise.then",
    ];

    for (const item of requiredUnlistens) {
      assert.ok(
        pageContent.includes(item),
        `+page.svelte teardown must unlisten: ${item}`
      );
    }
  });
});
