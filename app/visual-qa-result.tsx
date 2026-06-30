/**
 * visual-qa-result.tsx
 * Previsualización rápida de la pantalla de resultado.
 * Solo para desarrollo — no aparece en producción.
 *
 * Acceso: navegar a /visual-qa-result desde cualquier pantalla.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import { BoardCell } from '../src/types/game.types';
import { COLORS } from '../src/constants/theme';

// ── Mock board 5×5 ──────────────────────────────────────────────────────────
const MOCK_WORDS = [
  'UMBRAL','AGUA','ORACULO','LUNA','ABISMO',
  'CAMINO','ECLIPSE','PACTO','FUEGO','SOMBRA',
  'OUROBOROS','RELOJ','CRIPTA','AZUL','RITUAL',
  'LABERINTO','PUERTA','ENTROPIA','FANTASMA','VORTICE',
  'CENIZA','ANATEMA','ESPEJO','SILENCIO','MALDICION',
];
const MOCK_OWNERS: BoardCell['owner'][] = [
  'RED','BLUE','NEUTRAL','RED','CURSED',
  'BLUE','RED','NEUTRAL','BLUE','RED',
  'BLUE','NEUTRAL','RED','BLUE','NEUTRAL',
  'RED','BLUE','NEUTRAL','RED','BLUE',
  'NEUTRAL','RED','BLUE','RED','NEUTRAL',
];
const MOCK_BOARD: BoardCell[] = MOCK_WORDS.map((word, i) => ({
  id: `qa-${i}`,
  position: i,
  word,
  owner: MOCK_OWNERS[i],
  state: 'REVEALED' as const,
}));

export default function VisualQaResultScreen() {
  const { session } = useGameStore();

  useEffect(() => {
    // Inyectar sesión mock de victoria ROJA directamente en el store
    useGameStore.setState({
      session: {
        id: 'qa-preview',
        config: {
          difficulty: 'MEDIUM',
          mediumTimeSeconds: 60,
          interpreterTimeSeconds: 30,
          firstTeam: 'RED',
          soundEnabled: false,
          hapticsEnabled: false,
        },
        board: MOCK_BOARD,
        turns: [],
        currentTurnIndex: 0,
        activeTeam: 'RED',
        phase: 'GAME_OVER',
        result: 'RED_WIN',   // ← cambia a 'BLUE_WIN' para ver victoria azul
        blueScore: 3,
        redScore: 9,
        blueTotal: 9,
        redTotal: 9,
        startedAt: Date.now() - 240000,
        endedAt: Date.now(),
      },
      isLoading: false,
      error: null,
    });

    // Navegar al resultado
    router.replace('/(game)/result');
  }, []);

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={COLORS.goldGlow} size="large" />
    </View>
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
