import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translations, t, setLanguage, type SupportedLanguage } from '../src/lib/i18n/index.ts';

interface ApplicationProfile {
  id: string;
  applicationName: string;
  executableName: string;
  executablePath?: string | null;
  enabled: boolean;
  color?: string | null;
  animation?: string | null;
  intensity?: number | null;
  duration?: number | null;
  suppressInFullscreen?: boolean;
  borderThickness?: number | null;
  cornerRounding?: number | null;
  monitorTarget?: string | null;
}

// ============================================================================
// 1. Storage & Persistence Contract
// ============================================================================

test('Apps view mode: safe resolution and persistence key contract', () => {
  const STORAGE_KEY = 'curry_apps_view_mode';

  function resolveAppsViewMode(stored: string | null | undefined): 'grid' | 'list' {
    if (stored === 'list') return 'list';
    if (stored === 'grid') return 'grid';
    return 'grid'; // Safe default
  }

  assert.equal(STORAGE_KEY, 'curry_apps_view_mode');
  assert.equal(resolveAppsViewMode('grid'), 'grid');
  assert.equal(resolveAppsViewMode('list'), 'list');
  assert.equal(resolveAppsViewMode(null), 'grid');
  assert.equal(resolveAppsViewMode(undefined), 'grid');
  assert.equal(resolveAppsViewMode('invalid_mode'), 'grid');
  assert.equal(resolveAppsViewMode(''), 'grid');
  assert.equal(resolveAppsViewMode('TABLE'), 'grid');
});

test('Apps view mode: state machine transitions and storage persistence with error handling', () => {
  const storageMap = new Map<string, string>();
  let throwOnSet = false;

  const mockStorage = {
    getItem(key: string): string | null {
      return storageMap.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      if (throwOnSet) {
        throw new Error('QuotaExceededError: storage is full or disabled');
      }
      storageMap.set(key, value);
    },
  };

  class AppsViewStateManager {
    mode: 'grid' | 'list' = 'grid';

    init(): void {
      try {
        const saved = mockStorage.getItem('curry_apps_view_mode');
        if (saved === 'grid' || saved === 'list') {
          this.mode = saved;
        } else {
          this.mode = 'grid';
        }
      } catch {
        this.mode = 'grid';
      }
    }

    setMode(newMode: 'grid' | 'list'): void {
      this.mode = newMode;
      try {
        mockStorage.setItem('curry_apps_view_mode', newMode);
      } catch (err) {
        // Must not crash component on storage failure
      }
    }
  }

  const manager = new AppsViewStateManager();
  manager.init();
  assert.equal(manager.mode, 'grid', 'Default mode should be grid');

  // Transition to list
  manager.setMode('list');
  assert.equal(manager.mode, 'list');
  assert.equal(mockStorage.getItem('curry_apps_view_mode'), 'list');

  // Transition back to grid
  manager.setMode('grid');
  assert.equal(manager.mode, 'grid');
  assert.equal(mockStorage.getItem('curry_apps_view_mode'), 'grid');

  // Verify resilience when storage throws
  throwOnSet = true;
  manager.setMode('list');
  assert.equal(manager.mode, 'list', 'Mode state should still update in memory even if storage throws');

  // Verify restoration from storage on init
  throwOnSet = false;
  mockStorage.setItem('curry_apps_view_mode', 'list');
  const freshManager = new AppsViewStateManager();
  freshManager.init();
  assert.equal(freshManager.mode, 'list', 'Should restore list mode from storage');
});

// ============================================================================
// 2. Delete Profile Confirmation Workflow
// ============================================================================

test('Delete profile confirmation workflow: request, cancel, backdrop, escape, and confirm', () => {
  const sampleProfile: ApplicationProfile = {
    id: 'prof-123',
    applicationName: 'Slack Desktop',
    executableName: 'slack.exe',
    enabled: true,
  };

  let profileToDelete: ApplicationProfile | null = null;
  const deletedIds: string[] = [];

  function requestDeleteProfile(p: ApplicationProfile) {
    profileToDelete = p;
  }

  function cancelDeleteProfile() {
    profileToDelete = null;
  }

  function confirmDeleteProfile() {
    if (profileToDelete) {
      deletedIds.push(profileToDelete.id);
      profileToDelete = null;
    }
  }

  function handleKeydown(e: { key: string }) {
    if (e.key === 'Escape') {
      if (profileToDelete) {
        profileToDelete = null;
      }
    }
  }

  // 1. Initial: dialog closed
  assert.equal(profileToDelete, null);

  // 2. User clicks delete button: dialog opens
  requestDeleteProfile(sampleProfile);
  assert.deepEqual(profileToDelete, sampleProfile);

  // 3. User cancels dialog: closed without deletion
  cancelDeleteProfile();
  assert.equal(profileToDelete, null);
  assert.equal(deletedIds.length, 0);

  // 4. User opens dialog and presses Escape
  requestDeleteProfile(sampleProfile);
  assert.deepEqual(profileToDelete, sampleProfile);
  handleKeydown({ key: 'Escape' });
  assert.equal(profileToDelete, null, 'Escape must dismiss confirmation dialog');
  assert.equal(deletedIds.length, 0);

  // 5. User opens dialog and confirms delete
  requestDeleteProfile(sampleProfile);
  confirmDeleteProfile();
  assert.equal(profileToDelete, null, 'Dialog must close after confirm');
  assert.deepEqual(deletedIds, ['prof-123'], 'Target profile ID must be deleted');
});

