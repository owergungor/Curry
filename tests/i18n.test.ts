import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translations, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/lib/i18n/index.ts';

test('i18n: All 5 supported languages are configured with exact national flag emojis', () => {
  const expected = [
    { code: 'en', flag: '🇬🇧', label: '🇬🇧 English' },
    { code: 'tr', flag: '🇹🇷', label: '🇹🇷 Türkçe' },
    { code: 'de', flag: '🇩🇪', label: '🇩🇪 Deutsch' },
    { code: 'fr', flag: '🇫🇷', label: '🇫🇷 Français' },
    { code: 'es', flag: '🇪🇸', label: '🇪🇸 Español' },
  ];

  assert.equal(SUPPORTED_LANGUAGES.length, 5);
  for (let i = 0; i < expected.length; i++) {
    assert.equal(SUPPORTED_LANGUAGES[i].code, expected[i].code);
    assert.equal(SUPPORTED_LANGUAGES[i].flag, expected[i].flag);
    assert.equal(SUPPORTED_LANGUAGES[i].label, expected[i].label);
  }
});

test('i18n: Detect missing translation keys across all 5 languages', () => {
  const languages: SupportedLanguage[] = ['en', 'tr', 'de', 'fr', 'es'];
  const baseKeys = Object.keys(translations.en);

  assert.ok(baseKeys.length >= 200, 'Base translation keys must be comprehensive');

  for (const lang of languages) {
    const langDict = translations[lang];
    assert.ok(langDict, `Language dictionary for ${lang} must exist`);

    const missingKeys: string[] = [];
    for (const key of baseKeys) {
      if (!langDict[key] || langDict[key].trim() === '') {
        missingKeys.push(key);
      }
    }

    assert.equal(
      missingKeys.length,
      0,
      `Language ${lang} has ${missingKeys.length} missing translation keys: ${missingKeys.join(', ')}`
    );
  }
});

test('i18n: Short and consistent theme names across all languages', () => {
  const themeIds = [
    'perpetuity',
    'indigo',
    'violet',
    'amethyst-haze',
    'catppuccin',
    'neon-magenta',
    'sakura',
    'burgundy',
    'amberstate',
    'mocha',
    'sage-mist',
    'zen-linen',
  ];

  for (const lang of ['en', 'tr', 'de', 'fr', 'es'] as SupportedLanguage[]) {
    for (const themeId of themeIds) {
      const key = `theme.${themeId}.name`;
      const val = translations[lang][key];
      assert.ok(val, `Theme key ${key} must exist in ${lang}`);
      // Ensure no slogans / parentheses like '(Vercel)' or long phrases exist in name
      assert.ok(
        !val.includes('(Vercel)') && !val.includes('Precision') && !val.includes('Obsidian'),
        `Theme name for ${key} in ${lang} must be short without slogan: got "${val}"`
      );
    }
  }
});

test('i18n: Apps grid and list view keys are translated in all languages', () => {
  const requiredKeys = [
    'apps.view_grid',
    'apps.view_list',
    'apps.view_mode',
    'apps.preview_btn',
    'apps.confirm_delete_title',
    'apps.confirm_delete_msg',
    'apps.fullscreen_suppressed',
    'installer.start_on_startup',
  ];

  for (const lang of ['en', 'tr', 'de', 'fr', 'es'] as SupportedLanguage[]) {
    for (const key of requiredKeys) {
      assert.ok(
        translations[lang][key],
        `Key ${key} must have non-empty translation in ${lang}`
      );
    }
  }
});
