import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { translations } from '../src/lib/i18n/index.ts';

const PAGE_PATH = path.resolve('src/routes/+page.svelte');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');

describe('Curry v3.8 — Application Profile Editor UI Redesign Contract', () => {
  test('1. Modal dialog uses clean semantic dialog markup and header structure', () => {
    assert.ok(
      pageSource.includes('class="profile-modal-dialog card"'),
      'Modal should use profile-modal-dialog class'
    );
    assert.ok(
      pageSource.includes('class="profile-modal-header"'),
      'Header should use profile-modal-header'
    );
    assert.ok(
      pageSource.includes('class="app-avatar-box profile-modal-avatar"'),
      'Header avatar must use square neon frame container'
    );
    assert.ok(
      pageSource.includes('class="profile-modal-close-btn"'),
      'Header must contain close button in top-right'
    );
  });

  test('2. Application Identity section has cleanly aligned inputs and browse action', () => {
    assert.ok(
      pageSource.includes('id="prof-app-name"'),
      'Application name input must be present'
    );
    assert.ok(
      pageSource.includes('id="prof-exe-name"'),
      'Executable name input must be present'
    );
    assert.ok(
      pageSource.includes('id="prof-browse-btn"'),
      'Browse button must be present'
    );
    assert.ok(
      pageSource.includes('class="profile-path-card"'),
      'Path display must use clean card format'
    );
    assert.ok(
      pageSource.includes('class="profile-path-clear"'),
      'Path display must provide clear action'
    );
  });

  test('3. Profile Controls and Glow settings are logically grouped with 2-column sliders', () => {
    assert.ok(
      pageSource.includes('class="profile-status-card"'),
      'Profile enable switch must be presented as a well-aligned row card'
    );
    assert.ok(
      pageSource.includes('class="profile-sliders-grid"'),
      'Sliders must be organized in a responsive grid'
    );
    assert.ok(
      pageSource.includes('id="prof-intensity"'),
      'Intensity slider must be present'
    );
    assert.ok(
      pageSource.includes('id="prof-duration"'),
      'Duration slider must be present'
    );
    assert.ok(
      pageSource.includes('id="prof-thickness"'),
      'Border thickness slider must be present'
    );
    assert.ok(
      pageSource.includes('id="prof-rounding"'),
      'Corner rounding slider must be present'
    );
    assert.ok(
      pageSource.includes('id="modal-profile-suppress-switch"'),
      'Fullscreen suppression switch must be present'
    );
  });

  test('4. Modal footer is sticky with distinct action grouping', () => {
    assert.ok(
      pageSource.includes('class="profile-modal-footer"'),
      'Sticky footer container must be present'
    );
    assert.ok(
      pageSource.includes('class="profile-footer-left"'),
      'Footer left group must contain Delete and Preview'
    );
    assert.ok(
      pageSource.includes('class="profile-footer-right"'),
      'Footer right group must contain Cancel and Save'
    );
  });

  test('5. Application cards in Grid and List views are clickable and open edit modal', () => {
    // Grid card click
    assert.ok(
      pageSource.includes('class="app-profile-card card'),
      'Grid card must exist'
    );
    assert.ok(
      pageSource.includes('onclick={() => openEditProfileModal(profile)}'),
      'Card must open edit modal on click'
    );

    // Stop propagation on actions container
    assert.ok(
      pageSource.includes('class="app-profile-actions app-card-actions"') &&
      pageSource.includes('onclick={(e) => e.stopPropagation()}'),
      'Grid actions container must stop click propagation'
    );
    assert.ok(
      pageSource.includes('class="app-profile-list-actions"') &&
      pageSource.includes('onclick={(e) => e.stopPropagation()}'),
      'List actions container must stop click propagation'
    );
  });

  test('6. All modal translation keys exist across all 5 supported languages', () => {
    const requiredKeys = [
      'apps.modal_add_title',
      'apps.modal_edit_title',
      'apps.modal_subtitle',
      'apps.section_details',
      'apps.app_name',
      'apps.exe_name',
      'apps.browse_exe',
      'apps.path',
      'apps.enabled',
      'apps.enabled_desc',
      'apps.section_glow',
      'apps.override_color',
      'glow.animation_style',
      'glow.intensity',
      'glow.duration',
      'glow.thickness',
      'glow.corner_radius',
      'glow.optimization_title',
      'glow.monitor_target',
      'glow.fullscreen_title',
      'glow.fullscreen_sub',
      'common.delete',
      'apps.preview_btn',
      'apps.previewing',
      'common.cancel',
      'common.save',
    ];

    const locales = ['en', 'es', 'fr', 'de', 'tr'] as const;
    for (const locale of locales) {
      const dict = translations[locale];
      assert.ok(dict, `Locale ${locale} dictionary must be present`);
      for (const key of requiredKeys) {
        assert.ok(
          dict[key as keyof typeof dict],
          `Key "${key}" must be translated in locale "${locale}"`
        );
      }
    }
  });
});
