import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  async function handleRegister() {
    setLocalError('');
    if (!email.trim() || !password) return;
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    await register(email.trim(), password);
    if (!useAuthStore.getState().error) {
      router.replace('/');
    }
  }

  const displayError = localError || error;

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>CREAR CUENTA</Text>

          <View style={styles.form}>
            <Text style={styles.label}>CORREO</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); setLocalError(''); }}
              placeholder="tu@correo.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); setLocalError(''); }}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={(t) => { setConfirm(t); setLocalError(''); }}
              placeholder="Repite la contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />

            {displayError ? <Text style={styles.error}>{displayError}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button
              label="REGISTRARSE"
              variant="primary"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!email || !password || !confirm}
            />
            <View style={styles.gap} />
            <Button
              label="YA TENGO CUENTA"
              variant="secondary"
              onPress={() => router.replace('/(auth)/login')}
              disabled={isLoading}
            />
            <View style={styles.gap} />
            <Button
              label="VOLVER"
              variant="ghost"
              onPress={() => router.back()}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  flex:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  heading: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING['2xl'],
  },
  form: {
    marginBottom: SPACING.xl,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  input: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ash,
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
  error: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.error,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  actions: {},
  gap: { height: SPACING.sm },
});
