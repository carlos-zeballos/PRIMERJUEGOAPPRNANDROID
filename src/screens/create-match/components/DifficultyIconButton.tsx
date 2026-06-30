import React, { memo, useEffect } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CREATE_MATCH_COLORS } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';

interface Props {
  activeIcon: ImageSourcePropType;
  color: string;
  inactiveIcon: ImageSourcePropType;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function DifficultyIconButtonBase({ activeIcon, color, inactiveIcon, label, selected, onPress }: Props) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 0.62 : 0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.08 : 1, { damping: 14, stiffness: 240 });
    glow.value = withTiming(selected ? 0.62 : 0, { duration: 180 });
  }, [glow, scale, selected]);

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    scale.value = withSequence(
      withTiming(1.08, { duration: 90 }),
      withTiming(1, { duration: 90 }),
    );
    onPress();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Pressable
      accessibilityLabel={`Seleccionar dificultad ${label.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={8}
      onPress={handlePress}
      style={styles.touch}
    >
      <Animated.View style={[styles.option, animatedStyle]}>
        <Animated.View style={[styles.glow, { borderColor: color, shadowColor: color }, glowStyle]} />
        <Image source={selected ? activeIcon : inactiveIcon} resizeMode="contain" style={styles.icon} />
        <Text style={[createMatchStyles.secondaryLabel, styles.label, selected && { color }]}>
          {label}
        </Text>
        {selected ? <View style={[styles.selectedMark, { backgroundColor: color }]} /> : null}
      </Animated.View>
    </Pressable>
  );
}

export const DifficultyIconButton = memo(DifficultyIconButtonBase);

const styles = StyleSheet.create({
  touch: {
    flex: 1,
    minHeight: 78,
  },
  option: {
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    backgroundColor: 'rgba(200,169,107,0.08)',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  icon: {
    width: 48,
    height: 48,
  },
  label: {
    fontSize: 13,
    color: CREATE_MATCH_COLORS.textSecondary,
  },
  selectedMark: {
    width: 5,
    height: 5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
