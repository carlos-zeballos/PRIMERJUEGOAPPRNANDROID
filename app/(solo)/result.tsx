/**
 * result.tsx — Resultado del Ritual Solitario.
 * Muestra puntuación, estadísticas de la partida y explicación del Medium.
 */

import React, { useEffect, useState } from 'react';
import {
  Image, ImageBackground, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { useSoloGameStore } from '../../src/store/soloGameStore';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING } from '../../src/constants/theme';
import { CompletedSoloMatch } from '../../src/domain/solo/types/solo.types';
import { getMatchHistory } from '../../src/services/database/SoloRepository';

const FONDO    = require('../../assets/images/fondo.png');
const WIN_BLUE = require('../../assets/images/azulgano.png');
const WIN_RED  = require('../../assets/images/azulperido.png');
const CURSED   = require('../../assets/images/palnmalfin.png');

export default function SoloResultScreen() {
  const { user } = useAuthStore();
  const { session, currentClue, stats, loadStats, reset } = useSoloGameStore();
  const [match, setMatch] = useState<CompletedSoloMatch | null>(null);

  // Cargar la última partida guardada
  useEffect(() => {
    if (!user) return;
    getMatchHistory(user.uid, 1, 0).then(([last]) => {
      if (last) setMatch(last);
    });
    loadStats(user.uid);
  }, [user?.uid]);

  function handlePlayAgain() {
    reset();
    router.replace('/(solo)/difficulty');
  }

  function handleHome() {
    reset();
    router.replace('/');
  }

  function handleProgress() {
    router.push('/(solo)/progress');
  }

  if (!match && !session) {
    return (
      <ImageBackground source={FONDO} style={{ flex: 1 }} resizeMode="cover">
        <SafeAreaWrapper style={{ backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Cinzel-Regular', color: COLORS.textSecondary, letterSpacing: 2 }}>
            Cargando resultado...
          </Text>
        </SafeAreaWrapper>
      </ImageBackground>
    );
  }

  const result  = match?.result;
  const score   = match?.score;
  const won     = result?.status === 'won';
  const cursed  = result?.status === 'lost_curse';
  const isBlue  = (match?.team ?? session?.team) === 'BLUE';

  const heroImage = cursed ? CURSED : isBlue ? WIN_BLUE : WIN_RED;
  const heroStyle = cursed ? styles.heroCursed : styles.heroWin;

  const totalMs  = match?.timing.activeDurationMs ?? 0;
  const mins     = Math.floor(totalMs / 60000);
  const secs     = Math.floor((totalMs % 60000) / 1000);
  const timeStr  = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const diffLabel = match ? {
    apprentice: 'APRENDIZ', initiated: 'INICIADO',
    medium: 'MEDIUM', nightmare: 'PESADILLA', hell: 'INFIERNO',
  }[match.difficulty] : '';

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
      <SafeAreaWrapper style={styles.transparent}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Imagen de resultado */}
          <View style={styles.heroWrap}>
            <Image source={heroImage} style={heroStyle} resizeMode="contain" />
          </View>

          {/* Puntuación */}
          {score && (
            <View style={styles.scorePanel}>
              <Text style={styles.scoreFinal}>{score.finalScore.toLocaleString()}</Text>
              <Text style={styles.scoreLabel}>PUNTOS TOTALES</Text>
              <Text style={styles.scoreMultiplier}>×{score.difficultyMultiplier} {diffLabel}</Text>
            </View>
          )}

          {/* Desglose */}
          {score && result && (
            <View style={styles.statsPanel}>
              <Text style={styles.statsPanelTitle}>DESGLOSE DEL RITUAL</Text>
              <View style={styles.statsDivider} />
              <StatRow label="ALMAS PROPIAS"  value={`${result.foundOwnWords}/${result.totalOwnWords}`} color={isBlue ? COLORS.blueGlow : COLORS.redGlow} />
              <StatRow label="PRECISIÓN"      value={`${Math.round(result.accuracy * 100)}%`} />
              <StatRow label="TURNOS"         value={String(result.turnsPlayed)} />
              <StatRow label="TIEMPO ACTIVO"  value={timeStr} />
              <StatRow label="PUNTOS BASE"    value={score.baseScore.toLocaleString()} />
              {score.streakBonus > 0  && <StatRow label="BONUS RACHA"   value={`+${score.streakBonus}`} color={COLORS.goldGlow} />}
              {score.timeBonus > 0    && <StatRow label="BONUS TIEMPO"  value={`+${score.timeBonus}`}   color={COLORS.goldGlow} />}
              {score.accuracyBonus > 0 && <StatRow label="BONUS PRECISIÓN" value={`+${score.accuracyBonus}`} color={COLORS.goldGlow} />}
              {score.penalties > 0    && <StatRow label="PENALIZACIONES" value={`-${score.penalties}`} color={COLORS.redGlow} />}
              {score.isPerfect && <StatRow label="RITUAL PERFECTO" value="✦" color={COLORS.goldGlow} />}
            </View>
          )}

          {/* Explicación del Medium */}
          {currentClue?.explanation && currentClue.explanation.length > 0 && (
            <View style={styles.explanationPanel}>
              <Text style={styles.explanationTitle}>EL MEDIUM EXPLICA</Text>
              <View style={styles.statsDivider} />
              {currentClue.explanation.map((ex, i) => (
                <View key={i} style={styles.explanationRow}>
                  <Text style={styles.explanationWord}>{ex.word}</Text>
                  <Text style={styles.explanationRelation}>— {ex.relation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Acciones */}
          <View style={styles.actions}>
            <RitualButton label="NUEVO RITUAL" onPress={handlePlayAgain} primary />
            <View style={{ height: SPACING.sm }} />
            <RitualButton label="VER PROGRESO" onPress={handleProgress} />
            <View style={{ height: SPACING.sm }} />
            <RitualButton label="INICIO" onPress={handleHome} ghost />
          </View>

        </ScrollView>
      </SafeAreaWrapper>
    </ImageBackground>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function RitualButton({ label, onPress, primary, ghost }: {
  label: string; onPress: () => void; primary?: boolean; ghost?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        btnStyles.base,
        primary && btnStyles.primary,
        ghost && btnStyles.ghost,
        pressed && btnStyles.pressed,
      ]}
    >
      <Text style={[btnStyles.text, ghost && btnStyles.textGhost]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },

  heroWrap: { alignItems: 'center', marginBottom: 8 },
  heroWin:  { width: '100%', height: 300 },
  heroCursed: { width: 320, height: 270, marginBottom: -30 },

  scorePanel: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scoreFinal: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 52,
    color: 'rgba(226,184,90,0.95)',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  scoreLabel: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 10,
    color: 'rgba(200,169,107,0.60)',
    letterSpacing: 4,
  },
  scoreMultiplier: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 12,
    color: 'rgba(200,169,107,0.45)',
    letterSpacing: 2,
    marginTop: 4,
  },

  statsPanel: {
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.30)',
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(8,6,14,0.72)',
  },
  statsPanelTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: 'rgba(200,169,107,0.65)',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(200,169,107,0.18)',
    marginBottom: 6,
  },

  explanationPanel: {
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.20)',
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(8,6,14,0.65)',
  },
  explanationTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: 'rgba(200,169,107,0.55)',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.10)',
  },
  explanationWord: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 12,
    color: 'rgba(226,184,90,0.85)',
    letterSpacing: 1,
    minWidth: 100,
  },
  explanationRelation: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(180,160,120,0.65)',
    letterSpacing: 0.5,
    flex: 1,
  },

  actions: {},
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.10)',
  },
  label: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 10,
    color: 'rgba(200,169,107,0.60)',
    letterSpacing: 2,
  },
  value: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    color: 'rgba(226,184,90,0.90)',
    letterSpacing: 1,
  },
});

const btnStyles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.40)',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,6,14,0.72)',
  },
  primary: {
    borderColor: 'rgba(200,169,107,0.80)',
    backgroundColor: 'rgba(14,10,22,0.85)',
  },
  ghost: {
    borderColor: 'rgba(200,169,107,0.20)',
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  text: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 12,
    letterSpacing: 3,
    color: 'rgba(226,184,90,0.90)',
  },
  textGhost: { color: 'rgba(200,169,107,0.50)' },
});
