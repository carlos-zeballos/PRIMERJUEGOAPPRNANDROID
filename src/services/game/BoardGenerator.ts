import {
  BoardCell,
  CellOwner,
  GameConfig,
  TeamColor,
} from '../../types/game.types';
import { fisherYatesShuffle, seededShuffle } from '../../utils/array.utils';
import { generateId } from '../../utils/uuid.utils';
import { normalize } from '../../utils/string.utils';
import { getBoardWordsForDifficulty } from './BoardVocabulary';
import {
  BOARD_SIZE,
  FIRST_TEAM_WORD_COUNT,
  SECOND_TEAM_WORD_COUNT,
  NEUTRAL_WORD_COUNT,
} from '../../constants/gameConfig';

export async function generateBoard(config: GameConfig): Promise<BoardCell[]> {
  const { difficulty, firstTeam } = config;
  const secondTeam: TeamColor = firstTeam === 'BLUE' ? 'RED' : 'BLUE';

  const selected = fisherYatesShuffle(getBoardWordsForDifficulty(difficulty)).slice(0, BOARD_SIZE);

  const owners: CellOwner[] = [
    ...Array(FIRST_TEAM_WORD_COUNT).fill(firstTeam),
    ...Array(SECOND_TEAM_WORD_COUNT).fill(secondTeam),
    ...Array(NEUTRAL_WORD_COUNT).fill('NEUTRAL' as CellOwner),
    'CURSED' as CellOwner,
  ];

  const shuffledOwners = fisherYatesShuffle(owners);

  const board: BoardCell[] = selected.map((word, index) => ({
    id: generateId(),
    position: index,
    word,
    owner: shuffledOwners[index],
    state: 'HIDDEN',
  }));

  validateBoard(board, firstTeam, secondTeam);

  return board;
}

/**
 * Genera un tablero reproducible usando una semilla determinista.
 * Mismo seed + misma configuración = mismo tablero siempre.
 * Usado en el modo solitario para sincronización y auditoría.
 */
export async function generateBoardWithSeed(
  config: GameConfig,
  seed: string,
): Promise<BoardCell[]> {
  const { difficulty, firstTeam } = config;
  const secondTeam: TeamColor = firstTeam === 'BLUE' ? 'RED' : 'BLUE';

  // Shuffle con semilla para reproducibilidad
  const selected = seededShuffle(getBoardWordsForDifficulty(difficulty, seed), `${seed}-words`).slice(0, BOARD_SIZE);

  const owners: CellOwner[] = [
    ...Array(FIRST_TEAM_WORD_COUNT).fill(firstTeam),
    ...Array(SECOND_TEAM_WORD_COUNT).fill(secondTeam),
    ...Array(NEUTRAL_WORD_COUNT).fill('NEUTRAL' as CellOwner),
    'CURSED' as CellOwner,
  ];

  const shuffledOwners = seededShuffle(owners, `${seed}-owners`);

  const board: BoardCell[] = selected.map((word, index) => ({
    id: `${seed}-${index}`,   // IDs deterministas para el mismo seed
    position: index,
    word,
    owner: shuffledOwners[index],
    state: 'HIDDEN',
  }));

  validateBoard(board, firstTeam, secondTeam);
  return board;
}

function validateBoard(board: BoardCell[], firstTeam: TeamColor, secondTeam: TeamColor): void {
  if (board.length !== BOARD_SIZE) throw new Error(`Board must have ${BOARD_SIZE} cells`);

  const counts = board.reduce<Record<CellOwner, number>>(
    (acc, cell) => {
      acc[cell.owner] = (acc[cell.owner] ?? 0) + 1;
      return acc;
    },
    { BLUE: 0, RED: 0, NEUTRAL: 0, CURSED: 0 }
  );

  if (counts[firstTeam] !== FIRST_TEAM_WORD_COUNT) {
    throw new Error(`First team must have ${FIRST_TEAM_WORD_COUNT} words`);
  }
  if (counts[secondTeam] !== SECOND_TEAM_WORD_COUNT) {
    throw new Error(`Second team must have ${SECOND_TEAM_WORD_COUNT} words`);
  }
  if (counts.NEUTRAL !== NEUTRAL_WORD_COUNT) {
    throw new Error(`Neutral must have ${NEUTRAL_WORD_COUNT} words`);
  }
  if (counts.CURSED !== 1) {
    throw new Error('Board must have exactly 1 CURSED word');
  }

  const uniqueWords = new Set(board.map((c) => normalize(c.word)));
  if (uniqueWords.size !== BOARD_SIZE) {
    throw new Error('All board words must be unique');
  }
}
