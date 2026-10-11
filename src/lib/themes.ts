export type ThemeId =
  | 'promotor-wow'
  | 'amberstate'
  | 'perpetuity'
  | 'amethyst-haze'
  | 'catppuccin'
  | 'neon-magenta'
  | 'bubblegum'
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
  colorFamily: 'warm' | 'monochrome' | 'cosmic' | 'vibrant' | 'organic';
  familyLabel: string;
  swatches: string[];
  glowPalette: string[];
  colors: ThemeColors;
  labelKey?: string;
  descKey?: string;
  darkColors?: ThemeColors;
}

export const DEFAULT_THEME: ThemeId = 'promotor-wow';

export const THEMES: ThemeDefinition[] = [
  // ---------------------------------------------------------------------------
  // GROUP 1: WARM & AMBER FAMILY (Fire, Sunlight & Radiant Warmth)
  // ---------------------------------------------------------------------------
  {
    id: 'promotor-wow',
    name: 'Promotor Wow',
    label: 'Promotor Wow',
    description: 'Deep obsidian navy & electric vibrant orange-coral aura (Default)',
    colorFamily: 'warm',
    familyLabel: 'Warm & Amber Family',
    swatches: ['#0c0e14', '#131722', '#ff5c00', '#ff8a00'],
    glowPalette: ['#ff5c00', '#ff8a00', '#ffaa33', '#f97316', '#ea580c', '#fdba74'],
    colors: {
      background: '#0c0e14',
      backgroundSecondary: '#07080c',
      surface: '#131722',
      surfaceElevated: '#1c2233',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.08)',
      accent: '#ff5c00',
      accentSecondary: '#ff8a00',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'amberstate',
    name: 'Amber Slate',
    label: 'Amberstate',
    description: 'Molten warm amber & industrial slate steel granite',
    colorFamily: 'warm',
    familyLabel: 'Warm & Amber Family',
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
  },

  // ---------------------------------------------------------------------------
  // GROUP 2: MONOCHROME PRECISION (Standard - Vercel Design Language)
  // ---------------------------------------------------------------------------
  {
    id: 'perpetuity',
    name: 'Standard (Vercel)',
    label: 'Standard',
    description: 'Precision monochrome obsidian & electric cyan-indigo glow',
    colorFamily: 'monochrome',
    familyLabel: 'Monochrome Precision (Vercel)',
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
  },

  // ---------------------------------------------------------------------------
  // GROUP 3: COSMIC PURPLE & VIOLET (Mystical Aura & Soft Pastels)
  // ---------------------------------------------------------------------------
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
  },

  // ---------------------------------------------------------------------------
  // GROUP 4: ELECTRIC MAGENTA & PINK ROSE (Cyberpunk & Velvet Pop)
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
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    label: 'Bubblegum',
    description: 'Vibrant cyber-pop neon rose, velvet berry & berry noir',
    colorFamily: 'vibrant',
    familyLabel: 'Electric Magenta & Rose',
    swatches: ['#140a14', '#221022', '#f43f5e', '#c084fc'],
    glowPalette: ['#f43f5e', '#c084fc', '#fb7185', '#e11d48', '#ec4899', '#f472b6', '#fda4af'],
    colors: {
      background: '#140a14',
      backgroundSecondary: '#0c050c',
      surface: '#221022',
      surfaceElevated: '#321832',
      text: '#fdf2f8',
      textMuted: '#fda4af',
      border: 'rgba(244, 63, 94, 0.22)',
      accent: '#f43f5e',
      accentSecondary: '#c084fc',
      success: '#4ade80',
      warning: '#facc15',
      danger: '#e11d48',
    },
  },

  // ---------------------------------------------------------------------------
  // GROUP 5: ORGANIC NATURE & EARTH (Botanical Mint & Warm Linen)
  // ---------------------------------------------------------------------------
  {
    id: 'sage-mist',
    name: 'Sage Mist',
    label: 'Sage Mist',
    description: 'Calm botanical forest, evergreen tones & sage mint',
    colorFamily: 'organic',
    familyLabel: 'Organic Nature & Earth',
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
  },
  {
    id: 'zen-linen',
    name: 'Zen Linen',
    label: 'Zen Linen',
    description: 'Calm organic linen, airy warm stone & refined sage-moss accents',
    colorFamily: 'organic',
    familyLabel: 'Organic Nature & Earth',
    swatches: ['#f7f6f2', '#fcfbfa', '#5c6753', '#8a957f'],
    glowPalette: ['#5c6753', '#8a957f', '#727e69', '#3e4638', '#a4af9a', '#c2cbba'],
    colors: {
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
    darkColors: {
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
  },
];

export function getThemeDefinition(id: ThemeId | string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getThemeGlowPalette(themeId: ThemeId | string): string[] {
  const theme = getThemeDefinition(themeId);
  return theme.glowPalette || THEMES[0].glowPalette;
}
