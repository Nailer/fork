import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme/tokens';

export type IconName =
  | 'back'
  | 'arrow'
  | 'check'
  | 'lock'
  | 'plus'
  | 'trash'
  | 'close'
  | 'settings'
  | 'history'
  | 'spark'
  | 'compare'
  | 'offline'
  | 'info'
  | 'edit';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

/** Original line icons drawn for Fork. Decorative — callers supply accessibility labels. */
export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.8 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'arrow' && <Path d="M5 12h13M13 6l6 6-6 6" {...p} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} {...p} />
          <Path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" {...p} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'trash' && <Path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" {...p} />
        </>
      )}
      {name === 'history' && (
        <>
          <Path d="M4 12a8 8 0 102.3-5.7" {...p} />
          <Path d="M4 4v4h4M12 8v4l3 2" {...p} />
        </>
      )}
      {name === 'spark' && <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" {...p} />}
      {name === 'compare' && <Path d="M5 7h14M5 12h9M5 17h11" {...p} />}
      {name === 'offline' && <Path d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 12.5a10 10 0 015-2.6M14.5 10a10 10 0 014.5 2.5M12 20h.01" {...p} />}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 11v5M12 8h.01" {...p} />
        </>
      )}
      {name === 'edit' && <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" {...p} />}
    </Svg>
  );
}
