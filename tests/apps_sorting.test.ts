import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { filterAndSortProfiles } from '../src/lib/apps.ts';
import { translations } from '../src/lib/i18n/index.ts';

const profiles = [
  { id: '1', applicationName: 'Spotify', executableName: 'spotify.exe' },
  { id: '2', applicationName: 'Discord', executableName: 'discord.exe' },
  { id: '3', applicationName: 'Visual Studio Code', executableName: 'code.exe' },
];

test('empty Apps search displays every scanned profile; search remains a filter', () => {
  assert.deepEqual(filterAndSortProfiles(profiles, '', 'az').map((item) => item.id), ['2', '1', '3']);
  assert.deepEqual(filterAndSortProfiles(profiles, '  ', 'old').map((item) => item.id), ['1', '2', '3']);
  assert.deepEqual(filterAndSortProfiles(profiles, 'CODE', 'az').map((item) => item.id), ['3']);
});

test('Apps sort options produce alphabetical and insertion-order results', () => {
  assert.deepEqual(filterAndSortProfiles(profiles, '', 'az').map((item) => item.applicationName), ['Discord', 'Spotify', 'Visual Studio Code']);
  assert.deepEqual(filterAndSortProfiles(profiles, '', 'za').map((item) => item.applicationName), ['Visual Studio Code', 'Spotify', 'Discord']);
  assert.deepEqual(filterAndSortProfiles(profiles, '', 'new').map((item) => item.id), ['3', '2', '1']);
  assert.deepEqual(filterAndSortProfiles(profiles, '', 'old').map((item) => item.id), ['1', '2', '3']);
});

test('Apps controls wire sort and both view modes; labels are translated in all locales', () => {
  const page = fs.readFileSync(path.resolve('src/routes/+page.svelte'), 'utf8');
  assert.match(page, /bind:value=\{appsSortOrder\}/);
  assert.match(page, /value="az">A-Z/);
  assert.match(page, /value="za">Z-A/);
  assert.match(page, /value="new">New/);
  assert.match(page, /value="old">Old/);
  assert.match(page, /onclick=\{\(\) => setAppsViewMode\('grid'\)\}/);
  assert.match(page, /onclick=\{\(\) => setAppsViewMode\('list'\)\}/);
  assert.match(page, /\{:else if appsViewMode === "grid"\}/);
  assert.match(page, /<div class="applications-list" role="list">/);
  assert.match(page, /isScanningApps \? t\('apps\.scanning'\) : 'Scan'/);
  assert.match(page, /<span>Add<\/span>/);
  for (const locale of ['en', 'es', 'fr', 'de', 'tr'] as const) {
    assert.ok(translations[locale]['apps.sort_label']);
    assert.ok(translations[locale]['apps.sort_hint']);
  }
});
