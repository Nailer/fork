import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { decorative } from '../theme/a11y';
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
  | 'edit'
  | 'branch'
  | 'infinity'
  | 'layers'
  | 'bolt'
  | 'alert'
  | 'question'
  | 'up'
  | 'swap';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

/** Original line icons drawn for Fork. Decorative — callers supply accessibility labels. */
export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.8 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...decorative}>
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'arrow' && <Path d="M5 12h13M13 6l6 6-6 6" {...p} />}
      {name === 'up' && <Path d="M12 19V6M6 11l6-6 6 6" {...p} />}
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
      {name === 'alert' && (
        <>
          <Path d="M12 4l9 16H3L12 4z" {...p} />
          <Path d="M12 10v4M12 17h.01" {...p} />
        </>
      )}
      {name === 'question' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" {...p} />
        </>
      )}
      {name === 'edit' && <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" {...p} />}
      {name === 'branch' && <Path d="M12 21v-8M12 13c0-3-5-4-6-8M12 13c0-3 5-4 6-8" {...p} />}
      {name === 'infinity' && <Path d="M7 9a3 3 0 100 6c2.5 0 7.5-6 10-6a3 3 0 110 6c-2.5 0-7.5-6-10-6z" {...p} />}
      {name === 'layers' && <Path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" {...p} />}
      {name === 'bolt' && <Path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" {...p} />}
      {name === 'swap' && <Path d="M7 7h11l-3-3M17 17H6l3 3" {...p} />}
    </Svg>
  );
}
