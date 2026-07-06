import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../src/services/firebase/auth';
import { upsertUser } from '../src/services/firebase/firestore';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onSuccess?: () => void;
  onError?: (mensaje: string) => void;
};

export function BtnLoginGoogle({ onSuccess, onError }: Props) {
  const [request, response, promtAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(firebaseAuth, credential)
        .then(async (result) => {
          await upsertUser(result.user.uid);
          onSuccess?.();
        })
        .catch((e) => {
          console.error('error al iniciar sesion', e);
          onError?.('No se pudo iniciar sesión con Google.');
        });
    } else if (response?.type === 'error') {
      console.error('error al iniciar sesion', response.error);
      onError?.('No se pudo iniciar sesión con Google.');
    }
  }, [response]);

  return (
    <Pressable
      style={styles.btn}
      disabled={!request}
      onPress={() => promtAsync().catch((e) => {
        console.error('error al iniciar sesion', e);
      })}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        Login con Google
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
