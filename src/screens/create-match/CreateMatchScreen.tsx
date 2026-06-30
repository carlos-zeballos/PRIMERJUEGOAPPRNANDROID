/**
 * CreateMatchScreen
 *
 * Imagen base + hotspots transparentes + brillo shape-aware.
 *
 * Capas en el artboard:
 *   0. Imagen base neutral
 *   1. Glows de selección (pointerEvents="none", forma y color contextual)
 *   2. Pressables transparentes (solo táctiles)
 *
 * Glows:
 *   · Dificultad  → círculo dorado       (borderRadius:999, SELECTION_RECTS icon-only)
 *   · Timer slots → rectángulo suave     (borderRadius:4,   inset del pergamino)
 *   · Equipo Azul → rectángulo azul      (borderRadius:8)
 *   · Equipo Rojo → rectángulo rojo      (borderRadius:8)
 *   · Equipo Alea → rectángulo ámbar     (borderRadius:8)
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  LayoutChangeEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Modal } from '../../components/ui/Modal';
import { useAudioTrack } from '../../hooks/useAudioTrack';
import { useGameStore } from '../../store/gameStore';
import { GameConfig, TeamColor, WordDifficulty } from '../../types/game.types';
import { Difficulty, StartingTeam, TimeOption } from '../../types/match.types';
import { CREATE_MATCH_DEFAULTS } from './constants/createMatch.constants';
import { CreateMatchState } from './types/createMatch.types';
import { HOTSPOTS, SELECTION_RECTS } from './createMatch.layout';
import {
  getRenderedImageRect,
  mapToLocalArtboard,
  BASE_IMAGE_W,
  BASE_IMAGE_H,
  ArtboardRect,
} from './createMatch.utils';

const BASE_IMAGE = require('../../../assets/screens/create-match/create_match_base.png'); // eslint-disable-line
const FONDO      = require('../../../assets/images/fondo.png'); // eslint-disable-line

const DEBUG_HOTSPOTS   = false;
const DEBUG_IMAGE_RECT = false;

// ─── Game logic (sin cambios) ─────────────────────────────────────────────────

const DIFFICULTY_MAP: Record<Difficulty, WordDifficulty> = {
  facil: 'EASY', media: 'MEDIUM', dificil: 'HARD', pesadilla: 'INFERNAL',
};

function resolveStartingTeam(t: StartingTeam): TeamColor {
  if (t === 'blue') return 'BLUE';
  if (t === 'red')  return 'RED';
  return Math.random() < 0.5 ? 'BLUE' : 'RED';
}

function toGameConfig(st: CreateMatchState): GameConfig {
  return {
    difficulty:             DIFFICULTY_MAP[st.difficulty],
    mediumTimeSeconds:      st.mediumTimer       === 0 ? null : st.mediumTimer,
    interpreterTimeSeconds: st.interpretersTimer === 0 ? null : st.interpretersTimer,
    firstTeam:              resolveStartingTeam(st.startingTeam),
    soundEnabled:   true,
    hapticsEnabled: true,
  };
}

// ─── Hotspot + selección maps ─────────────────────────────────────────────────

const DIFF_ENTRIES: Array<{
  value: Difficulty;
  hotspot: ArtboardRect;
  selRect: ArtboardRect;
  testID: string;
  label: string;
}> = [
  { value: 'facil',     hotspot: HOTSPOTS.difficultyEasy,      selRect: SELECTION_RECTS.difficultyEasy,      testID: 'diff-easy',      label: 'Fácil'     },
  { value: 'media',     hotspot: HOTSPOTS.difficultyMedium,    selRect: SELECTION_RECTS.difficultyMedium,    testID: 'diff-medium',    label: 'Media'     },
  { value: 'dificil',   hotspot: HOTSPOTS.difficultyHard,      selRect: SELECTION_RECTS.difficultyHard,      testID: 'diff-hard',      label: 'Difícil'   },
  { value: 'pesadilla', hotspot: HOTSPOTS.difficultyNightmare, selRect: SELECTION_RECTS.difficultyNightmare, testID: 'diff-nightmare', label: 'Pesadilla' },
];

const MEDIUM_ENTRIES: Array<{
  value: TimeOption;
  hotspot: ArtboardRect;
  selRect: ArtboardRect;
  testID: string;
  label: string;
}> = [
  { value: 0,  hotspot: HOTSPOTS.mediumNoLimit, selRect: SELECTION_RECTS.mediumNoLimit, testID: 'med-0',  label: 'Sin límite' },
  { value: 30, hotspot: HOTSPOTS.medium30,      selRect: SELECTION_RECTS.medium30,      testID: 'med-30', label: '30 segundos' },
  { value: 60, hotspot: HOTSPOTS.medium60,      selRect: SELECTION_RECTS.medium60,      testID: 'med-60', label: '60 segundos' },
  { value: 90, hotspot: HOTSPOTS.medium90,      selRect: SELECTION_RECTS.medium90,      testID: 'med-90', label: '90 segundos' },
];

const INTERP_ENTRIES: Array<{
  value: TimeOption;
  hotspot: ArtboardRect;
  selRect: ArtboardRect;
  testID: string;
  label: string;
}> = [
  { value: 0,  hotspot: HOTSPOTS.interpretersNoLimit, selRect: SELECTION_RECTS.interpretersNoLimit, testID: 'int-0',  label: 'Sin límite' },
  { value: 30, hotspot: HOTSPOTS.interpreters30,      selRect: SELECTION_RECTS.interpreters30,      testID: 'int-30', label: '30 segundos' },
  { value: 60, hotspot: HOTSPOTS.interpreters60,      selRect: SELECTION_RECTS.interpreters60,      testID: 'int-60', label: '60 segundos' },
  { value: 90, hotspot: HOTSPOTS.interpreters90,      selRect: SELECTION_RECTS.interpreters90,      testID: 'int-90', label: '90 segundos' },
];

const TEAM_GLOW: Record<StartingTeam, { borderRadius: number; backgroundColor: string }> = {
  blue:   { borderRadius: 8, backgroundColor: 'rgba(50, 130, 255, 0.22)'  },
  red:    { borderRadius: 8, backgroundColor: 'rgba(210, 45,  45,  0.22)' },
  random: { borderRadius: 8, backgroundColor: 'rgba(200, 160, 50,  0.22)' },
};

const TEAM_ENTRIES: Array<{
  value: StartingTeam;
  hotspot: ArtboardRect;
  selRect: ArtboardRect;
  testID: string;
  label: string;
}> = [
  { value: 'blue',   hotspot: HOTSPOTS.teamBlue,   selRect: SELECTION_RECTS.teamBlue,   testID: 'team-blue',   label: 'Azul'      },
  { value: 'red',    hotspot: HOTSPOTS.teamRed,     selRect: SELECTION_RECTS.teamRed,    testID: 'team-red',    label: 'Rojo'      },
  { value: 'random', hotspot: HOTSPOTS.teamRandom,  selRect: SELECTION_RECTS.teamRandom, testID: 'team-random', label: 'Aleatorio' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CreateMatchScreen() {
  const { initGame, isLoading } = useGameStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [state, setState] = useState<CreateMatchState>({
    difficulty:        CREATE_MATCH_DEFAULTS.difficulty,
    mediumTimer:       CREATE_MATCH_DEFAULTS.mediumTimer,
    interpretersTimer: CREATE_MATCH_DEFAULTS.interpretersTimer,
    startingTeam:      CREATE_MATCH_DEFAULTS.startingTeam,
  });
  const [container, setContainer] = useState({ width: 0, height: 0 });

  useAudioTrack('PRINCIPAL');

  function update<K extends keyof CreateMatchState>(key: K, value: CreateMatchState[K]) {
    Haptics.selectionAsync().catch(() => {});
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await initGame(toGameConfig(state));
    if (useGameStore.getState().session) router.push('/(game)/medium-view');
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainer((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }

  const imageRect = getRenderedImageRect({
    containerWidth:  container.width,
    containerHeight: container.height,
    imageWidth:  BASE_IMAGE_W,
    imageHeight: BASE_IMAGE_H,
    resizeMode: 'contain',
  });

  const artboardReady = container.width > 0 && container.height > 0;

  function mp(rect: ArtboardRect) {
    return mapToLocalArtboard(rect, imageRect.width, imageRect.height);
  }

  return (
    <ImageBackground source={FONDO} style={s.root} resizeMode="cover" onLayout={handleLayout} testID="create-match-root">
      <StatusBar hidden />

      {artboardReady && (
        <View
          style={[
            s.artboard,
            {
              left: imageRect.x, top: imageRect.y,
              width: imageRect.width, height: imageRect.height,
              borderWidth: DEBUG_IMAGE_RECT ? 2 : 0,
              borderColor: DEBUG_IMAGE_RECT ? '#00ff70' : 'transparent',
            },
          ]}
        >
          {/* ── Imagen base ── */}
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <Image source={BASE_IMAGE} style={s.stretch} resizeMode="stretch" />
          </View>

          {/* ══════════════════════════════════════════════════════════════
              GLOWS DE SELECCIÓN  — shape-aware, pointerEvents="none"
              Renderizan en SELECTION_RECTS (área visual exacta),
              no en el hotspot táctil completo.
             ══════════════════════════════════════════════════════════════ */}

          {/* Dificultad — círculo dorado (borderRadius:999) */}
          {DIFF_ENTRIES.map(({ value, selRect, testID }) =>
            state.difficulty === value ? (
              <View
                key={`glow-${testID}`}
                pointerEvents="none"
                style={[mp(selRect), g.diffCircle]}
              />
            ) : null,
          )}

          {/* Timer Medium — slot suave (borderRadius:4) */}
          {MEDIUM_ENTRIES.map(({ value, selRect, testID }) =>
            state.mediumTimer === value ? (
              <View
                key={`glow-${testID}`}
                pointerEvents="none"
                style={[mp(selRect), g.timerSlot]}
              />
            ) : null,
          )}

          {/* Timer Intérpretes — slot suave */}
          {INTERP_ENTRIES.map(({ value, selRect, testID }) =>
            state.interpretersTimer === value ? (
              <View
                key={`glow-${testID}`}
                pointerEvents="none"
                style={[mp(selRect), g.timerSlot]}
              />
            ) : null,
          )}

          {/* Equipo — color de equipo (borderRadius:8) */}
          {TEAM_ENTRIES.map(({ value, selRect, testID }) =>
            state.startingTeam === value ? (
              <View
                key={`glow-${testID}`}
                pointerEvents="none"
                style={[mp(selRect), TEAM_GLOW[value]]}
              />
            ) : null,
          )}

          {/* ══════════════════════════════════════════════════════════════
              PRESSABLES TRANSPARENTES — solo táctiles, sin visual
             ══════════════════════════════════════════════════════════════ */}

          {/* Dificultad */}
          {DIFF_ENTRIES.map(({ value, hotspot, testID, label }) => (
            <Pressable
              key={testID}
              testID={testID}
              accessibilityLabel={`Dificultad ${label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: state.difficulty === value }}
              hitSlop={8}
              onPress={() => update('difficulty', value)}
              style={({ pressed }) => [mp(hotspot), pressed && s.pressed]}
            >
              {DEBUG_HOTSPOTS && <View style={s.dbg} />}
            </Pressable>
          ))}

          {/* Timer Medium */}
          {MEDIUM_ENTRIES.map(({ value, hotspot, testID, label }) => (
            <Pressable
              key={testID}
              testID={testID}
              accessibilityLabel={`Medium ${label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: state.mediumTimer === value }}
              hitSlop={8}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); update('mediumTimer', value); }}
              style={({ pressed }) => [mp(hotspot), pressed && s.pressed]}
            >
              {DEBUG_HOTSPOTS && <View style={s.dbg} />}
            </Pressable>
          ))}

          {/* Timer Intérpretes */}
          {INTERP_ENTRIES.map(({ value, hotspot, testID, label }) => (
            <Pressable
              key={testID}
              testID={testID}
              accessibilityLabel={`Intérpretes ${label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: state.interpretersTimer === value }}
              hitSlop={8}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); update('interpretersTimer', value); }}
              style={({ pressed }) => [mp(hotspot), pressed && s.pressed]}
            >
              {DEBUG_HOTSPOTS && <View style={s.dbg} />}
            </Pressable>
          ))}

          {/* Equipo */}
          {TEAM_ENTRIES.map(({ value, hotspot, testID, label }) => (
            <Pressable
              key={testID}
              testID={testID}
              accessibilityLabel={`Equipo ${label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: state.startingTeam === value }}
              hitSlop={6}
              onPress={() => update('startingTeam', value)}
              style={({ pressed }) => [mp(hotspot), pressed && s.pressed]}
            >
              {DEBUG_HOTSPOTS && <View style={s.dbg} />}
            </Pressable>
          ))}

          {/* Iniciar Partida */}
          <Pressable
            testID="btn-start"
            accessibilityLabel="Iniciar partida"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
            disabled={isLoading}
            hitSlop={4}
            onPress={handleStart}
            style={({ pressed }) => [mp(HOTSPOTS.start), pressed && s.pressed, isLoading && s.disabled]}
          >
            {isLoading && (
              <View style={s.startLoading}>
                <ActivityIndicator color="rgba(241,210,138,0.9)" size="small" />
              </View>
            )}
          </Pressable>

          {/* Volver */}
          <Pressable
            testID="btn-back"
            accessibilityLabel="Volver"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            style={({ pressed }) => [mp(HOTSPOTS.back), pressed && s.pressed]}
          />

          {/* Ajustes */}
          <Pressable
            testID="btn-settings"
            accessibilityLabel="Abrir ajustes"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setSettingsVisible(true)}
            style={({ pressed }) => [mp(HOTSPOTS.settings), pressed && s.pressed]}
          />
        </View>
      )}

      <Modal visible={settingsVisible} title="CONFIGURACION" onClose={() => setSettingsVisible(false)}>
        <View />
      </Modal>
    </ImageBackground>
  );
}

