import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ForkMark } from './ForkMark';
import { Text } from './Text';
import { Button, Screen } from './ui';
import { colors, space } from '../theme/tokens';

/** Shown when a route points at a decision that no longer exists (e.g. deleted). */
export function MissingDecision() {
  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.center}>
      <ForkMark size={64} left={colors.lineStrong} right={colors.lineStrong} />
      <Text variant="title" align="center" style={styles.title}>
        This decision isn’t here anymore
      </Text>
      <Text align="center" style={styles.body}>
        It may have been deleted, or it was an unsaved draft.
      </Text>
      <Button label="Back to home" onPress={() => router.replace('/home')} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  title: { marginTop: space.xl },
  body: { marginTop: space.sm, marginBottom: space.xl },
  button: { alignSelf: 'stretch' },
});
