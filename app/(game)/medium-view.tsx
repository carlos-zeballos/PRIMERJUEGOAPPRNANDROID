import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { Modal } from '../../src/components/ui/Modal';
import { GameBoard } from '../../src/components/game/GameBoard';
import { useGameStore } from '../../src/store/gameStore';
import { CellOwner } from '../../src/types/game.types';
import { validateWhisper, validateWhisperNumber } from '../../src/services/game/WordValidator';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useAudioTrack } from '../../src/hooks/useAudioTrack';
import { useTurnCountdown } from '../../src/hooks/useTurnCountdown';

const FONDO = require('../../assets/images/fondo.png');

const OWNER_COLORS: Record<CellOwner, string> = {
  BLUE:    COLORS.blueGlow,
  RED:     COLORS.redGlow,
  NEUTRAL: 'rgba(140,136,160,0.80)',
  CURSED:  COLORS.cursedGlow,
};

const OWNER_LABELS: Record<CellOwner, string> = {
  BLUE:    'AZUL',
  RED:     'ROJO',
  NEUTRAL: 'NEUTRAL',
  CURSED:  'MALDITA',
};

export default function MediumViewScreen() {
  const { session, submitWhisper, skipMediumTurn } = useGameStore();
  useAudioTrack('TENSION');
  const [modalVisible, setModalVisible]   = useState(false);
  const [whisperWord, setWhisperWord]     = useState('');
  const [whisperNumber, setWhisperNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  // El hook debe llamarse siempre en el mismo orden — por eso el "apagado"
  // del countdown se resuelve pasando seconds=null en vez de saltarse el
  // hook con un return temprano (session puede ser null en este punto).
  const remainingSeconds = useTurnCountdown(
    session?.phase === 'MEDIUM_TURN' ? session.config.mediumTimeSeconds : null,
    session?.activeTeam ?? '',
    () => {
      setModalVisible(false);
      skipMediumTurn();
      // skipMediumTurn() cambia el equipo activo pero deja phase en
      // MEDIUM_TURN (no hay Turn sin whisper) — sin este replace, esta misma
      // pantalla seguiría montada y revelaría de inmediato el tablero secreto
      // del equipo rival a quien tenga el dispositivo en mano en ese instante.
      router.replace('/(game)/handoff');
    },
  );

  // La navegación es un efecto secundario y debe correr en un useEffect,
  // nunca en el cuerpo del render: llamar a router.replace() sincrónicamente
  // durante el render dispara "Cannot update a component (NavigationContainerInner)
  // while rendering a different component (MediumViewScreen)", porque
  // expo-router actualiza el estado del NavigationContainer al navegar.
  useEffect(() => {
    if (!session) { router.replace('/(tabs)'); return; }
    // Evita reenviar una pista si se volvió a esta pantalla (back/gesto) tras
    // que la fase ya avanzó — antes esto quedaba como un no-op silencioso.
    if (session.phase !== 'MEDIUM_TURN') { router.replace('/(game)/board'); }
  }, [session]);

  if (!session || session.phase !== 'MEDIUM_TURN') return null;

  const { board, activeTeam } = session;
  const teamLabel = activeTeam === 'BLUE' ? 'AZUL' : 'ROJO';
  const teamColor = activeTeam === 'BLUE' ? COLORS.blueGlow : COLORS.redGlow;
  const teamBorderColor = activeTeam === 'BLUE'
    ? 'rgba(138,200,255,0.30)'
    : 'rgba(255,128,128,0.30)';
  const usedWords = board
    .filter((cell) => cell.state === 'REVEALED')
    .map((cell) => cell.word.toUpperCase());
  const previewWords = usedWords.slice(0, 8);
  const remainingUsedWords = usedWords.length > previewWords.length
    ? usedWords.length - previewWords.length
    : 0;

  function handleSubmit() {
    setValidationError('');
    const wordVal = validateWhisper(whisperWord, board);
    if (!wordVal.valid) { setValidationError(wordVal.reason ?? 'Susurro invalido.'); return; }
    if (!validateWhisperNumber(whisperNumber)) {
      setValidationError('Número 0-9 o infinito.');
      return;
    }
    const num = whisperNumber === '∞' || whisperNumber.toUpperCase() === 'INFINITE'
      ? 'INFINITE' as const
      : parseInt(whisperNumber, 10);
    submitWhisper(whisperWord.toUpperCase().trim(), num);
    setModalVisible(false);
    setWhisperWord('');
    setWhisperNumber('');
    router.replace('/(game)/board');
  }

  return (
    <ImageBackground source={FONDO} style={styles.bg} resizeMode="cover">
    <SafeAreaWrapper style={styles.transparent}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Cabecera ── */}
        <View style={[styles.header, { borderBottomColor: teamBorderColor }]}>
          <Text style={styles.headerEyebrow}>👁 FASE DEL MEDIUM</Text>
          <Text style={[styles.headerTeam, { color: teamColor }]}>
            JUGADOR {teamLabel} ES EL MEDIUM
          </Text>
          <Text style={styles.headerNote}>
            Solo tú ves los colores del tablero. Elige una pista y un número para guiar a tu equipo.
          </Text>
          {remainingSeconds !== null && (
            <Text style={[styles.countdown, remainingSeconds <= 10 && styles.countdownUrgent]}>
              ⏱ {remainingSeconds}s
            </Text>
          )}
        </View>

        {/* ── Seguimiento visual de palabras ya elegidas ── */}
        {usedWords.length > 0 ? (
          <View style={styles.usedWordsPanel}>
            <View style={styles.usedWordsHeader}>
              <Text style={styles.usedWordsTitle}>PALABRAS YA ELEGIDAS</Text>
              <Text style={styles.usedWordsHint}>Evita repetirlas en futuras pistas</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usedWordsList}
            >
              {previewWords.map((word) => (
                <View key={word} style={styles.usedWordChip}>
                  <Text style={styles.usedWordText}>{word}</Text>
                </View>
              ))}
              {remainingUsedWords > 0 ? (
                <View style={styles.usedWordChipSecondary}>
                  <Text style={styles.usedWordTextSecondary}>+{remainingUsedWords}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Tablero ── */}
        <View style={styles.boardContainer}>
          <GameBoard
            board={board}
            activeTeam={activeTeam}
            disabled
            revealAll
            onSelectCell={() => {}}
          />
        </View>

        {/* ── Leyenda ── */}
        <View style={styles.legend}>
          {(['BLUE', 'RED', 'NEUTRAL', 'CURSED'] as CellOwner[]).map((owner) => (
            <View key={owner} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: OWNER_COLORS[owner] }]} />
              <Text style={[styles.legendLabel, { color: OWNER_COLORS[owner] }]}>
                {OWNER_LABELS[owner]}
              </Text>
            </View>
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={styles.cta}>
          <Button label="DAR PISTA A MI EQUIPO" variant="primary" onPress={() => setModalVisible(true)} />
        </View>

      </ScrollView>

      <Modal visible={modalVisible} title="DAR PISTA" onClose={() => setModalVisible(false)}>
        <Text style={modalStyles.label}>PALABRA PISTA</Text>
        <Text style={modalStyles.hint}>Una sola palabra que conecte las cartas de tu equipo</Text>
        <TextInput
          style={modalStyles.input}
          value={whisperWord}
          onChangeText={(t) => setWhisperWord(t.toUpperCase())}
          placeholder="Ej: OCÉANO"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={30}
        />

        <Text style={[modalStyles.label, { marginTop: SPACING.md }]}>¿CUÁNTAS CARTAS ADIVINARÁN?</Text>
        <Text style={modalStyles.hint}>Escribe un número (1-9) o ∞ para infinito</Text>
        <TextInput
          style={modalStyles.input}
          value={whisperNumber}
          onChangeText={setWhisperNumber}
          placeholder="2"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="default"
          maxLength={8}
        />

        {validationError ? <Text style={modalStyles.error}>{validationError}</Text> : null}

        <View style={{ height: SPACING.lg }} />
        <Button label="ENVIAR PISTA" variant="primary" onPress={handleSubmit} />
        <View style={{ height: SPACING.sm }} />
        <Button label="CANCELAR" variant="ghost" onPress={() => setModalVisible(false)} />
      </Modal>
    </SafeAreaWrapper>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  transparent: { backgroundColor: 'transparent' },

  scroll: {
    padding: SPACING.base,
    paddingBottom: SPACING['2xl'],
  },

  header: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerEyebrow: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 10,
    color: 'rgba(200,169,107,0.60)',
    letterSpacing: 4,
    marginBottom: 4,
  },
  headerTeam: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 26,
    letterSpacing: 5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerNote: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 11,
    color: 'rgba(160,155,175,0.70)',
    marginTop: 6,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  countdown: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 16,
    color: 'rgba(200,169,107,0.85)',
    marginTop: 8,
    letterSpacing: 2,
  },
  countdownUrgent: {
    color: COLORS.error,
  },

  usedWordsPanel: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.20)',
    backgroundColor: 'rgba(8,7,16,0.72)',
  },
  usedWordsHeader: {
    marginBottom: SPACING.sm,
  },
  usedWordsTitle: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 2,
  },
  usedWordsHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(200,190,160,0.75)',
  },
  usedWordsList: {
    alignItems: 'center',
    paddingRight: SPACING.xs,
  },
  usedWordChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginRight: SPACING.xs,
    backgroundColor: 'rgba(255,146,77,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,146,77,0.34)',
  },
  usedWordChipSecondary: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  usedWordText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  usedWordTextSecondary: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: 'rgba(240,230,210,0.85)',
    letterSpacing: 1,
  },

  boardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.20)',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    backgroundColor: 'rgba(8,7,16,0.65)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 9,
    letterSpacing: 1.5,
  },

  cta: { marginTop: SPACING.xs },
});

const modalStyles = StyleSheet.create({
  label: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: 'rgba(200,169,107,0.80)',
    letterSpacing: 2.5,
    marginBottom: SPACING.sm,
  },
  input: {
    fontFamily: 'Cinzel-Regular',
    fontSize: 20,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,169,107,0.40)',
    paddingVertical: SPACING.sm,
    letterSpacing: 3,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(180,160,120,0.60)',
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
});
