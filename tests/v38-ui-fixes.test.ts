import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PAGE_PATH = path.resolve('src/routes/+page.svelte');
const TAURI_CONF_PATH = path.resolve('src-tauri/tauri.conf.json');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');
const tauriConfSource = fs.readFileSync(TAURI_CONF_PATH, 'utf-8');

describe('Curry v3.8 — UI Fixes: App Icons Restoration & Path Removal Contract', () => {
  test('1. CSP img-src includes data: to permit base64 app icons without triggering onerror', () => {
    const tauriConf = JSON.parse(tauriConfSource);
    const csp = tauriConf.app?.security?.csp || '';
    assert.ok(
      csp.includes("img-src 'self' asset: http://asset.localhost data:"),
      `CSP must permit data: in img-src. Found: ${csp}`
    );
  });

  test('2. Grid and List view cards do not render full executablePath on main Apps tab', () => {
    // Assert app-path-hint is completely removed from the main cards
    assert.ok(
      !pageSource.includes('class="app-path-hint"'),
      'Main Apps tab cards must not display full executablePath hints'
    );
  });

  test('3. Executable name remains displayed on both Grid and List cards', () => {
    assert.ok(
      pageSource.includes('class="app-executable-text" title={profile.executableName}>'),
      'Application cards must continue displaying profile.executableName'
    );
  });

  test('4. Full path remains accessible inside Edit Application Profile modal', () => {
    assert.ok(
      pageSource.includes('class="profile-path-card"'),
      'Path must be available inside the Edit Application Profile modal'
    );
    assert.ok(
      pageSource.includes('class="profile-path-text"'),
      'Path value must be rendered inside the modal path card'
    );
  });

  test('5. App avatars maintain contain object-fit, centering and neon square frame', () => {
    assert.ok(
      pageSource.includes('class="app-avatar-box"'),
      'App avatar box container must exist'
    );
    assert.ok(
      pageSource.includes('class="app-avatar-img"'),
      'App avatar img element must exist'
    );
    assert.ok(
      pageSource.includes('object-fit: contain;'),
      'App avatar must use object-fit: contain'
    );
    assert.ok(
      pageSource.includes('class="app-avatar-fallback-icon"'),
      'Fallback SVG glyph must exist when icon is null'
    );
  });
});
