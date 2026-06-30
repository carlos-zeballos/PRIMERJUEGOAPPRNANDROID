import React, { memo, useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { TimeOption } from '../../../types/match.types';
import { CREATE_MATCH_COLORS, getTimerLabel } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';

interface Props {
  value: TimeOption;
  selected: boolean;
  onPress: () => void;
}

function SegmentedOptionButtonBase({ value, selected, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 0.45 : 0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.04 : 1, { damping: 15, stiffness: 260 });
    glow.value = withTiming(selected ? 0.45 : 0, { duration: 160 });
  }, [glow, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel={value === 0 ? 'Seleccionar sin limite de tiempo' : `Seleccionar ${value} segundos`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.touch}
    >
      <Animated.View style={[styles.wrap, animatedStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <ImageBackground
          source={
            pressed
              ? createMatchAssets.segmentedOptions.pressed
              : selected
                ? createMatchAssets.segmentedOptions.active
                : createMatchAssets.segmentedOptions.inactive
          }
          resizeMode="stretch"
          style={styles.bg}
        >
          <Text style={[createMatchStyles.functionalText, styles.text, selected && styles.textSelected]}>
            {getTimerLabel(value)}
          </Text>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

export const SegmentedOptionButton = memo(SegmentedOptionButtonBase);

const styles = StyleSheet.create({
  touch: {
    flex: 1,
    minHeight: 46,
  },
  wrap: {
    flex: 1,
    minHeight: 46,
  },
  bg: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  glow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 7,
    bottom: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(241,210,138,0.18)',
  },
  text: {
    fontSize: 14,
    color: '#2B1A0E',
  },
  textSelected: {
    color: CREATE_MATCH_COLORS.goldLight,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
