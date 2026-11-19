import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Curry — Welcome Screen & First-Run Onboarding Contract", () => {
  const wizardPath = path.resolve(process.cwd(), "src/lib/components/WelcomeWizard.svelte");
  const wizardContent = fs.readFileSync(wizardPath, "utf-8");

  const pagePath = path.resolve(process.cwd(), "src/routes/+page.svelte");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  const modelPath = path.resolve(process.cwd(), "src-tauri/src/settings/model.rs");
  const modelContent = fs.readFileSync(modelPath, "utf-8");

  const storagePath = path.resolve(process.cwd(), "src-tauri/src/settings/storage.rs");
  const storageContent = fs.readFileSync(storagePath, "utf-8");

  const i18nPath = path.resolve(process.cwd(), "src/lib/i18n/index.ts");
  const i18nContent = fs.readFileSync(i18nPath, "utf-8");

  it("1. Rust AppSettings includes onboarding_completed, display_name, and default_page with proper serde attributes", () => {
    assert.match(
      modelContent,
      /pub\s+onboarding_completed:\s*bool/i,
      "AppSettings model must define onboarding_completed: bool"
    );
    assert.match(
      modelContent,
      /pub\s+display_name:\s*Option<String>/i,
      "AppSettings model must define display_name: Option<String>"
    );
    assert.match(
      modelContent,
      /pub\s+default_page:\s*Option<String>/i,
      "AppSettings model must define default_page: Option<String>"
    );
    assert.match(
      modelContent,
      /alias\s*=\s*"onboardingCompleted"/i,
      "AppSettings must support camelCase deserialization for onboardingCompleted"
    );
    assert.match(
      modelContent,
      /alias\s*=\s*"displayName"/i,
      "AppSettings must support camelCase deserialization for displayName"
    );
    assert.match(
      modelContent,
      /alias\s*=\s*"defaultPage"/i,
      "AppSettings must support camelCase deserialization for defaultPage"
    );
  });

  it("2. Rust storage migrates existing settings without disrupting existing users", () => {
    assert.match(
      storageContent,
      /loaded\.onboarding_completed\s*=\s*true/i,
      "Storage loader must default onboarding_completed to true for existing users with pre-existing settings files"
    );
  });

  it("3. i18n dictionary supports onboarding keys in all 5 languages", () => {
    const requiredKeys = [
      "onboarding.welcome_title",
      "onboarding.welcome_subtitle",
      "onboarding.get_started",
      "onboarding.skip_setup",
      "onboarding.step1_title",
      "onboarding.step2_title",
      "onboarding.step3_title",
      "onboarding.step4_title",
      "onboarding.step5_title",
      "onboarding.launch_curry",
      "settings.restart_onboarding_title",
      "settings.restart_onboarding_btn",
    ];

    for (const key of requiredKeys) {
      assert.match(
        i18nContent,
        new RegExp(`['"]${key.replace('.', '\\.')}['"]`),
        `i18n dictionary must define translation key ${key}`
      );
    }
  });

  it("4. Welcome Screen (Step 0) renders hero branding, feature highlights, and action buttons", () => {
    assert.match(
      wizardContent,
      /t\('onboarding\.welcome_title'\)/,
      "Step 0 must render welcome title translation"
    );
    assert.match(
      wizardContent,
      /t\('onboarding\.welcome_subtitle'\)/,
      "Step 0 must render welcome subtitle translation"
    );
    assert.match(
      wizardContent,
      /id="onboarding-get-started-btn"/,
      "Step 0 must contain #onboarding-get-started-btn"
    );
    assert.match(
      wizardContent,
      /id="onboarding-skip-setup-btn"/,
      "Step 0 must contain #onboarding-skip-setup-btn"
    );
  });

  it("5. Step 1 (Personalize) allows Display Name input, Theme Mode, and Theme Palette selection", () => {
    assert.match(
      wizardContent,
      /id="onboarding-display-name"/,
      "Step 1 must contain display name input"
    );
    assert.match(
      wizardContent,
      /handleAppearance\('system'\)/,
      "Step 1 must support system appearance mode"
    );
    assert.match(
      wizardContent,
      /handleAppearance\('dark'\)/,
      "Step 1 must support dark appearance mode"
    );
    assert.match(
      wizardContent,
      /handleAppearance\('light'\)/,
      "Step 1 must support light appearance mode"
    );
    assert.match(
      wizardContent,
      /THEMES as th/,
      "Step 1 must iterate and render themes palette"
    );
  });

  it("6. Step 2 (Notifications) provides notification capture toggle, audio chime toggle, audio test, and history slider", () => {
    assert.match(
      wizardContent,
      /id="onboard-capture-switch"/,
      "Step 2 must provide notification capture switch"
    );
    assert.match(
      wizardContent,
      /id="onboard-sound-switch"/,
      "Step 2 must provide sound alerts switch"
    );
    assert.match(
      wizardContent,
      /playSampleSound/,
      "Step 2 must provide audio test chime preview using Web Audio API"
    );
    assert.match(
      wizardContent,
      /type="range"/,
      "Step 2 must provide notification history limit slider"
    );
  });

  it("7. Step 3 (Application Discovery) provides scan trigger, non-blocking state, and app chip preview", () => {
    assert.match(
      wizardContent,
      /id="onboard-scan-trigger-btn"/,
      "Step 3 must provide #onboard-scan-trigger-btn"
    );
    assert.match(
      wizardContent,
      /handleScan/,
      "Step 3 must execute asynchronous scan handler"
    );
    assert.match(
      wizardContent,
      /effectiveAppsCount/,
      "Step 3 must reactively derive discovered application count"
    );
    assert.match(
      wizardContent,
      /discovered-chips-preview/,
      "Step 3 must render preview chips for discovered apps"
    );
  });

  it("8. Step 4 (Quick Preferences) configures startup, taskbar/tray, OLED mode, and default landing page", () => {
    assert.match(
      wizardContent,
      /id="onboard-startup-switch"/,
      "Step 4 must provide Windows startup switch"
    );
    assert.match(
      wizardContent,
      /id="onboard-taskbar-switch"/,
      "Step 4 must provide taskbar visibility switch"
    );
    assert.match(
      wizardContent,
      /id="onboard-oled-switch"/,
      "Step 4 must provide OLED mode switch"
    );
    assert.match(
      wizardContent,
      /landing-tabs-group/,
      "Step 4 must provide landing page selector tab group"
    );
  });

  it("9. Step 5 (Ready) displays summary and Launch Curry button", () => {
    assert.match(
      wizardContent,
      /id="onboarding-launch-curry-btn"/,
      "Step 5 must provide #onboarding-launch-curry-btn"
    );
    assert.match(
      wizardContent,
      /summary-grid/,
      "Step 5 must render configuration summary grid"
    );
  });

  it("10. Main page mounts WelcomeWizard and provides Settings restart action", () => {
    assert.match(
      pageContent,
      /<WelcomeWizard\s+bind:open=\{showWelcomeWizard\}/,
      "Main page must mount WelcomeWizard component with bind:open"
    );
    assert.match(
      pageContent,
      /id="restart-welcome-setup-btn"/,
      "Settings page must contain #restart-welcome-setup-btn"
    );
    assert.match(
      pageContent,
      /restartWelcomeSetup\(\)/,
      "Settings page must wire up restartWelcomeSetup handler"
    );
  });

  it("11. Welcome Screen keyboard handler never advances on arbitrary keys and cleans up listener", () => {
    // Must not use always-on <svelte:window onkeydown={...} />
    assert.doesNotMatch(
      wizardContent,
      /<svelte:window\s+onkeydown/,
      "WelcomeWizard must manage its window keydown listener inside $effect with cleanup rather than an always-on svelte:window handler"
    );
    assert.match(
      wizardContent,
      /window\.addEventListener\("keydown",\s*handleKeydown,\s*true\)/,
      "WelcomeWizard must register capture-phase keydown listener when open"
    );
    assert.match(
      wizardContent,
      /window\.removeEventListener\("keydown",\s*handleKeydown,\s*true\)/,
      "WelcomeWizard must clean up keydown listener on close/unmount"
    );

    // Extract handleKeydown body and verify it never calls handleGetStarted or nextStep or sets step = 1
    const keydownMatch = wizardContent.match(
      /function handleKeydown\([\s\S]*?\n  \}/
    );
    assert.ok(keydownMatch, "handleKeydown function must exist");
    const keydownBody = keydownMatch[0];
    assert.doesNotMatch(
      keydownBody,
      /handleGetStarted|nextStep|step\s*=\s*1|step\s*\+=/,
      "handleKeydown must NEVER advance to Get Started / Step 1 on arbitrary keydown"
    );
    assert.match(
      keydownBody,
      /isInteractiveElement\(target\)/,
      "Step 0 must only allow Enter/Space activation on focused interactive elements"
    );
  });

  it("12. Welcome Screen traps Tab focus inside modal, focuses dialog container on open, and has no form submit", () => {
    assert.doesNotMatch(
      wizardContent,
      /<form\b/i,
      "WelcomeWizard must not wrap steps in a <form> that could accidentally submit on Enter"
    );
    assert.match(
      wizardContent,
      /bind:this=\{dialogEl\}/,
      "Dialog container must bind dialogEl for focus management"
    );
    assert.match(
      wizardContent,
      /dialogEl\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/,
      "Opening wizard must move focus to dialog container (not pre-focusing Get Started button)"
    );
    assert.match(
      wizardContent,
      /if\s*\(e\.key\s*===\s*"Tab"\)/,
      "Wizard must support Tab / Shift+Tab focus trapping inside the modal"
    );
    assert.match(
      wizardContent,
      /if\s*\(open\s*&&\s*!wasOpen\)/,
      "Wizard must initialize state only on closed->open transition so theme/appearance edits do not reset step"
    );
  });

  it("13. Main page global window keydown ignores events while WelcomeWizard is open", () => {
    assert.match(
      pageContent,
      /if\s*\(showWelcomeWizard\)\s*return;/,
      "+page.svelte global window keydown must return early when showWelcomeWizard is true"
    );
  });
});
