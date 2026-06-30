import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { CREATE_MATCH_COLORS } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';

interface Props {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

function StartGameButtonBase({ disabled, loading, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (disabled || loading) {
      pulse.value = withTiming(1, { duration: 120 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.012, { duration: 850 }),
        withTiming(1, { duration: 850 }),
      ),
      -1,
      true,
    );
  }, [disabled, loading, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  function handlePress() {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel="Iniciar partida"
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.touch}
    >
      <Animated.View style={[styles.wrap, animatedStyle]}>
        <ImageBackground
          source={
            disabled
              ? createMatchAssets.primaryButton.disabled
              : pressed
                ? createMatchAssets.primaryButton.pressed
                : createMatchAssets.primaryButton.active
          }
          resizeMode="stretch"
          style={styles.bg}
          imageStyle={styles.bgImage}
        >
          {loading ? (
            <ActivityIndicator color={CREATE_MATCH_COLORS.goldLight} />
          ) : (
            <Text style={[createMatchStyles.title, styles.text]}>INICIAR PARTIDA</Text>
          )}
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

export const StartGameButton = memo(StartGameButtonBase);

const styles = StyleSheet.create({
  touch: {
    width: '100%',
    minHeight: 74,
  },
  wrap: {
    minHeight: 74,
  },
  bg: {
    width: '100%',
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: 24,
    letterSpacing: 2.2,
    color: CREATE_MATCH_COLORS.goldLight,
  },
});
