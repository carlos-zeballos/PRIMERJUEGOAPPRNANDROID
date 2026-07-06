import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AudioManager } from '../src/services/audio/AudioManager';
import { subscribeToConnectivity } from '../src/services/sync/connectivity.service';
import { syncPendingGames } from '../src/services/sync/game-sync.service';

import '../src/services/firebase/config';

const PROTECTED_GROUPS = ['(tabs)', '(game)', '(solo)'];

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

function RootLayoutInner() {
  const [fontsLoaded] = useFonts({
    'Cinzel-Regular':             require('../assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold':                require('../assets/fonts/Cinzel-Bold.ttf'),
    'Inter-Regular':              require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold':                 require('../assets/fonts/Inter-Bold.ttf'),
    'CormorantGaramond-Italic':   require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),
    'CormorantGaramond-Regular':  require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
    'UnifrakturCook-Bold':        require('@expo-google-fonts/unifrakturcook/700Bold/UnifrakturCook_700Bold.ttf'),
  });

  const { isInitialized, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    AudioManager.initialize();
    return () => AudioManager.dispose();
  }, []);

  // Única autoridad de navegación por sesión: decide, en un solo lugar,
  // si el segmento actual requiere redirigir. Evita que varias pantallas
  // llamen router.replace() a la vez y entren en un ping-pong infinito.
  useEffect(() => {
    if (!isInitialized) return;

    const currentGroup = segments[0];
    const inProtectedGroup = PROTECTED_GROUPS.includes(currentGroup as string);

    if (!user && inProtectedGroup) {
      router.replace('/');
    } else if (user && !inProtectedGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, user, segments]);

  // Reintenta subir al historial las partidas locales que quedaron sin
  // sincronizar (por ejemplo, si se terminaron sin conexión): al iniciar
  // sesión y cada vez que vuelve la conectividad.
  useEffect(() => {
    if (!user) return;
    syncPendingGames(user.uid).catch(() => {});
    return subscribeToConnectivity((online) => {
      if (online) syncPendingGames(user.uid).catch(() => {});
    });
  }, [user]);

  if (!fontsLoaded || !isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.void } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(game)" />
        <Stack.Screen name="(solo)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
