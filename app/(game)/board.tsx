/**
 * BoardScreen — pantalla del turno de Intérpretes.
 *
 * Tras cada selección, muestra SelectionResultOverlay con la imagen de resultado.
 * El tablero permanece bloqueado mientras la alerta está visible.
 * La lógica de juego (selectCell, passVoluntarily, etc.) no se modificó.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

const FONDO = require('../../assets/images/fondo.png');
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { GameBoard } from '../../src/components/game/GameBoard';
import { WhisperDisplay } from '../../src/components/game/WhisperDisplay';
import { ScoreTracker } from '../../src/components/game/ScoreTracker';
import { SelectionResultOverlay } from '../../src/components/game/SelectionResultOverlay';
import { useGameStore } from '../../src/store/gameStore';
import { useAudioTrack } from '../../src/hooks/useAudioTrack';
import { GAME_ASSETS } from '../../src/constants/assets';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { getSelectionAlertType, SelectionAlertType } from '../../src/assets/selectionAlertAssets';

const BOARD_PRELOAD_ASSETS: ImageSourcePropType[] = [
  GAME_ASSETS.boardFrame,
  GAME_ASSETS.cards.hidden,
  GAME_ASSETS.cards.blueRevealed,
  GAME_ASSETS.cards.redRevealed,
  GAME_ASSETS.cards.cursedRevealed,
];

function preloadBoardAssets() {
  if (typeof Image.resolveAssetSource !== 'function') return;
  BOARD_PRELOAD_ASSETS.forEach((asset) => {
    const source = Image.resolveAssetSource(asset);
    if (source?.uri) Image.prefetch(source.uri).catch(() => {});
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BoardScreen() {
  const { session, selectCell, passVoluntarily } = useGameStore();

  // Alerta visual tras cada selección
  const [alertType, setAlertType] = useState<SelectionAlertType | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  // Acción pendiente que se ejecuta después de cerrar la alerta
  const pendingActionRef = useRef<'continue' | 'end_turn' | 'end_game' | null>(null);

  const routeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useAudioTrack('TENSION');

  useEffect(() => {
    preloadBoardAssets();
  }, []);

  // ── Navegación según fase ───────────────────────────────────────────────
  useEffect(() => {
    if (!session) { router.replace('/'); return; }

    // Si la alerta está visible, NO navegar todavía — esperar a cerrarla
    if (alertVisible) return;

    if (routeTimeout.current) {
      clearTimeout(routeTimeout.current);
      routeTimeout.current = null;
    }

    if (session.phase === 'GAME_OVER') {
      routeTimeout.current = setTimeout(() => router.replace('/(game)/result'), 0);
    } else if (session.phase === 'MEDIUM_TURN') {
      routeTimeout.current = setTimeout(() => router.replace('/(game)/medium-view'), 0);
    }

    return () => {
      if (routeTimeout.current) { clearTimeout(routeTimeout.current); routeTimeout.current = null; }
    };
  }, [session?.phase, alertVisible]);

  // ── Selección de carta ────────────────────────────────────────────────────
  function handleSelectCell(position: number) {
    if (session?.phase !== 'INTERPRETER_TURN' || alertVisible) return;

    const result = selectCell(position);
    if (!result || result === 'IGNORED') return;

    // Determinar el dueño real de la carta para la alerta
    const cell = session?.board[position];
    if (!cell) return;

    const type = getSelectionAlertType(
      session!.activeTeam,
      cell.owner,
    );

    // Qué hacer cuando se cierre la alerta
    if (result === 'CURSED') {
      pendingActionRef.current = 'end_game';
    } else if (result === 'NEUTRAL' || result === 'ENEMY') {
      pendingActionRef.current = 'end_turn';
    } else {
      // CORRECT — si quedan intentos continuar, si no cambiar turno
      pendingActionRef.current = 'continue';
    }

    setAlertType(type);
    setAlertVisible(true);
  }

  // ── Cierre de alerta ─────────────────────────────────────────────────────
  const handleAlertClose = useCallback(() => {
    setAlertVisible(false);
    setAlertType(null);

    // Navegar o continuar según la acción pendiente
    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    if (!session) return;

    if (action === 'end_game') {
      router.replace('/(game)/result');
      return;
    }

    // Para 'end_turn' y 'continue': la fase actual del session (actualizada por selectCell)
    // ya refleja el estado correcto — el useEffect de navegación lo capturará.
    // No hace falta forzar navegación aquí.
  }, [session]);

  // ── Renderizado de guardia ────────────────────────────────────────────────
  if (!session || (session.phase !== 'INTERPRETER_TURN' && !alertVisible)) return null;

  const currentTurn  = session.turns[session.turns.length - 1];
  const attemptsUsed = currentTurn?.attempts.length ?? 0;
  const maxAttempts  = currentTurn?.maxAttempts === Infinity ? 99 : (currentTurn?.maxAttempts ?? 1);
  const attemptsLeft = Math.max(0, maxAttempts - attemptsUsed);
  const canPass      = attemptsUsed >= 1 && session.phase === 'INTERPRETER_TURN' && !alertVisible;
  const activeColor  = session.activeTeam === 'BLUE' ? COLORS.blueGlow : COLORS.redGlow;
  const teamLabel    = session.activeTeam === 'BLUE' ? 'AZUL' : 'ROJO';

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
    <SafeAreaWrapper style={styles.transparent}>
      <ScoreTracker
        blueScore={session.blueScore}
        blueTotal={session.blueTotal}
        redScore={session.redScore}
        redTotal={session.redTotal}
        activeTeam={session.activeTeam}
      />

      <View style={styles.whisperSection}>
        <Text style={[styles.turnLabel, { color: activeColor }]}>
          🎯 INTÉRPRETES DEL EQUIPO {teamLabel} — TURNO ACTIVO
        </Text>
        <WhisperDisplay
          whisper={currentTurn?.whisper}
          attemptsLeft={attemptsLeft}
          maxAttempts={maxAttempts}
        />
        <Text style={styles.attemptsHint}>
          {attemptsLeft > 0
            ? `Puedes elegir ${attemptsLeft} carta${attemptsLeft !== 1 ? 's' : ''} más`
            : 'Puedes pasar el turno o elegir una carta extra'}
        </Text>
      </View>

      <View style={styles.boardSection}>
        <GameBoard
          board={session.board}
          activeTeam={session.activeTeam}
          onSelectCell={handleSelectCell}
          disabled={session.phase !== 'INTERPRETER_TURN' || alertVisible}
        />
      </View>

      {canPass && (
        <View style={styles.passButton}>
          <Button
            label="TERMINAR MI TURNO"
            variant="ghost"
            onPress={passVoluntarily}
            style={styles.passButtonStyle}
          />
        </View>
      )}

      {/* ── Alerta de resultado ── */}
      <SelectionResultOverlay
        visible={alertVisible}
        alertType={alertType}
        onContinue={handleAlertClose}
      />
    </SafeAreaWrapper>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  whisperSection: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    backgroundColor: 'rgba(8,7,16,0.72)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.18)',
  },
  turnLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  attemptsHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: 'rgba(200,180,140,0.55)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  boardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  passButton: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  passButtonStyle: {
    minHeight: 44,
  },
});
