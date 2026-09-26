import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ForkMark } from '../components/ForkMark';
import { Text } from '../components/Text';
import { useProgress } from '../hooks/useProgress';
import { useForkStore } from '../store/useForkStore';
import { colors, space } from '../theme/tokens';

/** Branded launch moment: the mark draws itself, then we route. Kept under a second. */
export default function Launch() {
  const onboarded = useForkStore((s) => s.onboarded);
  const t = useProgress(700);

  useEffect(() => {
    const timer = setTimeout(() => router.replace(onboarded ? '/home' : '/onboarding'), 850);
    return () => clearTimeout(timer);
  }, [onboarded]);

  return (
    <View style={styles.root} accessibilityLabel="Fork">
      <ForkMark size={88} progress={t} />
      <Text variant="display" style={[styles.word, { opacity: t }]}>
        Fork
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  word: { letterSpacing: 1 },
});
