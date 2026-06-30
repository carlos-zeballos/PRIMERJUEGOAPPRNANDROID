/**
 * game.tsx — Tablero del Ritual Solitario.
 *
 * Fases del store → comportamiento en pantalla:
 *   showing_clue   → muestra la pista del Medium, tablero deshabilitado, botón LISTO
 *   selecting      → tablero interactivo, usuario elige cartas
 *   showing_result → SelectionResultOverlay, tablero bloqueado
 *   completed      → navega automáticamente a result.tsx
 */

import React, { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { GameBoard } from '../../src/components/game/GameBoard';
import { ScoreTracker } from '../../src/components/game/ScoreTracker';
import { SelectionResultOverlay } from '../../src/components/game/SelectionResultOverlay';
import { useSoloGameStore } from '../../src/store/soloGameStore';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { getSelectionAlertType } from '../../src/assets/selectionAlertAssets';
import { useAudioTrack } from '../../src/hooks/useAudioTrack';

const FONDO = require('../../assets/images/fondo.png');

export default function SoloGameScreen() {
  const { user } = useAuthStore();
  const {
    session, phase, currentClue, lastResult,
    isPaused, selectCard, continueTurn, pauseGame, resumeGame,
    finishGame, restoreSession, reset,
  } = useSoloGameStore();

  useAudioTrack('TENSION');

  // Guardar sesión y pausar cuando la app va al fondo
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        pauseGame();
      } else if (state === 'active') {
        resumeGame();
      }
    });
    return () => sub.remove();
  }, []);

  // Restaurar sesión si no hay ninguna activa
  useEffect(() => {
    if (!session && user) {
      restoreSession(user.uid).then(restored => {
        if (!restored) router.replace('/(solo)/difficulty');
      });
    }
  }, []);

  // Navegar a resultado cuando el juego termina
  useEffect(() => {
    if (phase === 'completed') {
      router.replace('/(solo)/result');
    }
  }, [phase]);

  // Si no hay sesión y no estamos preparando, volver
  useEffect(() => {
    if (phase === 'idle') {
      router.replace('/(solo)/difficulty');
    }
  }, [phase]);

  const handleSelectCard = useCallback(async (position: number) => {
    if (!session) return;
    const cell = session.board[position];
    if (!cell) return;
    await selectCard(cell.id);
  }, [session, selectCard]);

  const handleOverlayClose = useCallback(() => {
    // Después del overlay, continueTurn decide si sigue el turno, nuevo turno o fin
    continueTurn();
  }, [continueTurn]);

  if (!session) return null;

  const teamLabel     = session.team === 'BLUE' ? 'AZUL' : 'ROJO';
  const teamColor     = session.team === 'BLUE' ? COLORS.blueGlow : COLORS.redGlow;
  const boardDisabled = phase !== 'selecting';

  // Tipo de alerta para el overlay
  const alertType = lastResult && session.board
    ? (() => {
        if (lastResult === 'cursed')  return 'cursed' as const;
        if (lastResult === 'neutral') return 'neutral' as const;
        if (lastResult === 'correct') {
          return session.team === 'BLUE' ? 'correct_blue' as const : 'correct_red' as const;
        }
        if (lastResult === 'wrong_own') return 'neutral' as const;
        // rival
        return session.team === 'BLUE' ? 'blue_helped_red' as const : 'red_helped_blue' as const;
      })()
    : null;

  const ownFound  = session.board.filter(c => c.owner === session.team && c.state === 'REVEALED').length;
  const ownTotal  = session.board.filter(c => c.owner === session.team).length;
  const rivalFound = session.board.filter(c => c.owner !== session.team && c.owner !== 'NEUTRAL' && c.owner !== 'CURSED' && c.state === 'REVEALED').length;
  const rivalTotal = session.board.filter(c => c.owner !== session.team && c.owner !== 'NEUTRAL' && c.owner !== 'CURSED').length;

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
      <SafeAreaWrapper style={styles.transparent}>

        {/* HUD superior */}
        <View style={styles.hud}>
          <Text style={[styles.hudTeam, { color: teamColor }]}>
            RITUAL SOLITARIO · EQUIPO {teamLabel}
          </Text>
          <Text style={styles.hudScore}>
            {ownFound}/{ownTotal} almas liberadas
          </Text>
        </View>

        {/* Panel de la pista del Medium */}
        {(phase === 'showing_clue' || phase === 'selecting') && currentClue && (
          <View style={styles.cluePanel}>
            <Text style={styles.clueEyebrow}>EL MEDIUM SUSURRA</Text>
            <Text style={[styles.clueWord, { color: teamColor }]}>
              {currentClue.clue}
            </Text>
            <Text style={styles.clueCount}>
              {currentClue.remainingCount === 1
                ? 'UNA PALABRA'
                : `${currentClue.remainingCount} PALABRAS`}
            </Text>

            {phase === 'showing_clue' && (
              <Pressable
                onPress={() => useSoloGameStore.setState({ phase: 'selecting' })}
                style={({ pressed }) => [styles.readyBtn, pressed && styles.readyBtnPressed]}
                accessibilityLabel="Listo para seleccionar"
                accessibilityRole="button"
              >
                <Text style={styles.readyBtnText}>LISTO</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Tablero */}
        <View style={styles.boardWrap}>
          <GameBoard
            board={session.board}
            activeTeam={session.team}
            onSelectCell={handleSelectCard}
            disabled={boardDisabled}
            revealAll={false}
          />
        </View>

        {/* Puntuación corriente */}
        <View style={styles.footer}>
          <Text style={styles.runningScore}>
            {session.runningScore} pts
          </Text>
          <Text style={styles.turnCount}>
            Turno {(session.turns.length) + 1}
          </Text>
        </View>

        {/* Overlay de resultado de selección */}
        <SelectionResultOverlay
          visible={phase === 'showing_result'}
          alertType={alertType}
          onContinue={handleOverlayClose}
        />

      </SafeAreaWrapper>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent', flex: 1 },

  hud: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(8,6,14,0.72)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.18)',
  },
  hudTeam: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hudScore: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.60)',
    marginTop: 2,
    letterSpacing: 1,
  },

  cluePanel: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(8,6,14,0.80)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.15)',
  },
  clueEyebrow: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 9,
    color: 'rgba(200,169,107,0.55)',
    letterSpacing: 4,
    marginBottom: 6,
  },
  clueWord: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 32,
    letterSpacing: 5,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  clueCount: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.60)',
    letterSpacing: 2,
    marginTop: 4,
  },

  readyBtn: {
    marginTop: 14,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(200,169,107,0.75)',
    borderRadius: 8,
    backgroundColor: 'rgba(8,6,14,0.80)',
  },
  readyBtnPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  readyBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 12,
    letterSpacing: 3,
    color: 'rgba(226,184,90,0.95)',
  },

  boardWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
    backgroundColor: 'rgba(8,6,14,0.55)',
  },
  runningScore: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    color: 'rgba(226,184,90,0.90)',
    letterSpacing: 1,
  },
  turnCount: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.55)',
    letterSpacing: 1,
  },
});
