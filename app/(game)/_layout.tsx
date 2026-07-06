import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.void } }}>
      <Stack.Screen name="setup" />
      <Stack.Screen name="medium-view" />
      <Stack.Screen name="board" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
