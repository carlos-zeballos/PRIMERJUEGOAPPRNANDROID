import { getDatabase } from './SQLiteClient';
import { GameSession } from '../../types/game.types';

interface GameRow {
  id: string;
  config_json: string;
  board_json: string;
  turns_json: string;
  active_team: string;
  phase: string;
  result: string;
  blue_score: number;
  red_score: number;
  blue_total: number;
  red_total: number;
  started_at: number;
  ended_at: number | null;
  synced_at: number | null;
}

function rowToSession(row: GameRow): GameSession {
  return {
    id: row.id,
    config: JSON.parse(row.config_json),
    board: JSON.parse(row.board_json),
    turns: JSON.parse(row.turns_json),
    activeTeam: row.active_team as GameSession['activeTeam'],
    phase: row.phase as GameSession['phase'],
    result: row.result as GameSession['result'],
    blueScore: row.blue_score,
    redScore: row.red_score,
    blueTotal: row.blue_total,
    redTotal: row.red_total,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    syncedAt: row.synced_at ?? undefined,
    currentTurnIndex: 0,
  };
}

export async function saveGameSession(session: GameSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO game_sessions
      (id, config_json, board_json, turns_json, active_team, phase, result,
       blue_score, red_score, blue_total, red_total, started_at, ended_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      JSON.stringify(session.config),
      JSON.stringify(session.board),
      JSON.stringify(session.turns),
      session.activeTeam,
      session.phase,
      session.result,
      session.blueScore,
      session.redScore,
      session.blueTotal,
      session.redTotal,
      session.startedAt,
      session.endedAt ?? null,
      session.syncedAt ?? null,
    ]
  );
}

export async function getGameHistory(limit = 20): Promise<GameSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GameRow>(
    'SELECT * FROM game_sessions WHERE ended_at IS NOT NULL ORDER BY ended_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToSession);
}

export async function getActiveGame(): Promise<GameSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GameRow>(
    "SELECT * FROM game_sessions WHERE phase != 'GAME_OVER' ORDER BY started_at DESC LIMIT 1"
  );
  return row ? rowToSession(row) : null;
}