// ─── Glow styles (shape + color contextual) ───────────────────────────────────

// IMPORTANTE: estos estilos NO usan absoluteFillObject.
// El posicionamiento absoluto (position, left, top, width, height)
// viene de mp(selRect). absoluteFillObject sobreescribiría left/top con 0.
const g = StyleSheet.create({
  // Dificultad: círculo dorado suave
  diffCircle: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 210, 100, 0.26)',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 180, 60, 0.70)',
  },

  // Timer slots seleccionados:
  //   fondo oscuro → contrasta fuerte con el pergamino claro de los slots inactivos
  //   borde dorado brillante → delimita claramente el slot activo
  //   el resultado es el aspecto "activo/presionado" del slot
  timerSlot: {
    borderRadius: 5,
    backgroundColor: 'rgba(20, 11, 3, 0.72)',
    borderWidth: 2,
    borderColor: 'rgba(218, 178, 58, 0.96)',
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050507',
    overflow: 'hidden',
  },
  artboard: {
    position: 'absolute',
    overflow: 'hidden',
  },
  stretch: { width: '100%', height: '100%' },
  pressed:  { opacity: 0.70 },
  disabled: { opacity: 0.50 },
  startLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbg: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: '#00AAFF',
    backgroundColor: 'rgba(0,170,255,0.10)',
  },
});
