import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { AudioManager } from '../src/services/audio/AudioManager';

import '../src/services/firebase/config';
import { configureGoogleSignIn } from '../src/services/firebase/auth';

// Configurar Google Sign-In con el webClientId del proyecto Firebase
// Obtener en: Firebase Console → Autenticación → Google → Web client ID
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
if (GOOGLE_WEB_CLIENT_ID) configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Cinzel-Regular':             require('../assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold':                require('../assets/fonts/Cinzel-Bold.ttf'),
    'Inter-Regular':              require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold':                 require('../assets/fonts/Inter-Bold.ttf'),
    'CormorantGaramond-Italic':   require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),
    'CormorantGaramond-Regular':  require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
    'UnifrakturCook-Bold':        require('@expo-google-fonts/unifrakturcook/700Bold/UnifrakturCook_700Bold.ttf'),
  });

  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    AudioManager.initialize();
    const unsubscribe = initialize();
    return () => {
      unsubscribe?.();
      AudioManager.dispose();
    };
  }, []);

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
