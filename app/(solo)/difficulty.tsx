/**
 * difficulty.tsx — Selección de dificultad del Ritual Solitario.
 * Muestra los 5 niveles con estado bloqueado/desbloqueado según el progreso.
 */

import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { useSoloGameStore } from '../../src/store/soloGameStore';
import { useAuth } from '../../src/context/AuthContext';
import { SoloDifficultyId } from '../../src/domain/solo/types/solo.types';
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  getPreviousDifficulty,
} from '../../src/domain/solo/config/difficulty.config';
import { canUnlock, unlockDescription } from '../../src/domain/solo/config/unlock.config';
import { COLORS } from '../../src/constants/theme';
import { TeamColor } from '../../src/types/game.types';

const FONDO = require('../../assets/images/fondo.png');

const TEAM_COLORS: Record<TeamColor, string> = {
  BLUE: '#3A9EFF',
  RED:  '#FF4444',
};

export default function DifficultyScreen() {
  const { user } = useAuth();
  const { stats, loadStats, startGame, phase, error } = useSoloGameStore();

  // Equipo elegido (se podría hacer una pantalla previa, aquí lo pedimos inline)
  const [selectedTeam, setSelectedTeam] = useState<TeamColor>('BLUE');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (user) loadStats(user.uid);
  }, [user?.uid]);

  // Navegar al tablero cuando el juego arranca
  useEffect(() => {
    if (phase === 'showing_clue') {
      router.replace('/(solo)/game');
    }
  }, [phase]);

  function isUnlocked(id: SoloDifficultyId): boolean {
    const cfg = DIFFICULTY_CONFIGS[id];
    if (cfg.unlockRequirement.unlockedByDefault) return true;

    const prevId = getPreviousDifficulty(id);
    if (!prevId || !stats) return false;

    const prevProgress = stats.difficultyProgress[prevId];
    return canUnlock(id, prevProgress.wins, prevProgress.averageAccuracy);
  }

  async function handleSelect(diffId: SoloDifficultyId) {
    if (!user || !isUnlocked(diffId) || starting) return;
    setStarting(true);
    await startGame({
      uid:              user.uid,
      team:             selectedTeam,
      difficulty:       diffId,
      difficultyWordLevel: DIFFICULTY_CONFIGS[diffId].id as never,
    });
    setStarting(false);
  }

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
      <SafeAreaWrapper style={styles.transparent}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Text style={styles.eyebrow}>RITUAL SOLITARIO</Text>
          <Text style={styles.title}>ELIGE TU{'\n'}DIFICULTAD</Text>

          {/* Selección de equipo */}
          <View style={styles.teamPickerWrap}>
            <Text style={styles.teamPickerLabel}>EQUIPO</Text>
            <Picker
              selectedValue={selectedTeam}
              onValueChange={(itemValue) => setSelectedTeam(itemValue as TeamColor)}
              style={styles.teamPicker}
              dropdownIconColor={COLORS.gold}
            >
              <Picker.Item label="Equipo Azul" value="BLUE" color={TEAM_COLORS.BLUE} />
              <Picker.Item label="Equipo Rojo" value="RED" color={TEAM_COLORS.RED} />
            </Picker>
          </View>

          {/* Lista de dificultades */}
          <View style={styles.list}>
            {DIFFICULTY_ORDER.map(id => {
              const cfg       = DIFFICULTY_CONFIGS[id];
              const unlocked  = isUnlocked(id);
              const prevId    = getPreviousDifficulty(id);
              const prevProg  = prevId && stats ? stats.difficultyProgress[prevId] : null;

              return (
                <Pressable
                  key={id}
                  onPress={() => handleSelect(id)}
                  disabled={!unlocked || starting}
                  accessibilityLabel={`Dificultad ${cfg.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !unlocked }}
                  style={({ pressed }) => [
                    styles.card,
                    !unlocked && styles.cardLocked,
                    pressed && unlocked && styles.cardPressed,
                  ]}
                >
                  {/* Nombre y descripción */}
                  <View style={styles.cardLeft}>
                    <Text style={[styles.cardLabel, !unlocked && styles.textLocked]}>
                      {cfg.label}
                    </Text>
                    <Text style={[styles.cardDesc, !unlocked && styles.textLocked]}>
                      {cfg.description}
                    </Text>
                    {!unlocked && (
                      <Text style={styles.lockHint}>
                        {unlockDescription(id)}
                      </Text>
                    )}
                  </View>

                  {/* Multiplicador y estadísticas */}
                  <View style={styles.cardRight}>
                    <Text style={[styles.multiplier, !unlocked && styles.textLocked]}>
                      ×{cfg.scoreMultiplier}
                    </Text>
                    {unlocked && prevProg && (
                      <Text style={styles.progressHint}>
                        {stats?.difficultyProgress[id].wins ?? 0}V
                      </Text>
                    )}
                    {!unlocked && (
                      <Text style={styles.lockIcon}>🔒</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Volver */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← VOLVER</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaWrapper>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },

  eyebrow: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 10,
    color: 'rgba(200,169,107,0.60)',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 8,
  },
  title: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 28,
    color: 'rgba(226,184,90,0.95)',
    textAlign: 'center',
    letterSpacing: 3,
    lineHeight: 36,
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  teamPickerWrap: {
    borderWidth: 1.5,
    borderColor: 'rgba(200,169,107,0.35)',
    borderRadius: 8,
    backgroundColor: 'rgba(8,6,14,0.65)',
    marginBottom: 28,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  teamPickerLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(200,169,107,0.60)',
  },
  teamPicker: {
    color: COLORS.textPrimary,
  },

  list: { gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.30)',
    borderRadius: 10,
    padding: 16,
    backgroundColor: 'rgba(8,6,14,0.72)',
  },
  cardLocked: {
    borderColor: 'rgba(100,90,80,0.30)',
    backgroundColor: 'rgba(8,6,14,0.45)',
  },
  cardPressed: {
    backgroundColor: 'rgba(200,169,107,0.10)',
  },
  cardLeft:  { flex: 1 },
  cardRight: { alignItems: 'flex-end', minWidth: 48 },

  cardLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 15,
    color: 'rgba(226,184,90,0.95)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,180,140,0.70)',
    letterSpacing: 0.5,
  },
  lockHint: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 10,
    color: 'rgba(150,140,120,0.55)',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  multiplier: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 18,
    color: 'rgba(226,184,90,0.90)',
  },
  progressHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: 'rgba(160,150,130,0.60)',
    marginTop: 2,
  },
  lockIcon: { fontSize: 16, marginTop: 4 },

  textLocked: { opacity: 0.4 },

  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FF8A7A',
    textAlign: 'center',
    marginTop: 16,
  },

  backBtn: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.55)',
    letterSpacing: 3,
  },
});
