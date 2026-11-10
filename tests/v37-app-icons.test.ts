import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Curry v3.7 — Application Icons in Square Frames Contract", () => {
  const pagePath = path.resolve("src/routes/+page.svelte");
  const iconRsPath = path.resolve("src-tauri/src/scanner/icon.rs");
  const pageSource = fs.readFileSync(pagePath, "utf-8");
  const iconRsSource = fs.readFileSync(iconRsPath, "utf-8");

  test("1. Grid and List views both render app-avatar-img inside app-avatar-box", () => {
    // Check Grid view container
    assert.ok(
      pageSource.includes('class="app-avatar-box"'),
      "Must have app-avatar-box container in page"
    );

    // Verify app-avatar-img is conditionally rendered when profile.icon exists
    const gridMatch = pageSource.includes("{#if profile.icon}\n                            <img");
    assert.ok(gridMatch, "Grid view must render <img> when profile.icon is truthy");

    // Verify fallback SVG glyph when profile.icon is falsy
    assert.ok(
      pageSource.includes('class="app-avatar-fallback-icon"'),
      "Must render app-avatar-fallback-icon when profile.icon is missing"
    );
  });

  test("2. app-avatar-img uses contain object-fit and center alignment without distortion", () => {
    assert.ok(
      pageSource.includes("object-fit: contain;"),
      "app-avatar-img must specify object-fit: contain to avoid distortion"
    );
    assert.ok(
      pageSource.includes("object-position: center;"),
      "app-avatar-img must specify object-position: center"
    );
  });

  test("3. app-avatar-box preserves square dimensions, 12px rounding, and neon glow border", () => {
    assert.ok(pageSource.includes("width: 44px;"), "app-avatar-box width must be 44px");
    assert.ok(pageSource.includes("height: 44px;"), "app-avatar-box height must be 44px");
    assert.ok(pageSource.includes("border-radius: 12px;"), "app-avatar-box border-radius must be 12px");
    assert.ok(
      pageSource.includes("box-shadow: 0 0 12px -2px var(--app-glow-color, var(--primary));"),
      "app-avatar-box must maintain neon box-shadow glow"
    );
    assert.ok(
      pageSource.includes("border: 2px solid var(--app-glow-color, var(--primary));"),
      "app-avatar-box must maintain neon border"
    );
  });

  test("4. Performance attributes loading='lazy' and decoding='async' are present", () => {
    assert.ok(pageSource.includes('loading="lazy"'), "img must specify loading='lazy'");
    assert.ok(pageSource.includes('decoding="async"'), "img must specify decoding='async'");
    assert.ok(pageSource.includes('draggable="false"'), "img must specify draggable='false'");
  });

  test("5. Missing profile icons are dynamically enriched on startup", () => {
    assert.ok(
      pageSource.includes("Dynamically enrich missing icons for existing profiles"),
      "fetchApplicationProfiles must contain enrichment loop for missing icons"
    );
    assert.ok(
      pageSource.includes('safeInvoke<AppIconInfo>("get_app_icon"'),
      "get_app_icon IPC must be called for profiles lacking an icon"
    );
  });

  test("6. Rust icon extraction pipeline sanitizes paths, supports UWP packages and GDI mask restoration", () => {
    assert.ok(
      iconRsSource.includes("pub fn sanitize_icon_path"),
      "icon.rs must provide sanitize_icon_path"
    );
    assert.ok(
      iconRsSource.includes("resolve_candidate_image_file"),
      "icon.rs must support candidate image variant resolution (.scale-200 etc.)"
    );
    assert.ok(
      iconRsSource.includes("try_resolve_appx_manifest_logo"),
      "icon.rs must support resolving logos from UWP AppxManifest.xml"
    );
    assert.ok(
      iconRsSource.includes("icon_info.hbmMask"),
      "icon.rs must restore alpha using hbmMask for icons lacking 32-bit alpha"
    );
    assert.ok(
      iconRsSource.includes("ExtractIconExW"),
      "icon.rs must support ExtractIconExW fallback"
    );
  });
});
