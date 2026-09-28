import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { LEVEL_LABEL } from '../domain/dimensions';
import type { Level } from '../domain/schema';
import { PATH_LETTERS } from '../domain/types';
import { useReducedMotion } from '../hooks/useProgress';
import { MAX_CONTENT_WIDTH, alpha, colors, elevation, fonts, pathColor, radius, space } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export const NATIVE_DRIVER = Platform.OS !== 'web';

export const haptic = {
  tap: () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
  },
  impact: () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success: () => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};

/* ----------------------------------------------------------------- Motion */

/** Fades and lifts children in once on mount. Instant when reduced motion is on. */
export function FadeIn({
  children,
  delay = 0,
  distance = 10,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    Animated.timing(value, { toValue: 1, duration: 380, delay, useNativeDriver: NATIVE_DRIVER }).start();
  }, [delay, reduced, value]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ----------------------------------------------------------------- Layout */

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  /** Tints the top of the backdrop, e.g. with the current path's colour. */
  tint?: string;
};

export function Backdrop({ tint }: { tint?: string }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[tint ? alpha(tint, 0.14) : colors.bgTop, colors.bg]}
      locations={[0, 0.55]}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function Screen({ children, scroll = true, edges = ['top'], footer, contentStyle, scrollProps, tint }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <Backdrop tint={tint} />
      <View style={styles.column}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

export function Header({
  title,
  right,
  onBack,
  close,
}: {
  title?: string;
  right?: ReactNode;
  onBack?: () => void;
  close?: boolean;
}) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View style={styles.header}>
      <IconButton icon={close ? 'close' : 'back'} label={close ? 'Close' : 'Go back'} onPress={back} framed />
      {title ? (
        <Text variant="label" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.fill} />
      )}
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  framed,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  framed?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, framed && styles.iconButtonFramed, pressed && styles.pressed]}
    >
      <Icon name={icon} color={color} size={20} />
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Buttons */

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  loading?: boolean;
  icon?: IconName;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', loading, disabled, icon, onPress, style, size = 'lg', ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' || variant === 'gold' ? colors.bg : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={(e) => {
        haptic.impact();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
        size === 'md' && styles.buttonMd,
        styles[`button_${variant}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          <Text variant="button" color={fg} numberOfLines={1}>
            {label}
          </Text>
          {icon ? <Icon name={icon} color={fg} size={18} strokeWidth={2} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function TextLink({ label, onPress, color = colors.textDim }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}
    >
      <Text variant="small" color={color} style={styles.textLinkLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Surfaces */

export function Card({
  children,
  style,
  accent,
  raised,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  raised?: boolean;
}) {
  return (
    <View style={[styles.card, raised && styles.cardRaised, accent ? { borderColor: alpha(accent, 0.35) } : null, style]}>
      {children}
    </View>
  );
}

export function Chip({
  label,
  selected,
  locked,
  onPress,
  color,
  icon,
}: {
  label: string;
  selected?: boolean;
  locked?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: IconName;
}) {
  const fg = selected && !locked ? colors.bg : color ?? colors.text;
  const content = (
    <>
      {locked ? <Icon name="lock" size={13} color={colors.gold} strokeWidth={2} /> : null}
      {selected && !locked ? <Icon name="check" size={13} color={colors.bg} strokeWidth={2.6} /> : null}
      {icon && !locked && !selected ? <Icon name={icon} size={13} color={fg} strokeWidth={2} /> : null}
      <Text variant="small" color={fg} style={styles.chipLabel}>
        {label}
      </Text>
    </>
  );
  if (!onPress) return <View style={[styles.chip, selected && styles.chipSelected]}>{content}</View>;
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected, disabled: locked }}
      accessibilityLabel={locked ? `${label}, Fork Pro` : label}
      style={({ pressed }) => [styles.chip, selected && !locked && styles.chipSelected, locked && styles.chipLocked, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function PathBadge({ index, size = 28 }: { index: number; size?: number }) {
  const color = pathColor(index);
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
      accessibilityLabel={`Path ${PATH_LETTERS[index]}`}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.46, lineHeight: size * 0.6, color: colors.bg }}>
        {PATH_LETTERS[index]}
      </Text>
    </View>
  );
}

/** Three-segment qualitative meter. Always paired with a text label so meaning never relies on colour. */
export function LevelMeter({ level, color, label, wide }: { level: Level; color: string; label?: string; wide?: boolean }) {
  const filled = level === 'low' ? 1 : level === 'moderate' ? 2 : 3;
  return (
    <View style={styles.meterRow} accessibilityLabel={label ?? LEVEL_LABEL[level]}>
      <View style={styles.meter}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.meterSeg, wide && styles.meterSegWide, { backgroundColor: i < filled ? color : colors.line }]}
          />
        ))}
      </View>
      <Text variant="caption" color={colors.text}>
        {label ?? LEVEL_LABEL[level]}
      </Text>
    </View>
  );
}

export function Banner({
  icon = 'info',
  title,
  body,
  tone = 'neutral',
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  tone?: 'neutral' | 'gold' | 'danger' | 'success';
  action?: ReactNode;
}) {
  const tint =
    tone === 'gold' ? colors.gold : tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.iris;
  return (
    <View style={[styles.banner, { borderColor: alpha(tint, 0.3), backgroundColor: alpha(tint, 0.07) }]} accessibilityRole="summary">
      <View style={[styles.bannerIcon, { backgroundColor: alpha(tint, 0.14) }]}>
        <Icon name={icon} size={16} color={tint} strokeWidth={2} />
      </View>
      <View style={styles.fill}>
        <Text variant="subheading" color={colors.text}>
          {title}
        </Text>
        {body ? <Text variant="small">{body}</Text> : null}
        {action ? <View style={styles.bannerAction}>{action}</View> : null}
      </View>
    </View>
  );
}

export function ProBadge({ label = 'PRO' }: { label?: string }) {
  return (
    <View style={styles.proBadge}>
      <Text style={styles.proBadgeText}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children, right, icon, color }: { children: string; right?: ReactNode; icon?: IconName; color?: string }) {
  return (
    <View style={styles.sectionLabel}>
      <View style={styles.sectionLeft}>
        {icon ? <Icon name={icon} size={14} color={color ?? colors.textFaint} strokeWidth={2} /> : null}
        <Text variant="label" color={color} accessibilityRole="header">
          {children}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

/* ----------------------------------------------------------------- Overlays */

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel} accessibilityLabel="Dismiss">
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text variant="title">{title}</Text>
          {body ? <Text style={styles.sheetBody}>{body}</Text> : null}
          <Button label={confirmLabel} onPress={onConfirm} style={destructive ? { backgroundColor: colors.danger } : undefined} />
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  fill: { flex: 1 },
  scrollContent: { paddingHorizontal: space.xl, paddingBottom: space.xxxl },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: alpha(colors.bg, 0.96),
    gap: space.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, height: 56, gap: space.sm },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  iconButtonFramed: { backgroundColor: alpha('#FFFFFF', 0.05), borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.38 },
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonMd: { minHeight: 48, paddingHorizontal: space.lg },
  button_primary: { backgroundColor: colors.accent, ...elevation.card },
  button_gold: { backgroundColor: colors.gold, boxShadow: `0 10px 30px ${alpha(colors.gold, 0.25)}` },
  button_secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong },
  button_ghost: { backgroundColor: 'transparent' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  textLink: { alignSelf: 'center', paddingVertical: space.sm, minHeight: 44, justifyContent: 'center' },
  textLinkLabel: { textDecorationLine: 'underline' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    ...elevation.card,
  },
  cardRaised: { backgroundColor: colors.raised, ...elevation.raised },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: alpha('#FFFFFF', 0.03),
  },
  chipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  chipLocked: { borderColor: alpha(colors.gold, 0.35), borderStyle: 'dashed' },
  chipLabel: { fontFamily: fonts.medium },
  badge: { alignItems: 'center', justifyContent: 'center' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meter: { flexDirection: 'row', gap: 3 },
  meterSeg: { width: 14, height: 6, borderRadius: 3 },
  meterSegWide: { width: 22 },
  banner: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.md,
  },
  bannerIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bannerAction: { marginTop: space.xs, alignItems: 'flex-start' },
  proBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeText: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 1, color: colors.bg },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: space.lg },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: colors.raised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: space.sm },
  sheetBody: { marginBottom: space.sm },
});
