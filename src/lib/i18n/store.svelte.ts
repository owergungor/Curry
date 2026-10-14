import type { SupportedLanguage } from './index';

if (typeof (globalThis as any).$state === 'undefined') {
  (globalThis as any).$state = <T>(init: T) => init;
}

class LanguageState {
  value: SupportedLanguage = $state('en');
}

export const languageState = new LanguageState();

export function getReactiveLanguage(): SupportedLanguage {
  return languageState.value;
}

export function setReactiveLanguage(lang: SupportedLanguage): void {
  languageState.value = lang;
}
