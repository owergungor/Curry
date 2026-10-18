import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { THEMES, DEFAULT_THEME, DEFAULT_GLOW_COLOR, type ThemeId } from "../src/lib/themes.ts";

test("v2.4 Polish: DEFAULT_GLOW_COLOR authoritative source of truth is #FFFFFF", () => {
  // 1. TypeScript source of truth
  assert.equal(
    DEFAULT_GLOW_COLOR,
    "#FFFFFF",
    "Frontend DEFAULT_GLOW_COLOR in src/lib/themes.ts must be #FFFFFF"
  );

  // 2. Rust source of truth
  const rustModelPath = path.resolve("src-tauri/src/glow/model.rs");
  assert.ok(fs.existsSync(rustModelPath), "src-tauri/src/glow/model.rs must exist");
  const rustModel = fs.readFileSync(rustModelPath, "utf8");
  assert.ok(
    rustModel.includes('pub const DEFAULT_GLOW_COLOR: &str = "#FFFFFF";'),
    "Rust glow/model.rs must define pub const DEFAULT_GLOW_COLOR: &str = \"#FFFFFF\";"
  );
  assert.ok(
    rustModel.includes("color: DEFAULT_GLOW_COLOR.to_string()"),
    "GlowSettings::default() must use DEFAULT_GLOW_COLOR"
  );

  // 3. Rust settings model sanitize fallback
  const rustSettingsPath = path.resolve("src-tauri/src/settings/model.rs");
  const rustSettings = fs.readFileSync(rustSettingsPath, "utf8");
  assert.ok(
    rustSettings.includes("DEFAULT_GLOW_COLOR.to_string()"),
    "AppSettings::sanitized() must fallback to DEFAULT_GLOW_COLOR"
  );

  // 4. Frontend default settings in routes
  const mainPagePath = path.resolve("src/routes/+page.svelte");
  const mainPage = fs.readFileSync(mainPagePath, "utf8");
  assert.ok(
    mainPage.includes("color: DEFAULT_GLOW_COLOR"),
    "+page.svelte must initialize appSettings.glow.color with DEFAULT_GLOW_COLOR"
  );

  const glowPagePath = path.resolve("src/routes/glow/+page.svelte");
  const glowPage = fs.readFileSync(glowPagePath, "utf8");
  assert.ok(
    glowPage.includes("color: DEFAULT_GLOW_COLOR"),
    "glow/+page.svelte must initialize payload.color with DEFAULT_GLOW_COLOR"
  );

  const colorPickerPath = path.resolve("src/lib/ColorPicker.svelte");
  const colorPicker = fs.readFileSync(colorPickerPath, "utf8");
  assert.ok(
    colorPicker.includes("value = $bindable(DEFAULT_GLOW_COLOR)"),
    "ColorPicker must default its value to DEFAULT_GLOW_COLOR"
  );
});

test("v2.4 Polish: ThemeSelector renders flat presentation without grouping or excess metadata", () => {
  const selectorPath = path.resolve("src/lib/components/ThemeSelector.svelte");
  assert.ok(fs.existsSync(selectorPath), "ThemeSelector.svelte must exist");
  const content = fs.readFileSync(selectorPath, "utf8");

  // Must NOT contain family grouping structures
  assert.equal(
    content.includes("family-section"),
    false,
    "ThemeSelector must not contain family-section"
  );
  assert.equal(
    content.includes("family-badge"),
    false,
    "ThemeSelector must not contain family-badge"
  );
  assert.equal(
    content.includes("family-header"),
    false,
    "ThemeSelector must not contain family-header"
  );
  assert.equal(
    content.includes("family.themes"),
    false,
    "ThemeSelector must iterate flat THEMES directly, not nested families"
  );

  // Must NOT contain descriptions or mock window cards
  assert.equal(
    content.includes("theme-desc"),
    false,
    "ThemeSelector must not display theme descriptions"
  );
  assert.equal(
    content.includes("theme-mock-window"),
    false,
    "ThemeSelector must not display mock window preview card"
  );

  // Must contain flat themes grid and iterate THEMES
  assert.ok(
    content.includes("themes-grid"),
    "ThemeSelector must render flat .themes-grid"
  );
  assert.ok(
    content.includes("{#each THEMES as theme}"),
    "ThemeSelector must iterate flat THEMES array"
  );
  assert.ok(
    content.includes("theme-name"),
    "ThemeSelector must display the theme name"
  );
  assert.ok(
    content.includes("swatches-row") && content.includes("swatch-circle"),
    "ThemeSelector must display color swatch circles"
  );
});

