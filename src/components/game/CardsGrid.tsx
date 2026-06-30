import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { BoardLayoutMetrics } from '../../constants/boardLayout';
import { GRID_SIZE } from '../../constants/gameConfig';
import { BoardCell, TeamColor } from '../../types/game.types';
import { GameCard } from './GameCard';

interface Props {
  board: BoardCell[];
  activeTeam: TeamColor;
  disabled: boolean;
  revealAll?: boolean;
  metrics: BoardLayoutMetrics;
  onSelectCell: (position: number) => void;
}

function CardsGridBase({ board, activeTeam, disabled, revealAll = false, metrics, onSelectCell }: Props) {
  const handleCardPress = useCallback((position: number) => {
    if (disabled) return;
    onSelectCell(position);
  }, [disabled, onSelectCell]);

  return (
    <View
      style={[
        styles.grid,
        {
          left: metrics.innerLeft,
          top: metrics.innerTop,
          width: metrics.gridWidth,
          height: metrics.gridHeight,
          gap: metrics.gap,
        },
      ]}
    >
      {board.slice(0, GRID_SIZE * GRID_SIZE).map((cell, index) => (
        <GameCard
          key={cell.id}
          cell={cell}
          activeTeam={activeTeam}
          cardSize={metrics.cardSize}
          disabled={disabled}
          index={index}
          pending={false}
          revealAll={revealAll}
          onPress={handleCardPress}
        />
      ))}
    </View>
  );
}

export const CardsGrid = memo(CardsGridBase);

const styles = StyleSheet.create({
  grid: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
});
