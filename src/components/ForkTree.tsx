import { memo, useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { PATH_LETTERS } from '../domain/types';
import { stage, useReducedMotion } from '../hooks/useProgress';
import { colors, fonts, pathColor, space } from '../theme/tokens';
import { Text } from './Text';
import { NATIVE_DRIVER } from './ui';

export type TreePath = { id: string; title: string; twigs?: string[] };

type Props = {
  width: number;
  paths: TreePath[];
  /** 0→1 animation progress (see useProgress). */
  progress: number;
  activeId?: string | null;
  /** Called when a node is tapped. */
  onSelect?: (id: string) => void;
  showTwigs?: boolean;
  /** Hides labels — used for the ambient analysis animation. */
  bare?: boolean;
};

const ROOT_Y = 44;
const SPLIT_Y = 100;
const NODE_Y = 188;
const NODE_R = 20;
const TWIG_END = 238;

type Point = { x: number; y: number };
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Control-polygon length: always ≥ the Bézier's real length, so dashes fully cover it. */
function curve(p0: Point, c1: Point, c2: Point, p3: Point) {
  return {
    d: `M${p0.x} ${p0.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`,
    len: dist(p0, c1) + dist(c1, c2) + dist(c2, p3) + 2,
  };
}

const drawn = (len: number, t: number) => ({ strokeDasharray: `${len} ${len}`, strokeDashoffset: len * (1 - t) });

export function treeHeight(showTwigs: boolean, bare = false) {
  const base = showTwigs ? TWIG_END : NODE_Y + NODE_R;
  return base + (bare ? 12 : 64);
}

/** A soft pulsing ring behind the selected node. Runs on the native driver; off with reduced motion. */
function Halo({ x, y, color }: { x: number; y: number; color: string }) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  const size = NODE_R * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: reduced ? 0.4 : v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
        transform: [{ scale: reduced ? 1.35 : v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
      }}
    />
  );
}

/**
 * The signature Fork visual: one decision that splits into 2–4 paths, each of
 * which can split again (deeper exploration). SVG stroke-dash animation keeps
 * it identical on iOS, Android and web.
 */
