import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, type } from '../theme/tokens';

type Variant = keyof typeof type;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
};

const DEFAULT_COLOR: Partial<Record<Variant, string>> = {
  body: colors.textDim,
  small: colors.textDim,
  subheading: colors.textDim,
  caption: colors.textFaint,
  label: colors.textFaint,
};

export function Text({ variant = 'body', color, align, style, ...rest }: Props) {
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        type[variant] as TextStyle,
        { color: color ?? DEFAULT_COLOR[variant] ?? colors.text },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
