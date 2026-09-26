import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { stage } from '../hooks/useProgress';
import { PATH_LETTERS } from '../domain/types';
import { colors, fonts, pathColor, space } from '../theme/tokens';
import { Text } from './Text';

export type TreePath = { id: string; title: string; twigs?: string[] };

type Props = {
  width: number;
  paths: TreePath[];
  /** 0→1 animation progress (see useProgress). */
  progress: number;
  activeId?: string | null;
  onOpen?: (id: string) => void;
  showTwigs?: boolean;
};

const ROOT_Y = 40;
const SPLIT_Y = 92;
const NODE_Y = 176;
const NODE_R = 19;
const TWIG_END = 224;

type Point = { x: number; y: number };
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Control-polygon length: always ≥ the Bézier's real length, so dashes fully cover it. */
function curve(p0: Point, c1: Point, c2: Point, p3: Point) {
  return {
    d: `M${p0.x} ${p0.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`,
    len: dist(p0, c1) + dist(c1, c2) + dist(c2, p3) + 2,
  };
}

function drawn(len: number, t: number) {
  return { strokeDasharray: `${len} ${len}`, strokeDashoffset: len * (1 - t) };
}

export function treeHeight(showTwigs: boolean) {
  return (showTwigs ? TWIG_END : NODE_Y + NODE_R) + 64;
}

/**
 * The signature Fork visual: a single decision that splits into 2–4 paths,
 * each of which can split again (deeper exploration). Drawn with SVG and
 * animated by stroke dash offsets so it renders the same on every platform.
 */
function ForkTreeBase({ width, paths, progress, activeId, onOpen, showTwigs = false }: Props) {
  const n = paths.length;
  const cx = width / 2;
  const pad = Math.max(44, width * 0.12);
  const colW = n > 1 ? (width - pad * 2) / (n - 1) : width;
  const xs = paths.map((_, i) => (n === 1 ? cx : pad + i * colW));
  const labelW = Math.min(colW - 6, 150);
  const height = treeHeight(showTwigs);
  const labelTop = (showTwigs ? TWIG_END : NODE_Y + NODE_R) + 10;

  const trunk = { d: `M${cx} ${ROOT_Y} L${cx} ${SPLIT_Y}`, len: SPLIT_Y - ROOT_Y };
  const trunkT = stage(progress, 0, 0.28);

  return (
    <View style={{ width, height }} accessibilityRole="image" accessibilityLabel={`Your decision splits into ${n} paths`}>
      <Svg width={width} height={height}>
        <Path d={trunk.d} stroke={colors.text} strokeWidth={3} strokeLinecap="round" fill="none" {...drawn(trunk.len, trunkT)} />
        <Circle cx={cx} cy={ROOT_Y} r={7} fill={colors.text} opacity={Math.min(1, progress * 6)} />

        {paths.map((p, i) => {
          const color = pathColor(i);
          const x = xs[i];
          const dimmed = activeId != null && activeId !== p.id;
          const opacity = dimmed ? 0.35 : 1;
          const branch = curve(
            { x: cx, y: SPLIT_Y },
            { x: cx, y: SPLIT_Y + 40 },
            { x, y: NODE_Y - NODE_R - 44 },
            { x, y: NODE_Y - NODE_R },
          );
          const start = 0.22 + i * 0.06;
          const branchT = stage(progress, start, start + 0.4);
          const nodeT = stage(progress, start + 0.34, start + 0.52);
          const twigT = stage(progress, 0.78, 1);
          const twigs = showTwigs ? (p.twigs ?? []).slice(0, 2) : [];
          const spread = Math.min(22, colW * 0.28);
          return (
            <GroupFragment key={p.id}>
              <Path d={branch.d} stroke={color} strokeWidth={activeId === p.id ? 4 : 3} strokeLinecap="round" fill="none" opacity={opacity} {...drawn(branch.len, branchT)} />
              {twigs.map((_, k) => {
                const tx = x + (k === 0 ? -spread : spread);
                const twig = curve(
                  { x, y: NODE_Y + NODE_R },
                  { x, y: NODE_Y + NODE_R + 14 },
                  { x: tx, y: TWIG_END - 22 },
                  { x: tx, y: TWIG_END - 6 },
                );
                return (
                  <GroupFragment key={k}>
                    <Path d={twig.d} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" opacity={opacity * 0.8} {...drawn(twig.len, twigT)} />
                    <Circle cx={tx} cy={TWIG_END - 2} r={4} fill={color} opacity={opacity * twigT} />
                  </GroupFragment>
                );
              })}
              <Circle cx={x} cy={NODE_Y} r={NODE_R * (0.6 + 0.4 * nodeT)} fill={color} opacity={opacity * nodeT} />
              <SvgText
                x={x}
                y={NODE_Y + 6}
                fontSize={16}
                fontFamily={fonts.semibold}
                fontWeight="600"
                fill={colors.bg}
                textAnchor="middle"
                opacity={nodeT}
              >
                {PATH_LETTERS[i]}
              </SvgText>
            </GroupFragment>
          );
        })}
      </Svg>

      <View style={[styles.rootLabel, { opacity: Math.min(1, progress * 4) }]} pointerEvents="none">
        <Text variant="label" color={colors.text}>
          Your decision
        </Text>
      </View>

      {paths.map((p, i) => {
        const x = xs[i];
        const start = 0.22 + i * 0.06;
        const labelT = stage(progress, start + 0.4, start + 0.6);
        return (
          <Pressable
            key={p.id}
            onPress={() => onOpen?.(p.id)}
            accessibilityRole="button"
            accessibilityLabel={`Path ${PATH_LETTERS[i]}: ${p.title}. Open details.`}
            style={({ pressed }) => [
              styles.hit,
              { left: x - labelW / 2, width: labelW, top: NODE_Y - NODE_R - 8, height: height - (NODE_Y - NODE_R - 8) },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.label, { top: labelTop - (NODE_Y - NODE_R - 8), opacity: labelT * (activeId && activeId !== p.id ? 0.5 : 1) }]}>
              <Text variant="small" color={colors.text} align="center" numberOfLines={3} style={styles.labelText}>
                {p.title}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// react-native-svg's G adds a layer on web; a keyed fragment is enough here.
function GroupFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const ForkTree = memo(ForkTreeBase);

const styles = StyleSheet.create({
  rootLabel: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' },
  hit: { position: 'absolute', alignItems: 'center' },
  label: { position: 'absolute', left: 0, right: 0, paddingHorizontal: space.xs },
  labelText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  pressed: { opacity: 0.6 },
});
