import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '../theme/tokens';

type Variant = 'hero' | 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'small' | 'label' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color, align, style, ...rest }: Props) {
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[styles[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.text, letterSpacing: -0.8 },
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.text, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.text, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textDim },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textDim },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textFaint },
});
