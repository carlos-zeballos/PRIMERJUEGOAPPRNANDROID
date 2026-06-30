import React from 'react';
import { BoardCell, TeamColor } from '../../types/game.types';
import { BoardFrame } from './BoardFrame';

interface Props {
  board: BoardCell[];
  activeTeam: TeamColor;
  onSelectCell: (position: number) => void;
  disabled: boolean;
  revealAll?: boolean;
}

export function GameBoard({ board, activeTeam, onSelectCell, disabled, revealAll = false }: Props) {
  return (
    <BoardFrame
      board={board}
      activeTeam={activeTeam}
      onSelectCell={onSelectCell}
      disabled={disabled}
      revealAll={revealAll}
    />
  );
}
