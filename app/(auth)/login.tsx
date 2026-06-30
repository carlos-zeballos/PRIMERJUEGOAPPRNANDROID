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
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password) return;
    await login(email.trim(), password);
    if (!useAuthStore.getState().error) router.replace('/');
  }

  async function handleGoogle() {
    await loginWithGoogle();
    if (!useAuthStore.getState().error) router.replace('/');
  }

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>INICIAR SESIÓN</Text>

          <View style={styles.form}>
            <Text style={styles.label}>CORREO</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
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
              onChangeText={(t) => { setPassword(t); clearError(); }}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button
              label="ENTRAR"
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email || !password}
            />
            <View style={styles.gap} />

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.sepLine} />
              <Text style={styles.sepText}>O</Text>
              <View style={styles.sepLine} />
            </View>
            <View style={styles.gap} />

            <Button
              label="CONTINUAR CON GOOGLE"
              variant="secondary"
              onPress={handleGoogle}
              loading={isLoading}
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
  separator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sepLine: { flex: 1, height: 1, backgroundColor: 'rgba(200,169,107,0.20)' },
  sepText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.45)',
    letterSpacing: 2,
  },
});
