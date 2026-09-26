import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
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
import { router } from 'expo-router';

import { LEVEL_LABEL } from '../domain/dimensions';
import type { Level } from '../domain/schema';
import { PATH_LETTERS } from '../domain/types';
import { MAX_CONTENT_WIDTH, colors, fonts, pathColor, radius, space } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export const haptic = {
  tap: () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};

/* ----------------------------------------------------------------- Layout */

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
};

export function Screen({ children, scroll = true, edges = ['top'], footer, contentStyle, scrollProps }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <View style={styles.column}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
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
      <IconButton icon={close ? 'close' : 'back'} label={close ? 'Close' : 'Go back'} onPress={back} />
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
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
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
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Buttons */

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', loading, disabled, icon, onPress, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' || variant === 'gold' ? colors.bg : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={(e) => {
        haptic.tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
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
          <Text variant="heading" color={fg} style={styles.buttonLabel}>
            {label}
          </Text>
          {icon ? <Icon name={icon} color={fg} size={20} /> : null}
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

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return (
    <View style={[styles.card, accent ? { borderColor: accent + '55' } : null, style]}>
      {accent ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
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
}: {
  label: string;
  selected?: boolean;
  locked?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const content = (
    <>
      {locked ? <Icon name="lock" size={14} color={colors.gold} /> : null}
      {selected && !locked ? <Icon name="check" size={14} color={colors.bg} strokeWidth={2.4} /> : null}
      <Text variant="small" color={selected && !locked ? colors.bg : color ?? colors.text} style={styles.chipLabel}>
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
      style={({ pressed }) => [styles.chip, selected && !locked && styles.chipSelected, pressed && styles.pressed]}
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
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.46, color: colors.bg }}>{PATH_LETTERS[index]}</Text>
    </View>
  );
}

/** Three-segment qualitative meter. Always paired with a text label so meaning never relies on colour. */
export function LevelMeter({ level, color, label }: { level: Level; color: string; label?: string }) {
  const filled = level === 'low' ? 1 : level === 'moderate' ? 2 : 3;
  return (
    <View style={styles.meterRow} accessibilityLabel={label ?? LEVEL_LABEL[level]}>
      <View style={styles.meter}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.meterSeg, { backgroundColor: i < filled ? color : colors.line }]} />
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
  tone?: 'neutral' | 'gold' | 'danger';
  action?: ReactNode;
}) {
  const tint = tone === 'gold' ? colors.gold : tone === 'danger' ? colors.danger : colors.textDim;
  return (
    <View style={[styles.banner, { borderColor: tint + '44' }]} accessibilityRole="summary">
      <Icon name={icon} size={20} color={tint} />
      <View style={styles.fill}>
        <Text variant="bodyStrong" style={styles.bannerTitle}>
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

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionLabel}>
      <Text variant="label" accessibilityRole="header">
        {children}
      </Text>
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
          <Text variant="title">{title}</Text>
          {body ? <Text style={styles.sheetBody}>{body}</Text> : null}
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            style={destructive ? { backgroundColor: colors.danger } : undefined}
          />
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
    backgroundColor: colors.bg,
    gap: space.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, height: 52, gap: space.sm },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.4 },
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  button_primary: { backgroundColor: colors.text },
  button_gold: { backgroundColor: colors.gold },
  button_secondary: { backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.line },
  button_ghost: { backgroundColor: 'transparent' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  buttonLabel: { fontSize: 16 },
  textLink: { alignSelf: 'center', paddingVertical: space.sm, minHeight: 44, justifyContent: 'center' },
  textLinkLabel: { textDecorationLine: 'underline' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  chipLabel: { fontFamily: fonts.medium },
  badge: { alignItems: 'center', justifyContent: 'center' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meter: { flexDirection: 'row', gap: 3 },
  meterSeg: { width: 14, height: 6, borderRadius: 3 },
  banner: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginBottom: space.md,
  },
  bannerTitle: { marginBottom: 2 },
  bannerAction: { marginTop: space.sm, alignItems: 'flex-start' },
  proBadge: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.bg },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: space.lg },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: colors.raised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  sheetBody: { marginBottom: space.sm },
});
