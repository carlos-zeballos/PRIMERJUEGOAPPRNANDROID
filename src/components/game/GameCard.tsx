/**
 * GameCard — carta individual del tablero de Susurros.
 *
 * Usa los assets PNG reales:
 *   card_hidden_base_1254.png         — oculta / neutral sin asset propio
 *   card_team_blue_revealed_1254.png  — azul revelada
 *   card_team_red_revealed_1254.png   — roja revelada
 *   card_cursed_maldita_1254.png      — palabra maldita
 *
 * Todos los assets son cuadrados (1254×1254), se renderiza con resizeMode="stretch".
 * La carta neutral usa card_hidden + neutralOverlay gris hasta que exista su propio asset.
 *
 * Toda la lógica de juego y animaciones se conservan intactas.
 */

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getCardAsset } from '../../assets/boardAssets';
import { getBoardWordFontSize } from '../../constants/boardLayout';
import { COLORS } from '../../constants/theme';
import { BoardCell, CellOwner, TeamColor } from '../../types/game.types';

interface Props {
  cell:       BoardCell;
  activeTeam: TeamColor;
  cardSize:   number;
  disabled:   boolean;
  index:      number;
  pending:    boolean;
  revealAll?: boolean;
  onPress:    (position: number) => void;
}

// ─── Helpers puros ────────────────────────────────────────────────────────────

function getTextColor(owner: CellOwner, visibleOwner: boolean): string {
  if (!visibleOwner) return '#EFE8D8';      // oculta — crema cálido

  switch (owner) {
    case 'BLUE':    return '#D8F0FF';        // azul revelada — crema azulado
    case 'RED':     return '#FFE8E0';        // roja revelada — crema rosado
    case 'CURSED':  return '#F0D0E8';        // maldita — crema lila
    case 'NEUTRAL': return '#D4D0C8';        // neutral revelada — gris claro
  }
}

function getStateLabel(owner: CellOwner): string {
  switch (owner) {
    case 'BLUE':    return 'azul';
    case 'RED':     return 'roja';
    case 'NEUTRAL': return 'neutral';
    case 'CURSED':  return 'maldita';
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

function GameCardBase({
  cell, activeTeam, cardSize, disabled, index, pending, revealAll = false, onPress,
}: Props) {
  const previousState = useRef(cell.state);

  // Valores de animación (sin cambios respecto al original)
  const scale        = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const shakeX       = useSharedValue(0);

  const isRevealed  = cell.state === 'REVEALED';
  const visibleOwner = revealAll || isRevealed;
  const canPress     = !disabled && !isRevealed;

  // ── Animación al revelar ─────────────────────────────────────────────────
  useEffect(() => {
    if (previousState.current !== cell.state && cell.state === 'REVEALED') {
      scale.value = withSequence(
        withTiming(0.94, { duration: 1 }),
        withTiming(1,    { duration: 180, easing: Easing.out(Easing.cubic) }),
      );

      if (cell.owner === 'CURSED') {
        flashOpacity.value = withSequence(
          withTiming(0.45, { duration: 80 }),
          withTiming(0,    { duration: 220 }),
        );
        shakeX.value = withSequence(
          withTiming(-4, { duration: 40 }),
          withTiming( 4, { duration: 40 }),
          withTiming(-2, { duration: 40 }),
          withTiming( 0, { duration: 60 }),
        );
      } else if (cell.owner === 'BLUE' || cell.owner === 'RED') {
        flashOpacity.value = withSequence(
          withDelay(70, withTiming(0.28, { duration: 120 })),
          withTiming(0, { duration: 260 }),
        );
      }
    }
    previousState.current = cell.state;
  }, [cell.owner, cell.state, flashOpacity, scale, shakeX]);

  // ── Handler de pulsación ─────────────────────────────────────────────────
  const handlePress = useCallback(() => {
    if (!canPress) return;
    Haptics.selectionAsync().catch(() => {});
    scale.value = withSequence(
      withTiming(0.96, { duration: 70 }),
      withTiming(1,    { duration: 110 }),
    );
    onPress(cell.position);
  }, [canPress, cell.position, onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // ── Valores derivados ────────────────────────────────────────────────────
  const asset     = useMemo(() => getCardAsset(visibleOwner, cell.owner), [visibleOwner, cell.owner]);
  const textColor = useMemo(() => getTextColor(cell.owner, visibleOwner), [cell.owner, visibleOwner]);
  const fontSize  = useMemo(() => getBoardWordFontSize(cell.word, cardSize), [cell.word, cardSize]);

  const pendingColor = activeTeam === 'BLUE' ? COLORS.blueGlow : COLORS.redGlow;

  // Padding proporcional al tamaño de la carta para respetar el borde ornamental
  const padH = Math.max(3, Math.round(cardSize * 0.09));
  const padV = Math.max(2, Math.round(cardSize * 0.07));

  return (
    <Animated.View style={[styles.wrap, { width: cardSize, height: cardSize }, animatedStyle]}>
      <Pressable
        accessibilityLabel={
          isRevealed
            ? `${cell.word}, carta ${getStateLabel(cell.owner)} revelada`
            : `Carta ${index + 1}: ${cell.word}`
        }
        accessibilityHint={
          isRevealed ? 'Esta carta ya fue revelada' : 'Toca para seleccionar esta carta'
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPress, selected: pending }}
        disabled={!canPress}
        hitSlop={2}
        onPress={handlePress}
        style={styles.pressable}
      >
        <ImageBackground
          source={asset}
          resizeMode="stretch"
          style={[styles.card, { paddingHorizontal: padH, paddingVertical: padV }]}
          imageStyle={styles.image}
        >
          {/* Overlay gris: carta neutral revelada (sin asset propio todavía) */}
          {cell.owner === 'NEUTRAL' && visibleOwner && (
            <View style={styles.neutralOverlay} />
          )}

          {/* Overlay dorado: carta seleccionada pero pendiente de confirmar */}
          {pending && (
            <View style={[styles.pendingOverlay, { borderColor: pendingColor }]} />
          )}

          {/* Flash de revelado (animado) */}
          {isRevealed && (
            <Animated.View style={[styles.revealFlash, flashStyle]} />
          )}

          {/* Marcador visual tipo prohibido para palabras ya elegidas */}
          {isRevealed && (
            <View style={styles.usedBadge}>
              <View style={styles.prohibitedCircle}>
                <View style={styles.prohibitedSlash} />
              </View>
            </View>
          )}

          {/* Palabra dinámica */}
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.44}
            numberOfLines={1}
            allowFontScaling={false}
            style={[
              styles.word,
              {
                color:      textColor,
                fontSize,
                lineHeight: fontSize * 1.15,
              },
            ]}
          >
            {cell.word.toUpperCase()}
          </Text>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

export const GameCard = memo(GameCardBase);

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
  },

  pressable: {
    flex: 1,
  },

  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // paddingH/V se inyectan dinámicamente desde el componente (proporcional a cardSize)
  },

  image: {
    borderRadius: 4,
  },

  word: {
    width: '100%',
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor:  'rgba(0,0,0,0.90)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  neutralOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(70, 68, 80, 0.52)',
  },

  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,210,96,0.14)',
    borderWidth: 1,
  },

  revealFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  usedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prohibitedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(12,14,24,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prohibitedSlash: {
    width: 12,
    height: 2,
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '-45deg' }],
  },
});
