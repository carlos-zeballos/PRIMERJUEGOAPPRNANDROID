/**
 * boardAssets.ts
 * Mapa centralizado de assets del tablero y cartas.
 * Importar desde aquí en lugar de hacer require() individuales.
 *
 * Assets disponibles:
 *   assets/board/board_frame_main_empty_1254.png  — 1254×1254 cuadrado
 *   assets/cards/card_hidden_base_1254.png         — 1254×1254 cuadrado
 *   assets/cards/card_team_blue_revealed_1254.png  — 1254×1254 cuadrado
 *   assets/cards/card_team_red_revealed_1254.png   — 1254×1254 cuadrado
 *   assets/cards/card_cursed_maldita_1254.png      — 1254×1254 cuadrado
 *
 * Carta neutral: aún no existe asset propio.
 * Se usa card_hidden_base_1254.png + neutralOverlay gris hasta que se cree.
 */
import { ImageSourcePropType } from 'react-native';

export const boardAssets = {
  /** Marco decorativo exterior del tablero (azul izquierda / rojo derecha). */
  frame: require('../../assets/board/board_frame_main_empty_1254.png') as ImageSourcePropType,

  cards: {
    /** Carta oculta — mostrada durante fase Intérpretes y por el Medium antes de revelar. */
    hidden:       require('../../assets/cards/card_hidden_base_1254.png') as ImageSourcePropType,

    /** Carta azul revelada — pertenece al Equipo Azul y fue descubierta. */
    blueRevealed: require('../../assets/cards/card_team_blue_revealed_1254.png') as ImageSourcePropType,

    /** Carta roja revelada — pertenece al Equipo Rojo y fue descubierta. */
    redRevealed:  require('../../assets/cards/card_team_red_revealed_1254.png') as ImageSourcePropType,

    /**
     * Palabra Maldita — carta maldita revelada.
     * Al descubrirla el equipo pierde inmediatamente.
     */
    cursed:       require('../../assets/cards/card_cursed_maldita_1254.png') as ImageSourcePropType,
  },
} as const;

/**
 * Selecciona el asset correcto para cada estado de carta.
 *
 * @param isVisible  true = owner visible (Medium en su fase, o carta ya revelada)
 * @param owner      dueño de la carta según el modelo de juego
 */
export function getCardAsset(
  isVisible: boolean,
  owner: 'BLUE' | 'RED' | 'NEUTRAL' | 'CURSED',
): ImageSourcePropType {
  if (!isVisible) return boardAssets.cards.hidden;

  switch (owner) {
    case 'BLUE':    return boardAssets.cards.blueRevealed;
    case 'RED':     return boardAssets.cards.redRevealed;
    case 'CURSED':  return boardAssets.cards.cursed;
    case 'NEUTRAL':
    default:
      // Sin asset neutral propio todavía → hidden + overlay gris en GameCard
      return boardAssets.cards.hidden;
  }
}
