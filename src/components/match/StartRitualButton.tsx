import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function StartRitualButton({ onPress, loading, disabled }: Props) {
  const flashOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  function handlePress() {
    if (loading || disabled) return;

    flashOpacity.value = withSequence(
      withTiming(0.55, { duration: 80 }),
      withTiming(0, { duration: 380 }),
    );
    scale.value = withSequence(
      withTiming(0.97, { duration: 70 }),
      withTiming(1, { duration: 180 }),
    );

    onPress();
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel="Comenzar el ritual"
      accessibilityState={{ disabled: loading || disabled }}
      hitSlop={4}
    >
      <Animated.View style={[styles.button, (loading || disabled) && styles.buttonDisabled, containerStyle]}>
        {/* Flash overlay */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />

        {/* Corner accents */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {loading ? (
          <ActivityIndicator color="#C4963A" size="small" />
        ) : (
          <>
            <Text style={styles.label}>COMENZAR EL RITUAL</Text>
            <Text style={styles.sublabel}>✦</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(8,6,16,0.85)',
    borderWidth: 1.5,
    borderColor: '#C4963A',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    minHeight: 60,
  },
  buttonDisabled: {
    borderColor: 'rgba(196,150,58,0.3)',
  },
  flash: {
    backgroundColor: '#E2B85A',
    borderRadius: 10,
  },
  label: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    letterSpacing: 4,
    color: '#E2B85A',
    textTransform: 'uppercase',
  },
  sublabel: {
    fontSize: 10,
    color: 'rgba(196,150,58,0.5)',
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: 'rgba(196,150,58,0.6)',
    borderWidth: 1,
  },
  cornerTL: { top: 6,    left: 6,    borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 3 },
  cornerTR: { top: 6,    right: 6,   borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 3 },
  cornerBL: { bottom: 6, left: 6,    borderRightWidth: 0, borderTopWidth: 0,    borderBottomLeftRadius: 3 },
  cornerBR: { bottom: 6, right: 6,   borderLeftWidth: 0,  borderTopWidth: 0,    borderBottomRightRadius: 3 },
});
