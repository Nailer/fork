/**
 * Fork design tokens. Every colour, size and radius in the app comes from here.
 * Direction: calm ink background, warm ivory type and actions, and one hue per
 * path so branches read instantly (always paired with an A–D letter).
 */

export const colors = {
  // Surfaces, darkest to lightest
  bg: '#08090D',
  bgTop: '#0E1019',
  surface: '#10131A',
  card: '#151922',
  raised: '#1C2130',
  // Lines
  line: '#232836',
  lineStrong: '#353B4C',
  // Type (all pass WCAG AA on bg and card)
  text: '#F5F3EE',
  textDim: '#B4B8C5',
  textFaint: '#7F8496',
  // Brand and semantic
  accent: '#F5F3EE', // primary action: warm ivory
  iris: '#A99BFF', // secondary accent: focus, links, "intelligence"
  gold: '#E8C170', // premium (Fork Pro)
  goldDeep: '#B8913A',
  success: '#5ED3C0',
  warning: '#F5B65C',
  danger: '#FF8A7A',
  overlay: 'rgba(4,5,8,0.78)',
} as const;

/** One colour per path. Paths are also always labelled A–D, never colour alone. */
export const pathColors = ['#F5B65C', '#5ED3C0', '#A99BFF', '#FF8A7A'] as const;

export const pathColor = (index: number) => pathColors[index % pathColors.length];

/** Appends an alpha channel to a #RRGGBB colour, e.g. alpha('#FFFFFF', 0.2). */
export const alpha = (hex: string, a: number) =>
  hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

/** 4-pt spacing scale. */
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Type scale: size / line height / tracking. */
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  subheading: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.1 },
  label: { fontFamily: fonts.semibold, fontSize: 11.5, lineHeight: 16, letterSpacing: 1.3, textTransform: 'uppercase' as const },
} as const;

/** Subtle depth. boxShadow works on web and the new architecture on iOS/Android. */
export const elevation = {
  card: { boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.35)' },
  raised: { boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 18px 50px rgba(0,0,0,0.5)' },
} as const;

export const motion = { fast: 180, base: 260, slow: 420 } as const;

export const MAX_CONTENT_WIDTH = 520;
