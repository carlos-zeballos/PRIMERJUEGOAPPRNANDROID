import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    // La redirección a '/' la dispara automáticamente el guard centralizado
    // en app/_layout.tsx en cuanto "user" pasa a null.
    await logout();
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.wrap}>
        <Text style={styles.title}>PERFIL</Text>

        <View style={styles.panel}>
          <Row label="CORREO" value={user?.email ?? '—'} />
          <Row label="UID" value={user?.uid ?? '—'} />
        </View>

        <View style={styles.actions}>
          <Button label="VER PROGRESO" variant="secondary" onPress={() => router.push('/(solo)/progress')} />
          <View style={styles.gap} />
          <Button label="CERRAR SESIÓN" variant="primary" onPress={handleLogout} />
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: SPACING.xl },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING['2xl'],
  },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.abyss,
  },
  actions: {},
  gap: { height: SPACING.sm },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  value: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textPrimary,
    maxWidth: '60%',
  },
});