function ForkTreeBase({ width, paths, progress, activeId, onSelect, showTwigs = false, bare = false }: Props) {
  const n = paths.length;
  const cx = width / 2;
  const pad = Math.max(46, width * 0.13);
  const colW = n > 1 ? (width - pad * 2) / (n - 1) : width;
  const xs = paths.map((_, i) => (n === 1 ? cx : pad + i * colW));
  const labelW = Math.min(colW - 6, 150);
  const height = treeHeight(showTwigs, bare);
  const labelTop = (showTwigs ? TWIG_END : NODE_Y + NODE_R) + 12;
  const trunkT = stage(progress, 0, 0.26);
  const rootT = Math.min(1, progress * 5);
  const activeIndex = paths.findIndex((p) => p.id === activeId);

  return (
    <View style={{ width, height }} accessibilityRole="image" accessibilityLabel={`Your decision splits into ${n} paths`}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="rootGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.text} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.text} stopOpacity={0} />
          </RadialGradient>
          {paths.map((p, i) => (
            <LinearGradient key={p.id} id={`g${i}`} x1={cx} y1={SPLIT_Y} x2={xs[i]} y2={NODE_Y} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={colors.text} stopOpacity={0.9} />
              <Stop offset="0.55" stopColor={pathColor(i)} stopOpacity={1} />
            </LinearGradient>
          ))}
          {paths.map((p, i) => (
            <RadialGradient key={`n${p.id}`} id={`ng${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={pathColor(i)} stopOpacity={0.35} />
              <Stop offset="1" stopColor={pathColor(i)} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        <Circle cx={cx} cy={ROOT_Y} r={26 * rootT} fill="url(#rootGlow)" />
        <Path
          d={`M${cx} ${ROOT_Y} L${cx} ${SPLIT_Y}`}
          stroke={colors.text}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          {...drawn(SPLIT_Y - ROOT_Y, trunkT)}
        />
        <Circle cx={cx} cy={ROOT_Y} r={8} fill={colors.bg} stroke={colors.text} strokeWidth={2.5} opacity={rootT} />
        <Circle cx={cx} cy={ROOT_Y} r={3.5} fill={colors.text} opacity={rootT} />

        {paths.map((p, i) => {
          const color = pathColor(i);
          const x = xs[i];
          const isActive = activeId === p.id;
          const opacity = activeId != null && !isActive ? 0.28 : 1;
          const branch = curve(
            { x: cx, y: SPLIT_Y },
            { x: cx, y: SPLIT_Y + 44 },
            { x, y: NODE_Y - NODE_R - 48 },
            { x, y: NODE_Y - NODE_R - 3 },
          );
          const start = 0.2 + i * 0.07;
          const branchT = stage(progress, start, start + 0.4);
          const nodeT = stage(progress, start + 0.32, start + 0.5);
          const twigT = stage(progress, 0.78, 1);
          const twigs = showTwigs ? (p.twigs ?? []).slice(0, 2) : [];
          const spread = Math.min(22, colW * 0.28);
          return (
            <Group key={p.id}>
              <Path
                d={branch.d}
                stroke={`url(#g${i})`}
                strokeWidth={isActive ? 4.5 : 3}
                strokeLinecap="round"
                fill="none"
                opacity={opacity}
                {...drawn(branch.len, branchT)}
              />
              {twigs.map((_, k) => {
                const tx = x + (k === 0 ? -spread : spread);
                const twig = curve(
                  { x, y: NODE_Y + NODE_R + 2 },
                  { x, y: NODE_Y + NODE_R + 14 },
                  { x: tx, y: TWIG_END - 22 },
                  { x: tx, y: TWIG_END - 6 },
                );
                return (
                  <Group key={k}>
                    <Path d={twig.d} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" opacity={opacity * 0.75} {...drawn(twig.len, twigT)} />
                    <Circle cx={tx} cy={TWIG_END - 2} r={4} fill={colors.bg} stroke={color} strokeWidth={2} opacity={opacity * twigT} />
                  </Group>
                );
              })}
              <Circle cx={x} cy={NODE_Y} r={NODE_R * 1.9 * nodeT} fill={`url(#ng${i})`} opacity={opacity} />
              <Circle
                cx={x}
                cy={NODE_Y}
                r={(NODE_R + 4) * (0.6 + 0.4 * nodeT)}
                fill="none"
                stroke={color}
                strokeOpacity={0.35}
                strokeWidth={1.5}
                opacity={opacity * nodeT}
              />
              <Circle cx={x} cy={NODE_Y} r={NODE_R * (0.6 + 0.4 * nodeT)} fill={color} opacity={opacity * nodeT} />
              <SvgText
                x={x}
                y={NODE_Y + 6}
                fontSize={16}
                fontFamily={fonts.semibold}
                fontWeight="600"
                fill={colors.bg}
                textAnchor="middle"
                opacity={nodeT * (opacity < 1 ? 0.8 : 1)}
              >
                {PATH_LETTERS[i]}
              </SvgText>
            </Group>
          );
        })}
      </Svg>

      {activeIndex >= 0 && progress >= 1 ? <Halo x={xs[activeIndex]} y={NODE_Y} color={pathColor(activeIndex)} /> : null}

      {bare ? null : (
        <View style={[styles.rootLabel, { opacity: rootT }]} pointerEvents="none">
          <Text variant="label" color={colors.textDim}>
            Your decision
          </Text>
        </View>
      )}

      {bare
        ? null
        : paths.map((p, i) => {
            const x = xs[i];
            const start = 0.2 + i * 0.07;
            const labelT = stage(progress, start + 0.4, start + 0.62);
            const dimmed = activeId != null && activeId !== p.id;
            const hitTop = NODE_Y - NODE_R - 10;
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelect?.(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: activeId === p.id }}
                accessibilityLabel={`Path ${PATH_LETTERS[i]}: ${p.title}`}
                accessibilityHint="Selects this path"
                style={({ pressed }) => [
                  styles.hit,
                  { left: x - labelW / 2, width: labelW, top: hitTop, height: height - hitTop },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.label,
                    {
                      top: labelTop - hitTop,
                      opacity: labelT * (dimmed ? 0.45 : 1),
                      transform: [{ translateY: (1 - labelT) * 6 }],
                    },
                  ]}
                >
                  <Text
                    variant="small"
                    color={colors.text}
                    align="center"
                    numberOfLines={3}
                    style={[styles.labelText, activeId === p.id && { color: pathColor(i) }]}
                  >
                    {p.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
    </View>
  );
}

// A keyed fragment; react-native-svg's G adds an extra layer on web we don't need.
function Group({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const ForkTree = memo(ForkTreeBase);

const styles = StyleSheet.create({
  rootLabel: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  hit: { position: 'absolute', alignItems: 'center' },
  label: { position: 'absolute', left: 0, right: 0, paddingHorizontal: space.xs },
  labelText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  pressed: { opacity: 0.6 },
});
