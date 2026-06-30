import { ImageSourcePropType } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { Difficulty, StartingTeam, TimeOption } from '../../../types/match.types';

export const CREATE_MATCH_COLORS = {
  background: '#050507',
  panelInk: '#20130A',
  gold: '#C8A96B',
  goldLight: '#F1D28A',
  blueSpectral: '#3AA0FF',
  redInfernal: '#FF4545',
  textPrimary: '#EAD7A0',
  textSecondary: '#CBB68A',
  textMuted: '#8D7B5E',
  danger: '#FF4545',
} as const;

export const CREATE_MATCH_DEFAULTS = {
  difficulty: 'media' as Difficulty,
  mediumTimer: 60 as TimeOption,
  interpretersTimer: 30 as TimeOption,
  startingTeam: 'random' as StartingTeam,
};

export const DIFFICULTY_OPTIONS: Array<{
  key: Difficulty;
  label: string;
  activeIcon: ImageSourcePropType;
  inactiveIcon: ImageSourcePropType;
  color: string;
}> = [
  {
    key: 'facil',
    label: 'FACIL',
    activeIcon: createMatchAssets.icons.difficultyEasyActive,
    inactiveIcon: createMatchAssets.icons.difficultyEasyInactive,
    color: '#5FCED6',
  },
  {
    key: 'media',
    label: 'MEDIA',
    activeIcon: createMatchAssets.icons.difficultyMediumActive,
    inactiveIcon: createMatchAssets.icons.difficultyMediumInactive,
    color: CREATE_MATCH_COLORS.goldLight,
  },
  {
    key: 'dificil',
    label: 'DIFICIL',
    activeIcon: createMatchAssets.icons.difficultyHardActive,
    inactiveIcon: createMatchAssets.icons.difficultyHardInactive,
    color: '#FF8A45',
  },
  {
    key: 'pesadilla',
    label: 'INFERNAL',
    activeIcon: createMatchAssets.icons.difficultyInfernalActive,
    inactiveIcon: createMatchAssets.icons.difficultyInfernalInactive,
    color: CREATE_MATCH_COLORS.redInfernal,
  },
];

export const TIMER_OPTIONS: TimeOption[] = [0, 30, 60, 90];

export const TEAM_OPTIONS: Array<{
  key: StartingTeam;
  label: string;
  icon: ImageSourcePropType;
  color: string;
}> = [
  {
    key: 'blue',
    label: 'AZUL',
    icon: createMatchAssets.icons.teamBlue,
    color: CREATE_MATCH_COLORS.blueSpectral,
  },
  {
    key: 'red',
    label: 'ROJO',
    icon: createMatchAssets.icons.teamRed,
    color: CREATE_MATCH_COLORS.redInfernal,
  },
  {
    key: 'random',
    label: 'ALEATORIO',
    icon: createMatchAssets.icons.teamRandom,
    color: CREATE_MATCH_COLORS.goldLight,
  },
];

export function getTimerLabel(value: TimeOption) {
  return value === 0 ? 'SIN LIMITE' : `${value}s`;
}

export function getCreateMatchScale(width: number, height: number) {
  const isSmallDevice = height < 760;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - 24, isTablet ? 720 : 520);
  const scale = Math.min(width / 390, height / 844);

  return {
    width,
    height,
    isSmallDevice,
    isTablet,
    contentWidth,
    scale: Math.max(0.86, Math.min(scale, 1.12)),
  };
}
