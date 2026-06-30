/**
 * progress.tsx — Progreso y estadísticas del modo solitario.
 */

import React, { useEffect } from 'react';
import {
  ImageBackground, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { useSoloGameStore } from '../../src/store/soloGameStore';
import { useAuthStore } from '../../src/store/authStore';
import { DIFFICULTY_CONFIGS, DIFFICULTY_ORDER } from '../../src/domain/solo/config/difficulty.config';
import { COLORS, SPACING } from '../../src/constants/theme';

const FONDO = require('../../assets/images/fondo.png');

function fmt(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SoloProgressScreen() {
  const { user } = useAuthStore();
  const { stats, loadStats } = useSoloGameStore();

  useEffect(() => {
    if (user) loadStats(user.uid);
  }, [user?.uid]);

  return (
    <ImageBackground source={FONDO} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaWrapper style={{ backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.eyebrow}>RITUAL SOLITARIO</Text>
          <Text style={styles.title}>TU PROGRESO</Text>

          {stats ? (
            <>
              {/* Resumen global */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>RESUMEN GENERAL</Text>
                <View style={styles.divider} />
                <Row label="RITUALES JUGADOS" value={String(stats.totalMatches)} />
                <Row label="VICTORIAS"        value={String(stats.totalWins)} />
                <Row label="MEJOR PUNTUACIÓN" value={stats.bestScore.toLocaleString()} color={COLORS.goldGlow} />
                <Row label="RITUALES PERFECTOS" value={String(stats.perfectRituals)} color={COLORS.goldGlow} />
                <Row label="MEJOR RACHA"      value={String(stats.bestWinStreak)} />
                <Row label="PRECISIÓN MEDIA"  value={`${Math.round(stats.averageAccuracy * 100)}%`} />
                <Row label="TIEMPO TOTAL"     value={fmt(stats.totalPlayTimeMs)} />
              </View>

              {/* Progreso por dificultad */}
              <Text style={styles.sectionTitle}>POR DIFICULTAD</Text>
              {DIFFICULTY_ORDER.map(id => {
                const cfg  = DIFFICULTY_CONFIGS[id];
                const prog = stats.difficultyProgress[id];
                return (
                  <View key={id} style={[styles.diffCard, !prog.unlocked && styles.diffLocked]}>
                    <View style={styles.diffHeader}>
                      <Text style={[styles.diffLabel, !prog.unlocked && { opacity: 0.4 }]}>
                        {cfg.label}
                      </Text>
                      {!prog.unlocked && <Text style={styles.lockBadge}>BLOQUEADO</Text>}
                      {prog.unlocked && prog.wins >= 5 && <Text style={styles.masteredBadge}>✦</Text>}
                    </View>
                    {prog.unlocked && (
                      <View style={styles.diffStats}>
                        <MiniStat label="V" value={String(prog.wins)} />
                        <MiniStat label="J" value={String(prog.matches)} />
                        <MiniStat label="MEJOR" value={prog.bestScore.toLocaleString()} />
                        <MiniStat label="PREC."  value={`${Math.round(prog.averageAccuracy * 100)}%`} />
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={styles.loading}>Cargando estadísticas...</Text>
          )}

          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backText}>← VOLVER</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaWrapper>
    </ImageBackground>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={miniStyles.wrap}>
      <Text style={miniStyles.label}>{label}</Text>
      <Text style={miniStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 48 },
  eyebrow: {
    fontFamily: 'Cinzel-Regular', fontSize: 10,
    color: 'rgba(200,169,107,0.55)', letterSpacing: 4,
    textAlign: 'center', marginTop: 8,
  },
  title: {
    fontFamily: 'Cinzel-Bold', fontSize: 26,
    color: 'rgba(226,184,90,0.95)', textAlign: 'center',
    letterSpacing: 3, marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  panel: {
    borderWidth: 1, borderColor: 'rgba(200,169,107,0.25)',
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 14,
    marginBottom: 24, backgroundColor: 'rgba(8,6,14,0.72)',
  },
  panelTitle: {
    fontFamily: 'Cinzel-Bold', fontSize: 10,
    color: 'rgba(200,169,107,0.60)', letterSpacing: 3,
    textAlign: 'center', marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: 'rgba(200,169,107,0.15)', marginBottom: 4 },
  sectionTitle: {
    fontFamily: 'Cinzel-Bold', fontSize: 11,
    color: 'rgba(200,169,107,0.55)', letterSpacing: 3,
    marginBottom: 10,
  },
  diffCard: {
    borderWidth: 1, borderColor: 'rgba(200,169,107,0.25)',
    borderRadius: 8, padding: 12, marginBottom: 8,
    backgroundColor: 'rgba(8,6,14,0.65)',
  },
  diffLocked: { borderColor: 'rgba(100,90,80,0.20)', backgroundColor: 'rgba(8,6,14,0.40)' },
  diffHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  diffLabel: { fontFamily: 'Cinzel-Bold', fontSize: 13, color: 'rgba(226,184,90,0.90)', letterSpacing: 2 },
  lockBadge: { fontFamily: 'Inter-Bold', fontSize: 9, color: 'rgba(140,130,110,0.50)', letterSpacing: 1 },
  masteredBadge: { fontSize: 14, color: COLORS.goldGlow },
  diffStats: { flexDirection: 'row', gap: 12 },
  loading: {
    fontFamily: 'Cinzel-Regular', color: COLORS.textSecondary,
    textAlign: 'center', marginTop: 32, letterSpacing: 2,
  },
  back: { marginTop: 32, alignItems: 'center', paddingVertical: 12 },
  backText: {
    fontFamily: 'Cinzel-Regular', fontSize: 11,
    color: 'rgba(200,169,107,0.50)', letterSpacing: 3,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.10)',
  },
  label: { fontFamily: 'Cinzel-Regular', fontSize: 10, color: 'rgba(200,169,107,0.55)', letterSpacing: 1.5 },
  value: { fontFamily: 'Cinzel-Bold', fontSize: 12, color: 'rgba(226,184,90,0.85)', letterSpacing: 1 },
});

const miniStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  label: { fontFamily: 'Inter-Regular', fontSize: 9, color: 'rgba(160,150,120,0.55)', letterSpacing: 1 },
  value: { fontFamily: 'Cinzel-Bold', fontSize: 12, color: 'rgba(226,184,90,0.80)' },
});
