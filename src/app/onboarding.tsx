import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForkMark } from '../components/ForkMark';
import { ForkTree } from '../components/ForkTree';
import { Text } from '../components/Text';
import { Backdrop, Button, LevelMeter, PathBadge, TextLink } from '../components/ui';
import { useProgress } from '../hooks/useProgress';
import { track } from '../services/analytics';
import { useForkStore } from '../store/useForkStore';
import { MAX_CONTENT_WIDTH, colors, pathColor, radius, space } from '../theme/tokens';

const PAGES = [
  {
    title: 'Every choice creates a different path.',
    body: 'Describe a decision in your own words. Fork lays out the paths in front of you.',
  },
  {
    title: 'Explore the tradeoffs before you decide.',
    body: 'Open each path to see what changes, what it assumes, and what could go wrong — side by side.',
  },
  {
    title: 'Fork keeps the decision yours.',
    body: 'No verdicts, no predictions. You pick the path, note why, and come back to it later.',
  },
];

function PathsArt({ width, active }: { width: number; active: boolean }) {
  const t = useProgress(1300, active);
  return (
    <ForkTree
      width={width}
      progress={active ? t : 0}
      paths={[
        { id: 'a', title: 'Take the offer' },
        { id: 'b', title: 'Stay and grow' },
        { id: 'c', title: 'Negotiate first' },
      ]}
    />
  );
}

function CompareArt() {
  const rows = [
    { label: 'Cost', a: 'high', b: 'low' },
    { label: 'Flexibility', a: 'low', b: 'high' },
    { label: 'Risk', a: 'moderate', b: 'moderate' },
  ] as const;
  return (
    <View style={styles.compareArt}>
      {rows.map((r) => (
        <View key={r.label} style={styles.compareRow}>
          <Text variant="small" color={colors.text} style={styles.compareLabel}>
            {r.label}
          </Text>
          <View style={styles.compareCells}>
            <View style={styles.compareCell}>
              <PathBadge index={0} size={20} />
              <LevelMeter level={r.a} color={pathColor(0)} />
            </View>
            <View style={styles.compareCell}>
              <PathBadge index={1} size={20} />
              <LevelMeter level={r.b} color={pathColor(1)} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function ChooseArt({ active }: { active: boolean }) {
  const t = useProgress(900, active);
  return (
    <View style={styles.chooseArt}>
      <ForkMark size={120} progress={active ? t : 0} highlight={t > 0.95 ? 'right' : null} />
      <View style={styles.choosePill}>
        <PathBadge index={1} size={22} />
        <Text variant="bodyStrong">You choose</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const { width: screenW } = useWindowDimensions();
  const width = Math.min(screenW, MAX_CONTENT_WIDTH);
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const completeOnboarding = useForkStore((s) => s.completeOnboarding);

  const finish = () => {
    completeOnboarding();
    track('onboarding_completed');
    router.replace('/home');
  };

  const goTo = (index: number) => {
    scroller.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const last = page === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Backdrop tint={pathColor(page)} />
      <View style={[styles.column, { width }]}>
        <View style={styles.top}>
          <ForkMark size={28} />
          {!last ? <TextLink label="Skip" onPress={finish} /> : <View />}
        </View>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          onScroll={onScroll}
          scrollEventThrottle={32}
          style={styles.pager}
        >
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.page, { width }]} accessible accessibilityLabel={`${p.title} ${p.body}`}>
              <View style={styles.art}>
                {i === 0 ? <PathsArt width={width - space.xl * 2} active={page === 0} /> : null}
                {i === 1 ? <CompareArt /> : null}
                {i === 2 ? <ChooseArt active={page === 2} /> : null}
              </View>
              <Text variant="hero" style={styles.title}>
                {p.title}
              </Text>
              <Text style={styles.body}>{p.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottom}>
          <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
            {PAGES.map((p, i) => (
              <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
          <Button label={last ? 'Start exploring' : 'Next'} icon="arrow" onPress={() => (last ? finish() : goTo(page + 1))} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  column: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    height: 56,
  },
  pager: { flex: 1 },
  page: { paddingHorizontal: space.xl, justifyContent: 'flex-end', paddingBottom: space.xl },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 260 },
  title: { marginBottom: space.md },
  body: { fontSize: 17, lineHeight: 26 },
  bottom: { paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.xl },
  dots: { flexDirection: 'row', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lineStrong },
  dotActive: { width: 24, backgroundColor: colors.text },
  compareArt: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.lg,
  },
  compareRow: { gap: space.sm },
  compareLabel: { fontWeight: '600' },
  compareCells: { flexDirection: 'row', gap: space.lg },
  compareCell: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 },
  chooseArt: { alignItems: 'center', gap: space.xl },
  choosePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: pathColor(1),
  },
});
