import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('NSIS installer: "Start Curry when Windows starts" checkbox and registry wiring', () => {
  const nsiPath = path.resolve('src-tauri/installer.nsi');
  assert.ok(fs.existsSync(nsiPath), 'installer.nsi must exist');

  const content = fs.readFileSync(nsiPath, 'utf8');

  // Verify checkbox variable definitions
  assert.ok(
    content.includes('Var RunAtStartupCheckbox'),
    'installer.nsi must define RunAtStartupCheckbox variable'
  );
  assert.ok(
    content.includes('Var RunAtStartupCheckboxState'),
    'installer.nsi must define RunAtStartupCheckboxState variable'
  );

  // Verify control creation on finish page
  assert.ok(
    content.includes('CreateWindowEx') && content.includes('$(runAtStartup)'),
    'installer.nsi must create checkbox with $(runAtStartup) localized string'
  );

  // Verify default checked behavior
  assert.ok(
    content.includes('SendMessage $RunAtStartupCheckbox ${BM_SETCHECK} ${BST_CHECKED} 0'),
    'installer.nsi must default checkbox to checked on fresh installs'
  );

  // Verify registry configuration on HKCU Run key
  assert.ok(
    content.includes('WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run"'),
    'installer.nsi must write to HKCU Run key when checked'
  );
  assert.ok(
    content.includes('DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run"'),
    'installer.nsi must delete from HKCU Run key when unchecked'
  );

  // Verify uninstaller cleans up HKCU Run key
  const uninstallerSection = content.slice(content.indexOf('Section Uninstall'));
  assert.ok(
    uninstallerSection.includes('DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run"'),
    'Uninstaller section must clean up HKCU Run key'
  );

  // Verify localization strings for all supported languages
  assert.ok(
    content.includes('LangString runAtStartup ${LANG_ENGLISH} "Start Curry when Windows starts"'),
    'installer.nsi must provide English startup string'
  );
  assert.ok(
    content.includes('LangString runAtStartup ${LANG_TURKISH}'),
    'installer.nsi must provide Turkish startup string'
  );
  assert.ok(
    content.includes('LangString runAtStartup ${LANG_GERMAN}'),
    'installer.nsi must provide German startup string'
  );
  assert.ok(
    content.includes('LangString runAtStartup ${LANG_FRENCH}'),
    'installer.nsi must provide French startup string'
  );
  assert.ok(
    content.includes('LangString runAtStartup ${LANG_SPANISH}'),
    'installer.nsi must provide Spanish startup string'
  );
});
