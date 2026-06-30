import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaWrapper } from '../src/components/layout/SafeAreaWrapper';
import { GameBoard } from '../src/components/game/GameBoard';
import { BoardCell } from '../src/types/game.types';
import { COLORS, TYPOGRAPHY } from '../src/constants/theme';

const WORDS = [
  'UMBRAL', 'AGUA', 'ORACULO', 'LUNA', 'ABISMO',
  'CAMINO', 'ECLIPSE', 'PACTO', 'FUEGO', 'SOMBRA',
  'OUROBOROS', 'RELOJ', 'CRIPTA', 'AZUL', 'MALDICION',
  'LABERINTO', 'RITUAL', 'PUERTA', 'ENTROPIA', 'FANTASMA',
  'VORTICE', 'CENIZA', 'ANATEMA', 'ESPEJO', 'SILENCIO',
];

const OWNERS: BoardCell['owner'][] = [
  'BLUE', 'RED', 'NEUTRAL', 'BLUE', 'CURSED',
  'RED', 'BLUE', 'NEUTRAL', 'RED', 'BLUE',
  'RED', 'NEUTRAL', 'BLUE', 'RED', 'NEUTRAL',
  'BLUE', 'RED', 'NEUTRAL', 'BLUE', 'RED',
  'NEUTRAL', 'BLUE', 'RED', 'BLUE', 'NEUTRAL',
];

const MOCK_BOARD: BoardCell[] = WORDS.map((word, index) => ({
  id: `qa-${index}`,
  position: index,
  word,
  owner: OWNERS[index],
  state: index % 4 === 0 ? 'REVEALED' : 'HIDDEN',
}));

export default function VisualQaBoardScreen() {
  return (
    <SafeAreaWrapper>
      <View style={styles.wrap}>
        <Text style={styles.title}>QA TABLERO</Text>
        <GameBoard
          board={MOCK_BOARD}
          activeTeam="BLUE"
          disabled
          revealAll
          onSelectCell={() => {}}
        />
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: COLORS.void,
  },
  title: {
    ...TYPOGRAPHY.body,
    color: COLORS.goldGlow,
    letterSpacing: 3,
    marginBottom: 8,
  },
});
