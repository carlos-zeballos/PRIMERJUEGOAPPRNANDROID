/**
 * assets.ts — constantes globales de assets del juego.
 *
 * Para assets del tablero y cartas, usa boardAssets.ts (canonical).
 * Este archivo re-exporta boardAssets para compatibilidad con código existente.
 */
import { ImageSourcePropType } from 'react-native';
import { boardAssets } from '../assets/boardAssets';

export const GAME_ASSETS = {
  boardFrame: boardAssets.frame,

  cards: {
    hidden:        boardAssets.cards.hidden,
    blueRevealed:  boardAssets.cards.blueRevealed,
    redRevealed:   boardAssets.cards.redRevealed,
    cursedRevealed: boardAssets.cards.cursed,
    /** @deprecated usar blueRevealed */
    blueCorrect:   boardAssets.cards.blueRevealed,
    /** @deprecated usar redRevealed */
    redCorrect:    boardAssets.cards.redRevealed,
  },

  panels: {
    ritualTimerConfig: require('../../assets/panels/panel_ritual_timer_config_1254.png') as ImageSourcePropType,
  },
} as const;
