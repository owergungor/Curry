export type ThemeId =
  | 'promotor-wow'
  | 'perpetuity'
  | 'catppuccin'
  | 'zen-linen'
  | 'matrix-green'
  | 'neon-magenta'
  | 'amethyst-haze'
  | 'sage-mist'
  | 'bubblegum'
  | 'amberstate';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  label: string;
  description: string;
  swatches: string[];
  glowPalette: string[];
  colors: {
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
  };
}

export const DEFAULT_THEME: ThemeId = 'promotor-wow';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'promotor-wow',
    name: 'Promotor Wow',
    label: 'Promotor Wow',
    description: 'Deep obsidian navy & electric vibrant orange-coral aura (Default)',
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
    id: 'perpetuity',
    name: 'Perpetuity',
    label: 'Perpetuity',
    description: 'Precision obsidian slate & futuristic cyan-indigo glow',
    swatches: ['#0b0f19', '#121826', '#6366f1', '#38bdf8'],
    glowPalette: ['#6366f1', '#38bdf8', '#818cf8', '#0ea5e9', '#06b6d4', '#a5b4fc', '#e0e7ff'],
    colors: {
      background: '#0b0f19',
      backgroundSecondary: '#070a11',
      surface: '#121826',
      surfaceElevated: '#1a2336',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.08)',
      accent: '#6366f1',
      accentSecondary: '#38bdf8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    label: 'Catppuccin',
    description: 'Soothing pastel lavender, mocha crust & soft mauve',
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
  {
    id: 'zen-linen',
    name: 'Zen Linen',
    label: 'Zen Linen',
    description: 'Calm organic linen, airy warm stone & refined sage-moss accents',
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
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    label: 'Matrix Green',
    description: 'High-contrast cyber matrix terminal & luminous emerald glow',
    swatches: ['#050d08', '#0a170f', '#22c55e', '#10b981'],
    glowPalette: ['#22c55e', '#10b981', '#4ade80', '#16a34a', '#86efac', '#059669'],
    colors: {
      background: '#050d08',
      backgroundSecondary: '#020704',
      surface: '#0a170f',
      surfaceElevated: '#112418',
      text: '#e6fcf0',
      textMuted: '#86efac',
      border: 'rgba(34, 197, 94, 0.22)',
      accent: '#22c55e',
      accentSecondary: '#10b981',
      success: '#22c55e',
      warning: '#eab308',
      danger: '#ef4444',
    },
  },
  {
    id: 'neon-magenta',
    name: 'Neon Magenta',
    label: 'Neon Magenta',
    description: 'Cyberpunk midnight void & high-voltage neon magenta radiance',
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
    id: 'amethyst-haze',
    name: 'Amethyst Haze',
    label: 'Amethyst Haze',
    description: 'Mystical violet aura, void purple & vivid amethyst',
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
    id: 'sage-mist',
    name: 'Sage Mist',
    label: 'Sage Mist',
    description: 'Calm botanical forest, evergreen tones & sage mint',
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
    id: 'bubblegum',
    name: 'Bubblegum',
    label: 'Bubblegum',
    description: 'Vibrant cyber-pop neon rose, velvet berry & berry noir',
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
  {
    id: 'amberstate',
    name: 'Amber Slate',
    label: 'Amberstate',
    description: 'Molten warm amber & industrial slate steel granite',
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
];

export function getThemeDefinition(id: ThemeId | string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getThemeGlowPalette(themeId: ThemeId | string): string[] {
  const theme = getThemeDefinition(themeId);
  return theme.glowPalette || THEMES[0].glowPalette;
}
