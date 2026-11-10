import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PAGE_PATH = path.resolve('src/routes/+page.svelte');
const PACKAGE_JSON_PATH = path.resolve('package.json');
const TAURI_CONF_PATH = path.resolve('src-tauri/tauri.conf.json');
const CARGO_TOML_PATH = path.resolve('src-tauri/Cargo.toml');
const VERSION_TS_PATH = path.resolve('src/lib/version.ts');

const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf-8'));
const cargoTomlSource = fs.readFileSync(CARGO_TOML_PATH, 'utf-8');
const versionTsSource = fs.readFileSync(VERSION_TS_PATH, 'utf-8');

describe('Curry v3.9 — Grid Edit Button Styling & Release Version Alignment Contract', () => {
  test('1. Grid view Edit button uses icon-action-btn matching Preview button styling', () => {
    // Assert Grid Edit button uses icon-action-btn edit-btn instead of secondary-btn
    assert.ok(
      pageSource.includes('class="icon-action-btn edit-btn"'),
      'Grid Edit button must use icon-action-btn edit-btn to match Preview button subtle styling'
    );
    assert.ok(
      !pageSource.includes('class="secondary-btn edit-btn"'),
      'Grid Edit button must NOT use prominent secondary-btn'
    );
  });

  test('2. List view action buttons remain untouched with ghost-action-btn', () => {
    assert.ok(
      pageSource.includes('class="app-profile-list-actions"') &&
      pageSource.includes('class="ghost-action-btn"'),
      'List view must preserve ghost-action-btn for subtle list row layout'
    );
  });

  test('3. Technical manifest versions are strictly aligned to 3.9.0', () => {
    assert.equal(packageJson.version, '3.9.0', 'package.json version must be 3.9.0');
    assert.equal(tauriConf.version, '3.9.0', 'tauri.conf.json version must be 3.9.0');
    assert.ok(
      cargoTomlSource.includes('version = "3.9.0"'),
      'src-tauri/Cargo.toml version must be 3.9.0'
    );
    assert.ok(
      versionTsSource.includes('export const APP_TECH_VERSION = "3.9.0";'),
      'src/lib/version.ts APP_TECH_VERSION must be 3.9.0'
    );
  });

  test('4. User-facing version is strictly aligned to 3.9', () => {
    assert.ok(
      versionTsSource.includes('export const APP_VERSION = "3.9";'),
      'src/lib/version.ts APP_VERSION must be 3.9'
    );
  });
});
