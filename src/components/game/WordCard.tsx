import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BoardCell, TeamColor } from '../../types/game.types';
import { BORDER_RADIUS, COLORS, GRADIENTS, PALETTE, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { DOUBLE_TAP_WINDOW_MS } from '../../constants/gameConfig';

interface Props {
  cell: BoardCell;
  activeTeam: TeamColor;
  onSelect: (position: number) => void;
  disabled: boolean;
}

type CardConfig = {
  gradient: readonly [string, string];
  border: string;
  borderWidth: number;
  textColor: string;
  glowColor?: string;
};

function getCardConfig(cell: BoardCell, isPending: boolean): CardConfig {
  if (isPending) {
    return {
      gradient:    GRADIENTS.cardHidden,
      border:      COLORS.gold,
      borderWidth: 2,
      textColor:   COLORS.goldGlow,
    };
  }

  if (cell.state === 'HIDDEN') {
    return {
      gradient:    GRADIENTS.cardHidden,
      border:      PALETTE.stone600,
      borderWidth: 1,
      textColor:   '#B8B0CC',
    };
  }

  switch (cell.owner) {
    case 'BLUE':
      return {
        gradient:   GRADIENTS.cardBlue,
        border:     COLORS.blue,
        borderWidth: 1,
        textColor:  COLORS.blueGlow,
        glowColor:  COLORS.blue,
      };
    case 'RED':
      return {
        gradient:   GRADIENTS.cardRed,
        border:     COLORS.red,
        borderWidth: 1,
        textColor:  COLORS.redGlow,
        glowColor:  COLORS.red,
      };
    case 'NEUTRAL':
      return {
        gradient:   GRADIENTS.cardNeutral,
        border:     PALETTE.stone500,
        borderWidth: 1,
        textColor:  COLORS.textMuted,
      };
    case 'CURSED':
      return {
        gradient:   GRADIENTS.cardCursed,
        border:     COLORS.cursedRed,
        borderWidth: 1,
        textColor:  COLORS.cursedRed,
        glowColor:  COLORS.cursedGlow,
      };
  }
}

export function WordCard({ cell, activeTeam, onSelect, disabled }: Props) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    if (disabled || cell.state === 'REVEALED') return;

    const now          = Date.now();
    const timeSinceLast = now - lastTapRef.current;

    if (timeSinceLast < DOUBLE_TAP_WINDOW_MS && pendingRef.current) {
      // Double tap → confirm
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
      lastTapRef.current = 0;

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.90, duration: 70, useNativeDriver: true }),
        Animated.spring(scaleAnim,  { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 8 }),
      ]).start();

      onSelect(cell.position);
    } else {
      // First tap → pending highlight
      lastTapRef.current = now;

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 60, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.98, duration: 80, useNativeDriver: true }),
      ]).start();

      Animated.timing(glowAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();

      pendingRef.current = setTimeout(() => {
        Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }).start();
        Animated.timing(glowAnim,  { toValue: 0,    duration: 200, useNativeDriver: false }).start();
        pendingRef.current  = null;
        lastTapRef.current  = 0;
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [disabled, cell, onSelect, scaleAnim, glowAnim]);

  const isPending =
    lastTapRef.current > 0 &&
    Date.now() - lastTapRef.current < DOUBLE_TAP_WINDOW_MS;

  const cfg = getCardConfig(cell, isPending);
  const isRevealed = cell.state === 'REVEALED';

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        cfg.glowColor && isRevealed && {
          shadowColor:   cfg.glowColor,
          shadowOpacity: 0.4,
          shadowRadius:  8,
          shadowOffset:  { width: 0, height: 0 },
          elevation:     6,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled || isRevealed}
        android_ripple={null}
        style={styles.pressable}
      >
        <LinearGradient
          colors={cfg.gradient}
          style={[
            styles.card,
            {
              borderColor: cfg.border,
              borderWidth: cfg.borderWidth,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Shine top edge — only on hidden cards */}
          {cell.state === 'HIDDEN' && !isPending && (
            <View style={styles.shineEdge} />
          )}

          {/* Pending gold overlay */}
          {isPending && (
            <View style={styles.pendingOverlay} />
          )}

          <Text
            style={[styles.word, { color: cfg.textColor }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {cell.word}
          </Text>

          {/* Cursed revealed marker */}
          {cell.owner === 'CURSED' && isRevealed && (
            <Text style={styles.cursedSymbol}>✦</Text>
          )}

          {/* Corner accent dots — hidden cards only */}
          {cell.state === 'HIDDEN' && <CornerAccents pending={isPending} />}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function CornerAccents({ pending }: { pending: boolean }) {
  const color = pending ? COLORS.gold : PALETTE.stone500;
  return (
    <>
      <View style={[styles.corner, styles.cornerTL, { borderTopColor: color, borderLeftColor: color }]} />
      <View style={[styles.corner, styles.cornerBR, { borderBottomColor: color, borderRightColor: color }]} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
  },
  pressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
    overflow: 'hidden',
  },

  shineEdge: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(180,160,220,0.12)',
    borderRadius: 1,
  },

  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },

  word: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  cursedSymbol: {
    fontSize: 10,
    color: COLORS.cursedGlow,
    marginTop: 2,
  },

  // Corner bracket accents
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderWidth: 1,
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 1,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 1,
  },
});
