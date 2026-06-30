/**
 * createMatch.layout.ts
 *
 * Artboard base: 1080 × 1920 px (9:16)
 * Imagen base nativa: 941 × 1672 px (misma proporción ≈ 9:16)
 * Origen (0,0): esquina superior izquierda del artboard.
 *
 * HOTSPOTS     → área táctil (puede ser más grande que el visual)
 * SELECTION_RECTS → área visual del glow (coincide con el elemento visible)
 */

export { ARTBOARD_W, ARTBOARD_H, BASE_IMAGE_W, BASE_IMAGE_H } from './createMatch.utils';

export type ArtboardRect = { x: number; y: number; w: number; h: number };

export type HotspotKey =
  | 'difficultyEasy' | 'difficultyMedium' | 'difficultyHard' | 'difficultyNightmare'
  | 'mediumNoLimit' | 'medium30' | 'medium60' | 'medium90'
  | 'interpretersNoLimit' | 'interpreters30' | 'interpreters60' | 'interpreters90'
  | 'teamBlue' | 'teamRed' | 'teamRandom'
  | 'start' | 'back' | 'settings';

// ─── HOTSPOTS — coordenadas táctiles (UI Handoff v1.0) ───────────────────────
export const HOTSPOTS: Record<HotspotKey, ArtboardRect> = {
  difficultyEasy:       { x: 440, y: 245,  w: 110, h: 145 },
  difficultyMedium:     { x: 575, y: 245,  w: 110, h: 145 },
  difficultyHard:       { x: 710, y: 245,  w: 110, h: 145 },
  difficultyNightmare:  { x: 845, y: 245,  w: 150, h: 145 },

  mediumNoLimit:        { x: 300, y: 920,  w: 125, h: 80 },
  medium30:             { x: 435, y: 920,  w: 125, h: 80 },
  medium60:             { x: 570, y: 920,  w: 125, h: 80 },
  medium90:             { x: 705, y: 920,  w: 125, h: 80 },

  interpretersNoLimit:  { x: 300, y: 1195, w: 125, h: 80 },
  interpreters30:       { x: 435, y: 1195, w: 125, h: 80 },
  interpreters60:       { x: 570, y: 1195, w: 125, h: 80 },
  interpreters90:       { x: 705, y: 1195, w: 125, h: 80 },

  teamBlue:             { x: 265, y: 1460, w: 175, h: 230 },
  teamRed:              { x: 455, y: 1450, w: 175, h: 240 },
  teamRandom:           { x: 645, y: 1460, w: 185, h: 230 },

  start:                { x: 220, y: 1740, w: 640, h: 145 },
  back:                 { x: 30,  y: 1760, w: 120, h: 120 },
  settings:             { x: 930, y: 1760, w: 120, h: 120 },
};

// ─── SELECTION_RECTS — área visual exacta del glow ───────────────────────────
//
// Regla general: igual al HOTSPOT (las coordenadas del handoff YA fueron
// calibradas contra los elementos visuales de la imagen).
//
// Excepción — Dificultad: cuadrado 110×110 centrado en el hotspot.
//   El hotspot h=145 incluye el label debajo del ícono.
//   Solo queremos el círculo → h=110 (mismo ancho que el hotspot = cuadrado)
//   → borderRadius:999 produce círculo perfecto sobre el medallón.
//   Nightmare: hotspot w=150, centramos el cuadrado: x=845+(150-110)/2=865.

// ─── SELECTION_RECTS ──────────────────────────────────────────────────────────
// Cada rect está INSET respecto al HOTSPOT para que el brillo quede dentro
// del área visual del botón sin desbordar sus límites.
//
// Insets aplicados:
//   Dificultad: 100×100 centrado horizontalmente, empieza en y del hotspot
//   Timer:      +5px H (lado), +8px V (arriba/abajo) → w-10, h-16
//   Team:       +5px H (lado), +6px V (arriba/abajo) → w-10, h-12
export const SELECTION_RECTS: Record<string, ArtboardRect> = {

  // Dificultad — 100×100 centrado sobre el medallón (sin label debajo)
  // center_x = hotspot.x + hotspot.w/2  → x = center - 50
  difficultyEasy:       { x: 445, y: 248, w: 100, h: 100 },
  difficultyMedium:     { x: 580, y: 248, w: 100, h: 100 },
  difficultyHard:       { x: 715, y: 248, w: 100, h: 100 },
  difficultyNightmare:  { x: 870, y: 248, w: 100, h: 100 },

  // Timer Medium — inset 5px H, 8px V
  mediumNoLimit:        { x: 305, y: 928, w: 115, h: 64 },
  medium30:             { x: 440, y: 928, w: 115, h: 64 },
  medium60:             { x: 575, y: 928, w: 115, h: 64 },
  medium90:             { x: 710, y: 928, w: 115, h: 64 },

  // Timer Intérpretes — mismos insets
  interpretersNoLimit:  { x: 305, y: 1203, w: 115, h: 64 },
  interpreters30:       { x: 440, y: 1203, w: 115, h: 64 },
  interpreters60:       { x: 575, y: 1203, w: 115, h: 64 },
  interpreters90:       { x: 710, y: 1203, w: 115, h: 64 },

  // Team cards — inset 5px H, 6px V
  teamBlue:             { x: 270, y: 1466, w: 165, h: 218 },
  teamRed:              { x: 460, y: 1456, w: 165, h: 228 },
  teamRandom:           { x: 650, y: 1466, w: 175, h: 218 },
};
