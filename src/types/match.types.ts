export type Difficulty = 'facil' | 'media' | 'dificil' | 'pesadilla';
export type TimeOption = 0 | 30 | 60 | 90;
export type StartingTeam = 'blue' | 'red' | 'random';

export interface MatchConfig {
  difficulty: Difficulty;
  mediumTime: TimeOption;
  interpreterTime: TimeOption;
  startingTeam: StartingTeam;
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  difficulty: 'media',
  mediumTime: 60,
  interpreterTime: 30,
  startingTeam: 'random',
};
