/**
 * BoardFrame — marco decorativo del tablero + cuadrícula de cartas.
 *
 * Capas:
 *   1. board_frame_main_empty_1254.png → decoración exterior (pointerEvents none)
 *   2. CardsGrid → 5×5 cartas posicionadas en el área interior del marco
 *
 * El marco es cuadrado (1254×1254). El área interior útil empieza
 * aproximadamente en el 13.5 % del lado de cada borde.
 * Las métricas exactas se calculan en boardLayout.ts.
 */

import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { boardAssets } from '../../assets/boardAssets';
import { getBoardLayoutMetrics } from '../../constants/boardLayout';
import { BoardCell, TeamColor } from '../../types/game.types';
import { CardsGrid } from './CardsGrid';
import { Image } from 'react-native';

interface Props {
  board:        BoardCell[];
  activeTeam:   TeamColor;
  onSelectCell: (position: number) => void;
  disabled:     boolean;
  revealAll?:   boolean;
}

export function BoardFrame({
  board, activeTeam, onSelectCell, disabled, revealAll = false,
}: Props) {
  const { width } = useWindowDimensions();
  const metrics   = useMemo(() => getBoardLayoutMetrics(width), [width]);

  return (
    <View
      style={[
        styles.shell,
        { width: metrics.boardWidth, height: metrics.boardHeight },
      ]}
    >
      {/* Marco decorativo — detrás de todo, sin capturar toques */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Image
          source={boardAssets.frame}
          resizeMode="stretch"
          style={styles.frame}
        />
      </View>

      {/* Cuadrícula de cartas sobre el área interior del marco */}
      <CardsGrid
        board={board}
        activeTeam={activeTeam}
        disabled={disabled}
        revealAll={revealAll}
        metrics={metrics}
        onSelectCell={onSelectCell}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'center',
    position: 'relative',
  },
  frame: {
    width: '100%',
    height: '100%',
  },
});
