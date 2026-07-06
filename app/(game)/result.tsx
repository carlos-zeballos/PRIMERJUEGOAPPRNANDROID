import React from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { useGameStore } from '../../src/store/gameStore';
import { useAudioTrack } from '../../src/hooks/useAudioTrack';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

const FONDO        = require('../../assets/images/fondo.png');
const WIN_BLUE     = require('../../assets/images/azulgano.png');    // equipo Azul ganó
const WIN_RED      = require('../../assets/images/azulperido.png');  // equipo Rojo ganó (Azul perdió)
const CURSED_FINAL = require('../../assets/images/palnmalfin.png');  // derrota por Palabra Maldita

export default function ResultScreen() {
  const { session, resetGame, initGame } = useGameStore();
  useAudioTrack('FIN_PARTIDA');

  if (!session || session.phase !== 'GAME_OVER') {
    router.replace('/(tabs)');
    return null;
  }

  const isBlueWin   = session.result === 'BLUE_WIN';
  const cursedCause = session.turns.some((t) =>
    t.attempts.some((a) => a.result === 'CURSED'),
  );

  const winImage = isBlueWin ? WIN_BLUE : WIN_RED;

  // Equipo que perdió = quien activó la maldición
  // Si ganó Azul → perdió Rojo. Si ganó Rojo → perdió Azul.
  // Color: tono oscuro-maldito del equipo perdedor para mantener la estética de la imagen.
  // Color del subtítulo según equipo condenado
  const cursedTeamColor = isBlueWin
    ? '#B75B62'   // rojo ceniza — Equipo Rojo condenado
    : '#A88AC2';  // violeta apagado — Equipo Azul condenado
  const cursedTeamLabel = isBlueWin ? 'EQUIPO ROJO CONDENADO' : 'EQUIPO AZUL CONDENADO';

  const totalMs  = session.endedAt ? session.endedAt - session.startedAt : 0;
  const mins     = Math.floor(totalMs / 60000);
  const secs     = Math.floor((totalMs % 60000) / 1000);
  const timeStr  = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const cursedCell = cursedCause
    ? session.board.find((c) => c.owner === 'CURSED')
    : null;

  async function handleReplay() {
    // No llamar resetGame() antes: pondría session en null síncronamente y
    // dispararía la guarda de arriba (router.replace) mientras initGame
    // todavía está en vuelo (seedWords/generateBoard son async), sacando
    // al usuario de la pantalla antes de que la partida nueva esté lista.
    await initGame(session!.config);
    router.replace('/(game)/medium-view');
  }
  function handleNew()  { resetGame(); router.replace('/(game)/setup'); }
  function handleHome() { resetGame(); router.replace('/(tabs)'); }

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
    <SafeAreaWrapper style={styles.transparent}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {cursedCause ? (
          /* ══ DERROTA — PALABRA MALDITA ══ */
          <View style={styles.curseSection}>
            <Image
              source={CURSED_FINAL}
              style={styles.cursedImage}
              resizeMode="contain"
            />
            <Text style={[styles.curseTitle, { color: cursedTeamColor }]}>
              LA MALDICIÓN{'\n'}CAYÓ SOBRE USTEDES
            </Text>
            <Text style={[styles.cursedTeamLabel, { color: cursedTeamColor }]}>
              {cursedTeamLabel}
            </Text>
            {cursedCell && (
              <View style={styles.cursedWordBox}>
                <Text style={styles.cursedWordLabel}>La Palabra Maldita era</Text>
                <Text style={styles.cursedWord}>{cursedCell.word}</Text>
              </View>
            )}
          </View>
        ) : (
          /* ══ VICTORIA ══ */
          <View style={styles.victorySection}>
            <Image
              source={winImage}
              style={isBlueWin ? styles.victoryImage : styles.victoryImageLarge}
              resizeMode="contain"
            />
          </View>
        )}

        {/* ── Estadísticas ── */}
        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>RESUMEN DE LA PARTIDA</Text>
          <View style={styles.statsDivider} />
          <StatRow label="TURNOS"        value={String(session.turns.length)} />
          <StatRow label="TIEMPO"        value={timeStr} />
          <StatRow
            label="AZUL"
            value={`${session.blueScore} / ${session.blueTotal}`}
            valueColor={COLORS.blueGlow}
          />
          <StatRow
            label="ROJO"
            value={`${session.redScore} / ${session.redTotal}`}
            valueColor={COLORS.redGlow}
          />
          {cursedCause && (
            <StatRow label="CAUSA" value="PALABRA MALDITA" valueColor={COLORS.cursedGlow} />
          )}
        </View>

        {/* ── Acciones ── */}
        <View style={styles.actions}>
          {cursedCause ? (
            /* Botones paleta maldita */
            <>
              <Pressable
                onPress={handleReplay}
                accessibilityRole="button"
                accessibilityLabel="Repetir ritual"
                style={({ pressed }) => [styles.cursedBtn, pressed && styles.cursedBtnPressed]}
              >
                <Text style={styles.cursedBtnText}>REPETIR RITUAL</Text>
              </Pressable>
              <View style={{ height: SPACING.sm }} />
              <Pressable
                onPress={handleNew}
                accessibilityRole="button"
                accessibilityLabel="Nueva partida"
                style={({ pressed }) => [
                  styles.cursedBtn,
                  { backgroundColor: 'transparent' },
                  pressed && styles.cursedBtnPressed,
                ]}
              >
                <Text style={[styles.cursedBtnText, { color: '#9C879F' }]}>NUEVA PARTIDA</Text>
              </Pressable>
              <View style={{ height: SPACING.sm }} />
              <Pressable
                onPress={handleHome}
                accessibilityRole="button"
                accessibilityLabel="Inicio"
                style={({ pressed }) => [
                  styles.cursedBtn,
                  { backgroundColor: 'transparent', borderColor: 'transparent' },
                  pressed && styles.cursedBtnPressed,
                ]}
              >
                <Text style={[styles.cursedBtnText, { color: '#7A6880', fontSize: 11 }]}>INICIO</Text>
              </Pressable>
            </>
          ) : (
            /* Botones normales (victoria) */
            <>
              <Button label="REPETIR RITUAL"   variant="primary"   onPress={handleReplay} />
              <View style={{ height: SPACING.sm }} />
              <Button label="NUEVA PARTIDA"    variant="secondary" onPress={handleNew} />
              <View style={{ height: SPACING.sm }} />
              <Button label="INICIO"           variant="ghost"     onPress={handleHome} />
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaWrapper>
    </ImageBackground>
  );
}

function StatRow({
  label, value, valueColor,
}: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },

  /* ── Victoria ── */
  victorySection: {
    alignItems: 'center',
    marginBottom: -20,
  },
  victoryImage: {
    width: '100%',
    height: 340,
  },
  victoryImageLarge: {
    width: '100%',
    height: 560,
  },

  /* ── Maldita ── */
  curseSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  cursedImage: {
    width: 420,
    height: 360,
    marginBottom: -40,
  },
  curseTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 26,
    color: '#D6C39A',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  cursedTeamLabel: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 13,
    color: '#9C879F',
    letterSpacing: 3,
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cursedWordBox: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6F4A82',
    borderRadius: 8,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(25,10,32,0.94)',
  },
  cursedWordLabel: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: '#BFB39A',
    letterSpacing: 2,
  },
  cursedWord: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 32,
    color: '#C3A9CB',
    marginTop: 6,
    letterSpacing: 4,
    textShadowColor: 'rgba(118,70,150,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  // Botón primario en paleta maldita
  cursedBtn: {
    backgroundColor: '#241728',
    borderWidth: 1,
    borderColor: '#8B6A92',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursedBtnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 12,
    letterSpacing: 3,
    color: '#D8C7A4',
  },
  cursedBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  /* ── Panel stats ── */
  statsPanel: {
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.35)',
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(8,7,16,0.72)',
  },
  statsPanelTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 11,
    color: 'rgba(200,169,107,0.70)',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(200,169,107,0.20)',
    marginBottom: SPACING.xs,
  },

  actions: { gap: 0 },
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.12)',
  },
  label: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(200,169,107,0.65)',
    letterSpacing: 2,
  },
  value: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    color: 'rgba(234,226,216,0.90)',
    letterSpacing: 1,
  },
});
