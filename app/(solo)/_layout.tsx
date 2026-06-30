import { Stack } from 'expo-router';

export default function SoloLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="difficulty" />
      <Stack.Screen name="game" />
      <Stack.Screen name="result" />
      <Stack.Screen name="progress" />
    </Stack>
  );
}
