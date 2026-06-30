import { GRID_SIZE } from './gameConfig';

export type BoardLayoutMetrics = {
  boardWidth:  number;
  boardHeight: number;
  innerLeft:   number;
  innerTop:    number;
  gridWidth:   number;
  gridHeight:  number;
  gap:         number;
  cardSize:    number;
};

/**
 * Calcula las métricas del tablero a partir del ancho de pantalla.
 *
 * El marco board_frame_main_empty_1254.png tiene bordes decorativos de
 * aproximadamente 13.5 % H y 14.5 % V del total del asset (cuadrado).
 * Las cartas deben quedar dentro del área oscura central.
 */
export function getBoardLayoutMetrics(screenWidth: number): BoardLayoutMetrics {
  const horizontalSafePadding = 12;
  const isTablet   = screenWidth >= 768;
  const maxBoard   = isTablet ? 600 : 430;
  const boardWidth = Math.min(screenWidth - horizontalSafePadding * 2, maxBoard);
  const boardHeight = boardWidth; // el asset es cuadrado (1254×1254)

  // Padding proporcional al tamaño del marco para dejar las cartas en el área útil
  const padH = boardWidth  * 0.135; // ≈ columnas decorativas laterales
  const padV = boardHeight * 0.145; // ≈ ornamentos superiores/inferiores

  const availableW = boardWidth  - padH * 2;
  const availableH = boardHeight - padV * 2;

  const gap      = Math.min(Math.max(boardWidth * 0.015, 3), 7);
  const cardSize = Math.min(
    (availableW - gap * (GRID_SIZE - 1)) / GRID_SIZE,
    (availableH - gap * (GRID_SIZE - 1)) / GRID_SIZE,
  );

  const gridWidth  = cardSize * GRID_SIZE + gap * (GRID_SIZE - 1);
  const gridHeight = gridWidth;

  // Centrar el grid dentro del área disponible
  const innerLeft = padH + (availableW - gridWidth)  / 2;
  const innerTop  = padV + (availableH - gridHeight) / 2;

  return { boardWidth, boardHeight, innerLeft, innerTop, gridWidth, gridHeight, gap, cardSize };
}

/**
 * Tamaño de fuente base para la palabra de una carta.
 * Se combina con adjustsFontSizeToFit para manejo automático de overflow.
 *
 * Los valores están calibrados para que palabras cortas sean grandes y legibles,
 * y palabras largas se reduzcan gradualmente antes de que adjustsFontSizeToFit actúe.
 */
export function getBoardWordFontSize(word: string, cardSize: number): number {
  const len = word.trim().length;

  let base: number;
  if      (len <= 5)  base = cardSize * 0.22;
  else if (len <= 8)  base = cardSize * 0.19;
  else if (len <= 11) base = cardSize * 0.16;
  else if (len <= 14) base = cardSize * 0.135;
  else                base = cardSize * 0.11;

  // Clamp: nunca menor a 7 pt ni mayor a 18 pt
  return Math.max(7, Math.min(base, 18));
}
