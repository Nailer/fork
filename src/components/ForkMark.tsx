import Svg, { Circle, Path } from 'react-native-svg';

import { decorative } from '../theme/a11y';
import { colors, pathColors } from '../theme/tokens';

type Props = {
  size?: number;
  /** 0→1 draw progress; 1 = fully drawn. */
  progress?: number;
  left?: string;
  right?: string;
  stem?: string;
  /** Highlights one branch (used in the journal to show the chosen path). */
  highlight?: 'left' | 'right' | null;
};

const STEM = 'M32 56 L32 34';
const LEFT = 'M32 34 C32 24 18 22 16 10';
const RIGHT = 'M32 34 C32 24 46 22 48 10';
const LEN = 30;

/** The Fork mark: one path splitting into two. Original artwork. */
export function ForkMark({
  size = 48,
  progress = 1,
  left = pathColors[0],
  right = pathColors[1],
  stem = colors.text,
  highlight = null,
}: Props) {
  const stemT = Math.min(1, progress / 0.45);
  const branchT = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));
  const dim = (side: 'left' | 'right') => (highlight && highlight !== side ? 0.28 : 1);
  const dash = (t: number) => ({ strokeDasharray: `${LEN} ${LEN}`, strokeDashoffset: LEN * (1 - t) });
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" {...decorative}>
      <Path d={STEM} stroke={stem} strokeWidth={6} strokeLinecap="round" fill="none" {...dash(stemT)} />
      <Path d={LEFT} stroke={left} strokeWidth={6} strokeLinecap="round" fill="none" opacity={dim('left')} {...dash(branchT)} />
      <Path d={RIGHT} stroke={right} strokeWidth={6} strokeLinecap="round" fill="none" opacity={dim('right')} {...dash(branchT)} />
      {branchT >= 1 ? (
        <>
          <Circle cx={16} cy={10} r={4.5} fill={left} opacity={dim('left')} />
          <Circle cx={48} cy={10} r={4.5} fill={right} opacity={dim('right')} />
        </>
      ) : null}
    </Svg>
  );
}
