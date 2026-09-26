export const colors = {
  bg: '#0A0B0F',
  surface: '#12141B',
  raised: '#191C25',
  line: '#262A36',
  lineStrong: '#3A3F4E',
  text: '#F3EFE6',
  textDim: '#A9ADBA',
  textFaint: '#737888',
  accent: '#F3EFE6',
  gold: '#E9C46A',
  goldDeep: '#B8913A',
  danger: '#FF8A7A',
  success: '#6FD3C1',
  overlay: 'rgba(5,6,9,0.72)',
} as const;

/** One colour per path. Paths are also always labelled A–D, never colour alone. */
export const pathColors = ['#F2B35B', '#6FD3C1', '#A594FF', '#FF8A7A'] as const;

export const pathColor = (index: number) => pathColors[index % pathColors.length];

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const MAX_CONTENT_WIDTH = 520;