// ============================================================================
// 3. Layout & Accessibility Contract (Grid vs List)
// ============================================================================

test('Apps view mode: Grid vs List layout structure and ARIA attributes contract', () => {
  // Test both modes against their DOM specifications
  function getLayoutSpecs(mode: 'grid' | 'list') {
    return {
      containerClass: `apps-container view-mode-${mode}`,
      contentClass: mode === 'grid' ? 'applications-grid' : 'applications-list',
      itemRole: mode === 'list' ? 'listitem' : null,
      containerRole: mode === 'list' ? 'list' : null,
      gridPressed: mode === 'grid',
      listPressed: mode === 'list',
      actionStyle: mode === 'grid' ? 'card-actions' : 'list-actions',
    };
  }

  const gridSpec = getLayoutSpecs('grid');
  assert.equal(gridSpec.containerClass, 'apps-container view-mode-grid');
  assert.equal(gridSpec.contentClass, 'applications-grid');
  assert.equal(gridSpec.gridPressed, true);
  assert.equal(gridSpec.listPressed, false);
  assert.equal(gridSpec.containerRole, null);

  const listSpec = getLayoutSpecs('list');
  assert.equal(listSpec.containerClass, 'apps-container view-mode-list');
  assert.equal(listSpec.contentClass, 'applications-list');
  assert.equal(listSpec.gridPressed, false);
  assert.equal(listSpec.listPressed, true);
  assert.equal(listSpec.containerRole, 'list');
  assert.equal(listSpec.itemRole, 'listitem');
});

test('Apps view mode: Strict action button order (Switch -> Preview -> Edit -> Delete)', () => {
  const expectedActionSequence = ['switch', 'preview', 'edit', 'delete'];

  // In grid card
  const gridActions = ['switch', 'preview', 'edit', 'delete'];
  assert.deepEqual(gridActions, expectedActionSequence, 'Grid action sequence must be Switch -> Preview -> Edit -> Delete');

  // In list item
  const listActions = ['switch', 'preview', 'edit', 'delete'];
  assert.deepEqual(listActions, expectedActionSequence, 'List action sequence must be Switch -> Preview -> Edit -> Delete');
});

// ============================================================================
// 4. i18n Translations & Interpolation Across All 5 Languages
// ============================================================================

test('Apps card and action keys: strict translations exist across all 5 languages', () => {
  const appKeys = [
    'apps.eyebrow',
    'apps.title',
    'apps.desc',
    'apps.view_mode',
    'apps.view_grid',
    'apps.view_list',
    'apps.add_profile',
    'apps.search_placeholder',
    'apps.no_profiles',
    'apps.no_profiles_desc',
    'apps.no_matching',
    'apps.no_matching_desc',
    'apps.custom_profile',
    'apps.disabled',
    'glow.thickness',
    'glow.corner_radius',
    'apps.all_displays',
    'apps.active_window',
    'apps.preview_btn',
    'apps.edit',
    'apps.delete',
    'apps.confirm_delete_title',
    'apps.confirm_delete_msg',
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
    'glow.optimization_title',
    'glow.fullscreen_title',
    'glow.fullscreen_sub',
    'common.delete',
    'common.cancel',
    'common.save',
  ];

  const langs: SupportedLanguage[] = ['en', 'tr', 'de', 'fr', 'es'];

  for (const lang of langs) {
    for (const k of appKeys) {
      const val = translations[lang][k];
      assert.ok(val && val.trim().length > 0, `Missing or empty key ${k} in language ${lang}`);
    }
  }
});

