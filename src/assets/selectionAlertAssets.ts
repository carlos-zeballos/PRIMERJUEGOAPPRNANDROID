/**
 * selectionAlertAssets.ts
 * Imágenes de resultado que se muestran después de cada selección.
 *
 * Convención de nombres:
 *   correctBlue    → equipo Azul eligió palabra Azul    → ¡acierto!
 *   correctRed     → equipo Rojo eligió palabra Roja    → ¡acierto!
 *   blueHelpedRed  → equipo Azul eligió palabra Roja    → ayudó al rival
 *   redHelpedBlue  → equipo Rojo eligió palabra Azul    → ayudó al rival
 *   neutral        → palabra sin equipo                 → turno termina
 *   cursed         → Palabra Maldita                    → derrota inmediata
 *   background     → fondo oscuro genérico (opcional)
 */

export const selectionAlertAssets = {
  correctBlue:   require('../../assets/images/loencontrastezul.png'),
  correctRed:    require('../../assets/images/loencontrasterojo.png'),
  blueHelpedRed: require('../../assets/images/equipoazulayudoalrojo.png'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  redHelpedBlue: require('../../assets/images/equipo Rojoayudaalazul.png'),
  neutral:       require('../../assets/images/palabrasinequipo.png'),
  cursed:        require('../../assets/images/palabramaldita.png'),
  background:    require('../../assets/images/fondo.png'),
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SelectionAlertType =
  | 'correct_blue'
  | 'correct_red'
  | 'blue_helped_red'
  | 'red_helped_blue'
  | 'neutral'
  | 'cursed';

export interface SelectionAlertConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image:               any;
  autoCloseMs:         number | null;  // null = requiere confirmación manual
  endsTurn:            boolean;
  buttonLabel:         string;
  a11yMessage:         string;
}

export const ALERT_CONFIG: Record<SelectionAlertType, SelectionAlertConfig> = {
  correct_blue: {
    image:       selectionAlertAssets.correctBlue,
    autoCloseMs: 1400,
    endsTurn:    false,
    buttonLabel: 'CONTINUAR',
    a11yMessage: 'Equipo Azul encontró una palabra correcta.',
  },
  correct_red: {
    image:       selectionAlertAssets.correctRed,
    autoCloseMs: 1400,
    endsTurn:    false,
    buttonLabel: 'CONTINUAR',
    a11yMessage: 'Equipo Rojo encontró una palabra correcta.',
  },
  blue_helped_red: {
    image:       selectionAlertAssets.blueHelpedRed,
    autoCloseMs: 2000,
    endsTurn:    true,
    buttonLabel: 'CONTINUAR',
    a11yMessage: 'El Equipo Azul ayudó al Equipo Rojo. El turno termina.',
  },
  red_helped_blue: {
    image:       selectionAlertAssets.redHelpedBlue,
    autoCloseMs: 2000,
    endsTurn:    true,
    buttonLabel: 'CONTINUAR',
    a11yMessage: 'El Equipo Rojo ayudó al Equipo Azul. El turno termina.',
  },
  neutral: {
    image:       selectionAlertAssets.neutral,
    autoCloseMs: 2000,
    endsTurn:    true,
    buttonLabel: 'CONTINUAR',
    a11yMessage: 'Encontraron una palabra sin equipo. El turno termina.',
  },
  cursed: {
    image:       selectionAlertAssets.cursed,
    autoCloseMs: null,          // siempre requiere confirmación
    endsTurn:    true,
    buttonLabel: 'VER RESULTADO',
    a11yMessage: 'Pronunciaron la Palabra Maldita. La partida ha terminado.',
  },
};

/**
 * Determina qué tipo de alerta mostrar según el equipo activo y el dueño real de la carta.
 */
export function getSelectionAlertType(
  activeTeam: 'BLUE' | 'RED',
  cardOwner: 'BLUE' | 'RED' | 'NEUTRAL' | 'CURSED',
): SelectionAlertType {
  if (cardOwner === 'CURSED')  return 'cursed';
  if (cardOwner === 'NEUTRAL') return 'neutral';

  if (activeTeam === 'BLUE' && cardOwner === 'BLUE') return 'correct_blue';
  if (activeTeam === 'RED'  && cardOwner === 'RED')  return 'correct_red';
  if (activeTeam === 'BLUE' && cardOwner === 'RED')  return 'blue_helped_red';
  return 'red_helped_blue';
}
