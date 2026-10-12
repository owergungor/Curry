import type { SupportedLanguage } from './index';

class LanguageState {
  value = $state<SupportedLanguage>('en');
}

export const languageState = new LanguageState();

export function getReactiveLanguage(): SupportedLanguage {
  return languageState.value;
}

export function setReactiveLanguage(lang: SupportedLanguage): void {
  languageState.value = lang;
}