test("v2.4 Polish: ThemeSelector keyboard navigation and selection behavior", () => {
  const allIds = THEMES.map((t) => t.id);
  assert.ok(allIds.length >= 10, "THEMES list must contain themes");
  assert.ok(allIds.includes(DEFAULT_THEME), "DEFAULT_THEME must be in THEMES list");

  // Test circular selection logic simulation
  function getNextTheme(currentId: ThemeId, key: "ArrowRight" | "ArrowLeft" | "Home" | "End"): ThemeId {
    const idx = allIds.indexOf(currentId);
    let nextIdx = idx;
    if (key === "ArrowRight") {
      nextIdx = (idx + 1) % allIds.length;
    } else if (key === "ArrowLeft") {
      nextIdx = (idx - 1 + allIds.length) % allIds.length;
    } else if (key === "Home") {
      nextIdx = 0;
    } else if (key === "End") {
      nextIdx = allIds.length - 1;
    }
    return allIds[nextIdx];
  }

  assert.equal(
    getNextTheme("perpetuity", "ArrowRight"),
    allIds[1],
    "ArrowRight moves to next theme"
  );
  assert.equal(
    getNextTheme(allIds[0], "ArrowLeft"),
    allIds[allIds.length - 1],
    "ArrowLeft on first theme wraps to last theme"
  );
  assert.equal(
    getNextTheme(allIds[5], "Home"),
    allIds[0],
    "Home moves to first theme"
  );
  assert.equal(
    getNextTheme(allIds[2], "End"),
    allIds[allIds.length - 1],
    "End moves to last theme"
  );
});

test("v2.4 Polish: NSIS installer icon configuration and multi-resolution asset integrity", () => {
  const tauriConfPath = path.resolve("src-tauri/tauri.conf.json");
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));

  assert.equal(
    tauriConf.bundle?.windows?.nsis?.installerIcon,
    "icons/installer.ico",
    "tauri.conf.json must explicitly configure bundle.windows.nsis.installerIcon to 'icons/installer.ico'"
  );

  const installerIcoPath = path.resolve("src-tauri/icons/installer.ico");
  assert.ok(fs.existsSync(installerIcoPath), "src-tauri/icons/installer.ico must exist");

  const installerPngPath = path.resolve("src-tauri/icons/installer.png");
  assert.ok(fs.existsSync(installerPngPath), "src-tauri/icons/installer.png must exist");

  // Validate multi-resolution ICO structure
  const buf = fs.readFileSync(installerIcoPath);
  assert.equal(buf.readUInt16LE(0), 0, "ICO reserved header must be 0");
  assert.equal(buf.readUInt16LE(2), 1, "ICO type header must be 1 (icon)");
  const count = buf.readUInt16LE(4);
  assert.ok(count >= 4, "installer.ico must contain multiple resolutions");

  // Verify installer.nsi binds INSTALLERICON to MUI_ICON
  const nsiPath = path.resolve("src-tauri/installer.nsi");
  const nsi = fs.readFileSync(nsiPath, "utf8");
  assert.ok(
    nsi.includes('!define INSTALLERICON "{{installer_icon}}"'),
    "installer.nsi must define INSTALLERICON from {{installer_icon}}"
  );
  assert.ok(
    nsi.includes('!define MUI_ICON "${INSTALLERICON}"'),
    "installer.nsi must define MUI_ICON as ${INSTALLERICON}"
  );
});
