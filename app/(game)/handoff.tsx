/**
 * HandoffScreen — pantalla de privacidad entre turnos.
 *
 * El modo local presencial usa UN SOLO dispositivo que se va pasando de
 * mano en mano. medium-view.tsx revela TODO el tablero secreto (revealAll),
 * así que nunca debe aparecer automáticamente: siempre se llega a él pasando
 * primero por esta pantalla, que bloquea la vista hasta que el Medium del
 * equipo activo confirma que ya tiene el dispositivo en sus manos y nadie
 * más está mirando la pantalla.
 */
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { useGameStore } from '../../src/store/gameStore';
import { COLORS, SPACING } from '../../src/constants/theme';

const FONDO = require('../../assets/images/fondo.png');

export default function HandoffScreen() {
  const { session } = useGameStore();

  if (!session) {
    router.replace('/(tabs)');
    return null;
  }

  const teamLabel = session.activeTeam === 'BLUE' ? 'AZUL' : 'ROJO';
  const teamColor = session.activeTeam === 'BLUE' ? COLORS.blueGlow : COLORS.redGlow;

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
      <SafeAreaWrapper style={styles.transparent}>
        <View style={styles.center}>
          <Text style={styles.eyebrow}>🔒 CAMBIO DE TURNO</Text>
          <Text style={[styles.team, { color: teamColor }]}>MEDIUM DEL EQUIPO {teamLabel}</Text>
          <Text style={styles.message}>
            Entrega el dispositivo únicamente al Medium del equipo {teamLabel}.
          </Text>
          <Text style={styles.warning}>
            Los demás jugadores NO deben mirar la pantalla: en el siguiente paso
            se revela el tablero secreto completo.
          </Text>

          <View style={styles.cta}>
            <Button
              label="YA TENGO EL DISPOSITIVO — CONTINUAR"
              variant="primary"
              onPress={() => router.replace('/(game)/medium-view')}
            />
          </View>
        </View>
      </SafeAreaWrapper>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  eyebrow: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.70)',
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  team: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 26,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: SPACING.lg,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  warning: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING['2xl'],
  },
  cta: { width: '100%' },
});
