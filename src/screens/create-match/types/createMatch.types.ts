import { Difficulty, StartingTeam, TimeOption } from '../../../types/match.types';

export type CreateMatchDifficulty = Difficulty;
export type CreateMatchTimerValue = TimeOption;
export type CreateMatchStartingTeam = StartingTeam;

export interface CreateMatchState {
  difficulty: CreateMatchDifficulty;
  mediumTimer: CreateMatchTimerValue;
  interpretersTimer: CreateMatchTimerValue;
  startingTeam: CreateMatchStartingTeam;
}

export type CreateMatchScale = {
  width: number;
  height: number;
  scale: number;
  contentWidth: number;
  isSmallDevice: boolean;
  isTablet: boolean;
};
