import type { SupportedLanguage } from './index';

// This module is a shared singleton, not a Svelte component. Keep its value
// plain; index.ts owns the Svelte store subscription that triggers rerenders.
let activeLanguage: SupportedLanguage = 'en';

export function getReactiveLanguage(): SupportedLanguage {
  return activeLanguage;
}

export function setReactiveLanguage(lang: SupportedLanguage): void {
  activeLanguage = lang;
}