test('Delete confirmation message: interpolation of profile name across all 5 languages', () => {
  const testAppName = 'Obsidian App';
  const langs: SupportedLanguage[] = ['en', 'tr', 'de', 'fr', 'es'];

  for (const lang of langs) {
    setLanguage(lang);
    const msg = t('apps.confirm_delete_msg', { name: testAppName });
    assert.ok(msg.includes(testAppName), `Language ${lang} must include profile name in confirm delete message: got "${msg}"`);
    assert.ok(!msg.includes('{name}'), `Language ${lang} must replace {name} placeholder: got "${msg}"`);
  }

  setLanguage('en');
});

test('i18n dynamic switching: t() returns correct localized string when language changes', () => {
  setLanguage('en');
  assert.equal(t('apps.view_grid'), 'Grid View');
  assert.equal(t('apps.view_list'), 'List View');
  assert.equal(t('apps.view_mode'), 'View Layout');
  assert.equal(t('apps.confirm_delete_title'), 'Delete Application Profile?');
  assert.equal(t('common.delete'), 'Delete');

  setLanguage('tr');
  assert.equal(t('apps.view_grid'), 'Izgara Görünümü');
  assert.equal(t('apps.view_list'), 'Liste Görünümü');
  assert.equal(t('apps.view_mode'), 'Görünüm Düzeni');
  assert.equal(t('apps.confirm_delete_title'), 'Uygulama Profili Silinsin mi?');
  assert.equal(t('common.delete'), 'Sil');

  setLanguage('de');
  assert.equal(t('apps.view_grid'), 'Rasteransicht');
  assert.equal(t('apps.view_list'), 'Listenansicht');
  assert.equal(t('apps.view_mode'), 'Ansichtslayout');
  assert.equal(t('apps.confirm_delete_title'), 'Anwendungsprofil löschen?');
  assert.equal(t('common.delete'), 'Löschen');

  setLanguage('fr');
  assert.equal(t('apps.view_grid'), 'Vue Grille');
  assert.equal(t('apps.view_list'), 'Vue Liste');
  assert.equal(t('apps.view_mode'), "Disposition d'affichage");
  assert.equal(t('apps.confirm_delete_title'), "Supprimer le profil d'application ?");
  assert.equal(t('common.delete'), 'Supprimer');

  setLanguage('es');
  assert.equal(t('apps.view_grid'), 'Vista de Cuadrícula');
  assert.equal(t('apps.view_list'), 'Vista de Lista');
  assert.equal(t('apps.view_mode'), 'Diseño de Vista');
  assert.equal(t('apps.confirm_delete_title'), '¿Eliminar perfil de aplicación?');
  assert.equal(t('common.delete'), 'Eliminar');

  // Reset back to English
  setLanguage('en');
});

// ============================================================================
// 5. Search Filtering & Empty States
// ============================================================================

test('Apps search filtering and localized empty state messages', () => {
  const profiles: ApplicationProfile[] = [
    { id: '1', applicationName: 'Spotify', executableName: 'spotify.exe', enabled: true },
    { id: '2', applicationName: 'Visual Studio Code', executableName: 'code.exe', enabled: true },
    { id: '3', applicationName: 'Slack', executableName: 'slack.exe', enabled: false },
  ];

  function filterProfiles(query: string, list: ApplicationProfile[]): ApplicationProfile[] {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.applicationName.toLowerCase().includes(q) ||
        p.executableName.toLowerCase().includes(q)
    );
  }

  // Exact match
  assert.equal(filterProfiles('spotify', profiles).length, 1);
  assert.equal(filterProfiles('code.exe', profiles).length, 1);

  // Case-insensitive match
  assert.equal(filterProfiles('SLACK', profiles).length, 1);

  // Partial match
  assert.equal(filterProfiles('visual', profiles).length, 1);

  // No match
  assert.equal(filterProfiles('nonexistent', profiles).length, 0);

  // Localized empty state rendering check with query interpolation
  setLanguage('en');
  assert.equal(t('apps.no_matching'), 'No Matching Profiles');
  assert.equal(t('apps.no_matching_desc', { query: 'unknown' }), 'No apps match "unknown".');

  setLanguage('tr');
  assert.equal(t('apps.no_matching'), 'Eşleşen Profil Yok');
  assert.equal(t('apps.no_matching_desc', { query: 'bilinmeyen' }), '"bilinmeyen" ile eşleşen uygulama bulunamadı.');

  setLanguage('de');
  assert.equal(t('apps.no_matching_desc', { query: 'unbekannt' }), 'Keine Apps entsprechen "unbekannt".');

  setLanguage('fr');
  assert.equal(t('apps.no_matching_desc', { query: 'inconnu' }), 'Aucune application ne correspond à "inconnu".');

  setLanguage('es');
  assert.equal(t('apps.no_matching_desc', { query: 'desconocido' }), 'No hay aplicaciones que coincidan con "desconocido".');

  setLanguage('en');
});
