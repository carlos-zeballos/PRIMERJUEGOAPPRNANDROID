import { BoardCell, GameSession, TeamColor, Turn, TurnAttempt, TurnEndReason, Whisper } from '../../types/game.types';
import { generateId } from '../../utils/uuid.utils';

export function createNewTurn(
  gameId: string,
  teamColor: TeamColor,
  turnNumber: number,
  whisper: Whisper
): Turn {
  const maxAttempts = whisper.number === 'INFINITE' ? Infinity : whisper.number + 1;
  return {
    id: generateId(),
    gameId,
    teamColor,
    turnNumber,
    whisper,
    attempts: [],
    maxAttempts,
    startedAt: Date.now(),
  };
}

export function processCellSelection(
  session: GameSession,
  position: number
): { session: GameSession; attemptResult: TurnAttempt['result'] | 'IGNORED' } {
  const cell = session.board[position];
  const currentTurn = session.turns[session.turns.length - 1];

  if (!cell || !currentTurn || cell.state === 'REVEALED') {
    return { session, attemptResult: 'IGNORED' };
  }

  let result: TurnAttempt['result'];
  if (cell.owner === session.activeTeam) {
    result = 'CORRECT';
  } else if (cell.owner === 'CURSED') {
    result = 'CURSED';
  } else if (cell.owner === 'NEUTRAL') {
    result = 'NEUTRAL';
  } else {
    result = 'ENEMY';
  }

  const attempt: TurnAttempt = {
    id: generateId(),
    turnId: currentTurn.id,
    cellPosition: position,
    result,
    attemptNumber: currentTurn.attempts.length + 1,
    timestamp: Date.now(),
  };

  const updatedBoard = session.board.map((c) =>
    c.position === position
      ? { ...c, state: 'REVEALED' as const, revealedBy: session.activeTeam, revealedAt: Date.now() }
      : c
  );

  let updatedBlueScore = session.blueScore;
  let updatedRedScore = session.redScore;
  if (result === 'CORRECT') {
    if (session.activeTeam === 'BLUE') updatedBlueScore++;
    else updatedRedScore++;
  } else if (result === 'ENEMY') {
    if (session.activeTeam === 'BLUE') updatedRedScore++;
    else updatedBlueScore++;
  }

  const updatedTurn: Turn = {
    ...currentTurn,
    attempts: [...currentTurn.attempts, attempt],
  };

  const updatedTurns = [...session.turns.slice(0, -1), updatedTurn];

  let endReason: TurnEndReason | undefined;
  let nextPhase = session.phase;
  let nextActiveTeam = session.activeTeam;
  let nextResult = session.result;

  if (result === 'CURSED') {
    endReason = 'CURSED_HIT';
    nextPhase = 'GAME_OVER';
    nextResult = session.activeTeam === 'BLUE' ? 'RED_WIN' : 'BLUE_WIN';
  } else if (updatedBlueScore >= session.blueTotal) {
    nextPhase = 'GAME_OVER';
    nextResult = 'BLUE_WIN';
  } else if (updatedRedScore >= session.redTotal) {
    nextPhase = 'GAME_OVER';
    nextResult = 'RED_WIN';
  } else if (result === 'NEUTRAL' || result === 'ENEMY') {
    endReason = result === 'NEUTRAL' ? 'NEUTRAL_HIT' : 'ENEMY_HIT';
    nextActiveTeam = session.activeTeam === 'BLUE' ? 'RED' : 'BLUE';
    nextPhase = 'MEDIUM_TURN';
  } else {
    const usedAttempts = updatedTurn.attempts.length;
    const maxAttempts = updatedTurn.maxAttempts;
    if (usedAttempts >= maxAttempts) {
      endReason = 'CORRECT_EXHAUSTED';
      nextActiveTeam = session.activeTeam === 'BLUE' ? 'RED' : 'BLUE';
      nextPhase = 'MEDIUM_TURN';
    }
  }

  if (endReason) {
    updatedTurns[updatedTurns.length - 1] = {
      ...updatedTurns[updatedTurns.length - 1],
      endReason,
      endedAt: Date.now(),
    };
  }

  const updatedSession: GameSession = {
    ...session,
    board: updatedBoard,
    turns: updatedTurns,
    phase: nextPhase,
    activeTeam: nextActiveTeam,
    result: nextResult,
    blueScore: updatedBlueScore,
    redScore: updatedRedScore,
    endedAt: nextPhase === 'GAME_OVER' ? Date.now() : undefined,
  };

  return { session: updatedSession, attemptResult: result };
}

export function passVoluntarily(session: GameSession): GameSession {
  const currentTurn = session.turns[session.turns.length - 1];
  const updatedTurn: Turn = {
    ...currentTurn,
    endReason: 'VOLUNTARY_PASS',
    endedAt: Date.now(),
  };

  return {
    ...session,
    turns: [...session.turns.slice(0, -1), updatedTurn],
    phase: 'MEDIUM_TURN',
    activeTeam: session.activeTeam === 'BLUE' ? 'RED' : 'BLUE',
  };
}
