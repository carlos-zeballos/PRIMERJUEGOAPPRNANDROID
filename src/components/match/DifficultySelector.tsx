import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Difficulty } from '../../types/match.types';

interface Option {
  key: Difficulty;
  label: string;
  color: string;
  icon: string;
}

const OPTIONS: Option[] = [
  { key: 'facil',     label: 'FÁCIL',     color: '#4ECDC4', icon: '☽' },
  { key: 'media',     label: 'MEDIA',     color: '#C4963A', icon: '◈' },
  { key: 'dificil',   label: 'DIFÍCIL',   color: '#E07843', icon: '⟁' },
  { key: 'pesadilla', label: 'PESADILLA', color: '#C44040', icon: '✦' },
];

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultySelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map((opt) => (
        <DifficultyOption
          key={opt.key}
          option={opt}
          selected={value === opt.key}
          onPress={() => onChange(opt.key)}
        />
      ))}
    </View>
  );
}

function DifficultyOption({
  option,
  selected,
  onPress,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(selected ? 0.5 : 0.12);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 220 });

    if (selected && !reducedMotion) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 900 }),
          withTiming(0.35, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(selected ? 0.65 : 0.12, { duration: 200 });
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
    };
  }, [selected, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.optionWrapper}
      accessibilityRole="radio"
      accessibilityLabel={`Dificultad ${option.label}`}
      accessibilityState={{ checked: selected }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          styles.option,
          selected && { borderColor: option.color, borderWidth: 1.5, backgroundColor: 'rgba(196,150,58,0.12)' },
          containerStyle,
        ]}
      >
        {/* Pulsing glow border */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.glowBorder,
            { borderColor: option.color },
            glowStyle,
          ]}
        />

        <Text style={[styles.icon, { color: selected ? option.color : 'rgba(200,192,212,0.5)' }]}>
          {option.icon}
        </Text>
        <Text style={[styles.label, selected && { color: option.color }]}>
          {option.label}
        </Text>

        {selected && (
          <View style={[styles.strip, { backgroundColor: option.color }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionWrapper: {
    width: '48%',
  },
  option: {
    // Semi-transparent so the bg image shows through
    backgroundColor: 'rgba(7,6,14,0.68)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,150,58,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    minHeight: 54,
  },
  glowBorder: {
    borderRadius: 10,
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(200,192,212,0.65)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    opacity: 0.9,
  },
});
