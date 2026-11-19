import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Curry — Notifications App Icon & Dynamic Glow Enhancement Contract", () => {
  const pagePath = path.resolve(process.cwd(), "src/routes/+page.svelte");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  it("1. Notification cards render real application icons inside square container with object-fit: contain", () => {
    assert.match(
      pageContent,
      /visuals\.icon/i,
      "Notification card must render visuals.icon dynamically"
    );
    assert.match(
      pageContent,
      /<img[^>]*src=\{visuals\.icon\}[^>]*class="avatar-img"|<img[^>]*class="avatar-img"[^>]*src=\{visuals\.icon\}/i,
      "Notification card must bind src={visuals.icon} and class='avatar-img'"
    );
    assert.match(
      pageContent,
      /\.avatar-img\s*\{[^}]*object-fit:\s*contain/i,
      "Avatar image must enforce object-fit: contain to prevent distortion or clipping"
    );
  });

  it("2. Fallback SVG glyph is rendered when application icon cannot be resolved", () => {
    assert.match(
      pageContent,
      /class="avatar-fallback-glyph"/,
      "Fallback SVG glyph must exist for unresolvable application icons"
    );
    assert.match(
      pageContent,
      /style:color=\{visuals\.color\}/,
      "Fallback glyph must use the application's resolved color"
    );
  });

  it("3. Dynamic accent CSS variables are bound on notification cards", () => {
    assert.match(
      pageContent,
      /style:--notif-accent-color=\{visuals\.color\}/,
      "Card must set --notif-accent-color from resolved visuals"
    );
    assert.match(
      pageContent,
      /style:--notif-accent-subdued=\{visuals\.subduedColor\}/,
      "Card must set --notif-accent-subdued from resolved visuals"
    );
    assert.match(
      pageContent,
      /style:--notif-accent-glow=\{visuals\.glowColor\}/,
      "Card must set --notif-accent-glow from resolved visuals"
    );
  });

  it("4. Dynamic glow accent is applied to card border, avatar frame, and unread dot", () => {
    // Unread card border-left
    assert.match(
      pageContent,
      /\.notification-card\.is-unread\s*\{[^}]*border-left:\s*3px solid var\(--notif-accent-color/i,
      "Unread card left border must dynamically bind to --notif-accent-color"
    );

    // Read card border-left
    assert.match(
      pageContent,
      /\.notification-card\.is-read\s*\{[^}]*border-left:\s*3px solid var\(--notif-accent-subdued/i,
      "Read card left border must dynamically bind to --notif-accent-subdued"
    );

    // Avatar square frame
    assert.match(
      pageContent,
      /\.card-avatar\s*\{[^}]*border:\s*1\.5px solid var\(--notif-accent-color/i,
      "Card avatar frame border must dynamically bind to --notif-accent-color"
    );
    assert.match(
      pageContent,
      /\.card-avatar\s*\{[^}]*box-shadow:[^;]*var\(--notif-accent-glow/i,
      "Card avatar frame must have subtle glow box-shadow matching app color"
    );

    // Unread indicator dot
    assert.match(
      pageContent,
      /\.card-unread-dot\s*\{[^}]*background-color:\s*var\(--notif-accent-color/i,
      "Unread dot background must dynamically bind to --notif-accent-color"
    );
    assert.match(
      pageContent,
      /\.card-unread-dot\s*\{[^}]*box-shadow:[^;]*var\(--notif-accent-color/i,
      "Unread dot glow box-shadow must dynamically bind to --notif-accent-color"
    );
  });

  it("5. Dashboard recent notifications also display real app icons and dynamic glow", () => {
    assert.match(
      pageContent,
      /\.recent-item-row\.is-unread\s*\{[^}]*border-left:\s*3px solid var\(--notif-accent-color/i,
      "Recent unread item row left border must dynamically bind to --notif-accent-color"
    );
    assert.match(
      pageContent,
      /\.recent-avatar\s*\{[^}]*border:\s*1px solid var\(--notif-accent-color/i,
      "Recent avatar border must dynamically bind to --notif-accent-color"
    );
    assert.match(
      pageContent,
      /\.recent-avatar-img\s*\{[^}]*object-fit:\s*contain/i,
      "Recent avatar image must use object-fit: contain"
    );
  });

  it("6. Application matching & visual resolution logic operates without hardcoded app color chains", () => {
    // Ensure no hardcoded app switch/case color statements
    assert.doesNotMatch(
      pageContent,
      /switch\s*\([^)]*\)\s*\{[^}]*case\s*["']Antigravity["']/i,
      "Must not hardcode application names in switch-case color maps"
    );
    assert.match(
      pageContent,
      /function findMatchingProfile/i,
      "findMatchingProfile helper must exist"
    );
    assert.match(
      pageContent,
      /function getNotificationVisuals/i,
      "getNotificationVisuals helper must exist"
    );
    assert.match(
      pageContent,
      /safeInvoke<AppIconInfo>\("get_app_icon"/i,
      "Must query get_app_icon IPC command asynchronously if icon or color is missing"
    );
  });
});
