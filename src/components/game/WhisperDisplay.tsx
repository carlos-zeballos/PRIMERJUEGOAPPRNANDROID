import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Whisper } from '../../types/game.types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { WHISPER_CHAR_DELAY_MS } from '../../constants/gameConfig';

interface Props {
  whisper: Whisper | undefined;
  attemptsLeft: number;
  maxAttempts: number;
}

export function WhisperDisplay({ whisper, attemptsLeft, maxAttempts }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const glowAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!whisper) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    let charIndex = 0;
    const word = whisper.word;

    intervalRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(word.slice(0, charIndex));
      if (charIndex >= word.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        startGlow();
      }
    }, WHISPER_CHAR_DELAY_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [whisper?.id]);

  function startGlow() {
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
    ]).start();
  }

  if (!whisper) return null;

  const numberDisplay =
    whisper.number === 'INFINITE' ? '∞' : String(whisper.number);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowLayer, { opacity: glowOpacity }]} />
      <Text style={styles.whisperText}>{displayedText}</Text>
      <Text style={styles.numberText}>{numberDisplay}</Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: maxAttempts }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < attemptsLeft ? styles.dotActive : styles.dotUsed]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gold,
    opacity: 0,
    borderRadius: 8,
  },
  whisperText: {
    ...TYPOGRAPHY.display,
    fontSize: 34,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  numberText: {
    ...TYPOGRAPHY.displayRegular,
    fontSize: 22,
    color: COLORS.gold,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: COLORS.gold,
  },
  dotUsed: {
    backgroundColor: COLORS.ash,
  },
});
