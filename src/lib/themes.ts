export type ThemeId =
  | 'perpetuity'
  | 'indigo'
  | 'violet'
  | 'amethyst-haze'
  | 'catppuccin'
  | 'neon-magenta'
  | 'sakura'
  | 'burgundy'
  | 'amberstate'
  | 'mocha'
  | 'sage-mist'
  | 'zen-linen';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSecondary: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  label: string;
  description: string;
  colorFamily: 'monochrome' | 'sapphire' | 'cosmic' | 'vibrant' | 'warm' | 'organic';
  familyLabel: string;
  swatches: string[];
  glowPalette: string[];
  colors: ThemeColors;
  lightColors?: ThemeColors;
}

/** Standard is the first and default theme */
export const DEFAULT_THEME: ThemeId = 'perpetuity';

export const THEMES: ThemeDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. Standard (Default)
  // ---------------------------------------------------------------------------
  {
    id: 'perpetuity',
    name: 'Standard',
    label: 'Standard',
    description: 'Precision monochrome obsidian & electric cyan-indigo glow',
    colorFamily: 'monochrome',
    familyLabel: 'Monochrome Precision',
    swatches: ['#000000', '#111111', '#0070f3', '#ffffff'],
    glowPalette: ['#0070f3', '#3291ff', '#00dfd8', '#ffffff', '#7928ca', '#ff0080'],
    colors: {
      background: '#000000',
      backgroundSecondary: '#0a0a0a',
      surface: '#111111',
      surfaceElevated: '#1a1a1a',
      text: '#ededed',
      textMuted: '#888888',
      border: 'rgba(255, 255, 255, 0.14)',
      accent: '#ffffff',
      accentSecondary: '#0070f3',
      success: '#0070f3',
      warning: '#f5a623',
      danger: '#e00000',
    },
    lightColors: {
      background: '#ffffff',
      backgroundSecondary: '#fafafa',
      surface: '#ffffff',
      surfaceElevated: '#f5f5f5',
      text: '#000000',
      textMuted: '#666666',
      border: 'rgba(0, 0, 0, 0.09)',
      accent: '#000000',
      accentSecondary: '#0070f3',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },

  // ---------------------------------------------------------------------------
  // 2. Indigo
  // ---------------------------------------------------------------------------
  {
    id: 'indigo',
    name: 'Indigo',
    label: 'Indigo',
    description: 'Deep midnight navy & high-contrast electric indigo aura',
    colorFamily: 'sapphire',
    familyLabel: 'Sapphire & Ocean Blue',
    swatches: ['#0b0f19', '#162035', '#6366f1', '#38bdf8'],
    glowPalette: ['#6366f1', '#4f46e5', '#38bdf8', '#818cf8', '#0284c7', '#c7d2fe'],
    colors: {
      background: '#0b0f19',
      backgroundSecondary: '#111827',
      surface: '#162035',
      surfaceElevated: '#1e293b',
      text: '#f0f4ff',
      textMuted: '#94a3b8',
      border: 'rgba(99, 102, 241, 0.22)',
      accent: '#6366f1',
      accentSecondary: '#38bdf8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    lightColors: {
      background: '#f4f7fc',
      backgroundSecondary: '#ebf0f9',
      surface: '#ffffff',
      surfaceElevated: '#f1f5fb',
      text: '#0f172a',
      textMuted: '#64748b',
      border: 'rgba(99, 102, 241, 0.18)',
      accent: '#4f46e5',
      accentSecondary: '#0284c7',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },

  // ---------------------------------------------------------------------------
  // GROUP 3: COSMIC PURPLE & VIOLET (Mystical Aura & Soft Pastels)
  // ---------------------------------------------------------------------------
  {
    id: 'violet',
    name: 'Violet Dusk',
    label: 'Violet Dusk',
    description: 'Twilight violet dusk, void purple & luminous neon indigo',
    colorFamily: 'cosmic',
    familyLabel: 'Cosmic Purple & Violet',
    swatches: ['#0e0c1b', '#1f1b3c', '#6366f1', '#a855f7'],
    glowPalette: ['#6366f1', '#8b5cf6', '#a855f7', '#4f46e5', '#c084fc', '#e0e7ff'],
    colors: {
      background: '#0e0c1b',
      backgroundSecondary: '#151229',
      surface: '#1f1b3c',
      surfaceElevated: '#27224b',
      text: '#f3f1ff',
      textMuted: '#a8a1d9',
      border: 'rgba(99, 102, 241, 0.25)',
      accent: '#6366f1',
      accentSecondary: '#a855f7',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e',
    },
    lightColors: {
      background: '#f8f7ff',
      backgroundSecondary: '#f0eeff',
      surface: '#ffffff',
      surfaceElevated: '#f4f2ff',
      text: '#1a103c',
      textMuted: '#6e5fa3',
      border: 'rgba(99, 102, 241, 0.2)',
      accent: '#6366f1',
      accentSecondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e',
    },
  },
  {
    id: 'amethyst-haze',
    name: 'Amethyst Haze',
    label: 'Amethyst Haze',
    description: 'Mystical violet aura, void purple & vivid amethyst',
    colorFamily: 'cosmic',
    familyLabel: 'Cosmic Purple & Violet',
    swatches: ['#0e0b16', '#191329', '#a855f7', '#ec4899'],
    glowPalette: ['#a855f7', '#ec4899', '#c084fc', '#d946ef', '#8b5cf6', '#7c3aed', '#f472b6'],
    colors: {
      background: '#0e0b16',
      backgroundSecondary: '#08060c',
      surface: '#191329',
      surfaceElevated: '#281c40',
      text: '#f5f0ff',
      textMuted: '#c084fc',
      border: 'rgba(168, 85, 247, 0.22)',
      accent: '#a855f7',
      accentSecondary: '#ec4899',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f43f5e',
    },
    lightColors: {
      background: '#faf5ff',
      backgroundSecondary: '#f3e8ff',
      surface: '#ffffff',
      surfaceElevated: '#f7edff',
      text: '#2e1065',
      textMuted: '#7e22ce',
      border: 'rgba(168, 85, 247, 0.2)',
      accent: '#9333ea',
      accentSecondary: '#c084fc',
      success: '#059669',
      warning: '#d97706',
      danger: '#e11d48',
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    label: 'Catppuccin',
    description: 'Soothing pastel lavender, mocha crust & soft mauve',
    colorFamily: 'cosmic',
    familyLabel: 'Cosmic Purple & Violet',
    swatches: ['#181825', '#1e1e2e', '#cba6f7', '#89b4fa'],
    glowPalette: ['#cba6f7', '#89b4fa', '#f5c2e7', '#94e2d5', '#b4befe', '#eba0ac', '#f2cdcd'],
    colors: {
      background: '#181825',
      backgroundSecondary: '#11111b',
      surface: '#1e1e2e',
      surfaceElevated: '#313244',
      text: '#cdd6f4',
      textMuted: '#a6adc8',
      border: 'rgba(88, 91, 112, 0.35)',
      accent: '#cba6f7',
      accentSecondary: '#89b4fa',
      success: '#a6e3a1',
      warning: '#f9e2af',
      danger: '#f38ba8',
    },
    lightColors: {
      background: '#eff1f5',
      backgroundSecondary: '#e6e9ef',
      surface: '#ffffff',
      surfaceElevated: '#dce0e8',
      text: '#4c4f69',
      textMuted: '#6c6f85',
      border: 'rgba(140, 143, 161, 0.25)',
      accent: '#8839ef',
      accentSecondary: '#1e66f5',
      success: '#40a02b',
      warning: '#df8e1d',
      danger: '#d20f39',
    },
  },

  // ---------------------------------------------------------------------------
  // GROUP 4: ELECTRIC MAGENTA & ROSE FAMILY (Cyberpunk, Velvet & Sakura)
  // ---------------------------------------------------------------------------
  {
    id: 'neon-magenta',
    name: 'Neon Magenta',
    label: 'Neon Magenta',
    description: 'Cyberpunk midnight void & high-voltage neon magenta radiance',
    colorFamily: 'vibrant',
    familyLabel: 'Electric Magenta & Rose',
    swatches: ['#0f0814', '#1a0e24', '#e11488', '#06b6d4'],
    glowPalette: ['#e11488', '#ec4899', '#f43f5e', '#d946ef', '#06b6d4', '#f472b6'],
    colors: {
      background: '#0f0814',
      backgroundSecondary: '#09040c',
      surface: '#1a0e24',
      surfaceElevated: '#29163a',
      text: '#fdf2f8',
      textMuted: '#f472b6',
      border: 'rgba(236, 72, 153, 0.22)',
      accent: '#e11488',
      accentSecondary: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#e11488',
    },
    lightColors: {
      background: '#fdf2f8',
      backgroundSecondary: '#fce7f3',
      surface: '#ffffff',
      surfaceElevated: '#fbcfe8',
      text: '#831843',
      textMuted: '#be185d',
      border: 'rgba(236, 72, 153, 0.22)',
      accent: '#db2777',
      accentSecondary: '#0891b2',
      success: '#059669',
      warning: '#d97706',
      danger: '#e11488',
    },
  },

  {
    id: 'sakura',
    name: 'Sakura Dawn',
    label: 'Sakura Dawn',
    description: 'Soft cherry blossom dawn & delicate rose quartz illumination',
    colorFamily: 'vibrant',
    familyLabel: 'Electric Magenta & Rose',
    swatches: ['#180d13', '#2e1a26', '#f43f5e', '#fda4af'],
    glowPalette: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#fecdd3', '#ffe4e6'],
    colors: {
      background: '#180d13',
      backgroundSecondary: '#22131c',
      surface: '#2e1a26',
      surfaceElevated: '#361f2d',
      text: '#fff0f6',
      textMuted: '#deabc2',
      border: 'rgba(244, 63, 94, 0.25)',
      accent: '#f43f5e',
      accentSecondary: '#fda4af',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#e11d48',
    },
    lightColors: {
      background: '#fff5f8',
      backgroundSecondary: '#ffeaf1',
      surface: '#ffffff',
      surfaceElevated: '#fff0f4',
      text: '#3b1024',
      textMuted: '#8e4467',
      border: 'rgba(244, 63, 94, 0.18)',
      accent: '#e11d48',
      accentSecondary: '#f43f5e',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#e11d48',
    },
  },
  {
    id: 'burgundy',
    name: 'Burgundy Wine',
    label: 'Burgundy Wine',
    description: 'Deep royal wine, dark crimson & velvety plum aura',
    colorFamily: 'vibrant',
    familyLabel: 'Electric Magenta & Rose',
    swatches: ['#15080c', '#26121b', '#e11d48', '#be123c'],
    glowPalette: ['#e11d48', '#be123c', '#9f1239', '#fb7185', '#fda4af', '#881337'],
    colors: {
      background: '#15080c',
      backgroundSecondary: '#1c0d12',
      surface: '#26121b',
      surfaceElevated: '#2e1621',
      text: '#fde8ef',
      textMuted: '#c997a8',
      border: 'rgba(225, 29, 72, 0.25)',
      accent: '#e11d48',
      accentSecondary: '#be123c',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#be123c',
    },
    lightColors: {
      background: '#fff1f4',
      backgroundSecondary: '#ffe4ea',
      surface: '#ffffff',
      surfaceElevated: '#ffebf0',
      text: '#4c0519',
      textMuted: '#9f1239',
      border: 'rgba(225, 29, 72, 0.2)',
      accent: '#be123c',
      accentSecondary: '#e11d48',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#9f1239',
    },
  },

  // ---------------------------------------------------------------------------
  // GROUP 5: WARM AMBER & EARTH FAMILY (Fire, Sunlight & Velvety Mocha)
  // ---------------------------------------------------------------------------
  {
    id: 'amberstate',
    name: 'Amber Slate',
    label: 'Amberstate',
    description: 'Molten warm amber & industrial slate steel granite',
    colorFamily: 'warm',
    familyLabel: 'Warm Amber & Earth',
    swatches: ['#0d1117', '#161b22', '#f59e0b', '#ea580c'],
    glowPalette: ['#f59e0b', '#ea580c', '#d97706', '#fbbf24', '#f97316', '#c2410c', '#fde68a'],
    colors: {
      background: '#0d1117',
      backgroundSecondary: '#080a0e',
      surface: '#161b22',
      surfaceElevated: '#212833',
      text: '#f8fafc',
      textMuted: '#cbd5e1',
      border: 'rgba(245, 158, 11, 0.22)',
      accent: '#f59e0b',
      accentSecondary: '#ea580c',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    lightColors: {
      background: '#fffbeb',
      backgroundSecondary: '#fef3c7',
      surface: '#ffffff',
      surfaceElevated: '#fde68a',
      text: '#451a03',
      textMuted: '#92400e',
      border: 'rgba(245, 158, 11, 0.22)',
      accent: '#d97706',
      accentSecondary: '#ea580c',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
    },
  },
  {
    id: 'mocha',
    name: 'Mocha Mousse',
    label: 'Mocha Mousse',
    description: 'Rich velvety espresso, warm caramel & toasted cocoa',
    colorFamily: 'warm',
    familyLabel: 'Warm Amber & Earth',
    swatches: ['#16110d', '#281f19', '#d97706', '#b45309'],
    glowPalette: ['#d97706', '#b45309', '#92400e', '#f59e0b', '#fbbf24', '#78350f'],
    colors: {
      background: '#16110d',
      backgroundSecondary: '#1e1712',
      surface: '#281f19',
      surfaceElevated: '#31261e',
      text: '#f9f0e8',
      textMuted: '#c4aea0',
      border: 'rgba(217, 119, 6, 0.25)',
      accent: '#d97706',
      accentSecondary: '#b45309',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    lightColors: {
      background: '#fbf6f1',
      backgroundSecondary: '#f4eae1',
      surface: '#ffffff',
      surfaceElevated: '#f7efe7',
      text: '#332014',
      textMuted: '#735643',
      border: 'rgba(180, 83, 9, 0.2)',
      accent: '#b45309',
      accentSecondary: '#d97706',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },

  // ---------------------------------------------------------------------------
  // GROUP 6: ORGANIC NATURE & BOTANICAL (Calm Forest & Organic Linen)
  // ---------------------------------------------------------------------------
  {
    id: 'sage-mist',
    name: 'Sage Mist',
    label: 'Sage Mist',
    description: 'Calm botanical forest, evergreen tones & sage mint',
    colorFamily: 'organic',
    familyLabel: 'Organic Nature & Linen',
    swatches: ['#0c1310', '#121e18', '#34d399', '#14b8a6'],
    glowPalette: ['#34d399', '#14b8a6', '#10b981', '#059669', '#6ee7b7', '#2dd4bf', '#a7f3d0'],
    colors: {
      background: '#0c1310',
      backgroundSecondary: '#070b09',
      surface: '#121e18',
      surfaceElevated: '#1a2c24',
      text: '#ecfdf5',
      textMuted: '#a7f3d0',
      border: 'rgba(52, 211, 153, 0.22)',
      accent: '#34d399',
      accentSecondary: '#14b8a6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f87171',
    },
    lightColors: {
      background: '#f0fdf4',
      backgroundSecondary: '#dcfce7',
      surface: '#ffffff',
      surfaceElevated: '#bbf7d0',
      text: '#064e3b',
      textMuted: '#047857',
      border: 'rgba(52, 211, 153, 0.24)',
      accent: '#059669',
      accentSecondary: '#0d9488',
      success: '#059669',
      warning: '#d97706',
      danger: '#e11d48',
    },
  },
  {
    id: 'zen-linen',
    name: 'Zen Linen',
    label: 'Zen Linen',
    description: 'Calm organic linen, airy warm stone & refined sage-moss accents',
    colorFamily: 'organic',
    familyLabel: 'Organic Nature & Linen',
    swatches: ['#f7f6f2', '#fcfbfa', '#5c6753', '#8a957f'],
    glowPalette: ['#5c6753', '#8a957f', '#727e69', '#3e4638', '#a4af9a', '#c2cbba'],
    colors: {
      background: '#181714',
      backgroundSecondary: '#12110e',
      surface: '#201f1b',
      surfaceElevated: '#2a2924',
      text: '#f7f6f2',
      textMuted: '#8e8a7d',
      border: 'rgba(180, 175, 160, 0.16)',
      accent: '#7a8870',
      accentSecondary: '#a4af9a',
      success: '#2d6a4f',
      warning: '#b8860b',
      danger: '#b91c1c',
    },
    lightColors: {
      background: '#f7f6f2',
      backgroundSecondary: '#efeee9',
      surface: '#fcfbfa',
      surfaceElevated: '#e8e6df',
      text: '#1c1b18',
      textMuted: '#706d64',
      border: 'rgba(120, 115, 105, 0.22)',
      accent: '#5c6753',
      accentSecondary: '#8a957f',
      success: '#2d6a4f',
      warning: '#b8860b',
      danger: '#b91c1c',
    },
  },
];

export function getThemeDefinition(id: ThemeId | string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getThemeGlowPalette(themeId: ThemeId | string): string[] {
  const theme = getThemeDefinition(themeId);
  return theme.glowPalette || THEMES[0].glowPalette;
}
