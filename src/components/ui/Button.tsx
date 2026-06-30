import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BORDER_RADIUS, COLORS, GRADIENTS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue' | 'red';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  size = 'md',
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        VARIANT_SHADOW[variant],
        isDisabled && styles.wrapperDisabled,
        { transform: [{ scale }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={styles.pressable}
        android_ripple={null}
      >
        <ButtonInner variant={variant} size={size} loading={!!loading} label={label} disabled={!!isDisabled} />
      </Pressable>
    </Animated.View>
  );
}

function ButtonInner({
  variant,
  size,
  loading,
  label,
  disabled,
}: {
  variant: ButtonVariant;
  size: 'sm' | 'md' | 'lg';
  loading: boolean;
  label: string;
  disabled: boolean;
}) {
  const height = SIZE_HEIGHT[size];
  const textStyle = [styles.label, SIZE_LABEL[size], VARIANT_TEXT[variant], disabled && styles.labelDisabled];

  if (variant === 'primary') {
    return (
      <LinearGradient
        colors={GRADIENTS.primaryBtn}
        style={[styles.inner, { height }, styles.borderGold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Top shine line */}
        <View style={styles.shineTop} />
        {loading ? (
          <ActivityIndicator color={COLORS.goldGlow} size="small" />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </LinearGradient>
    );
  }

  if (variant === 'danger') {
    return (
      <LinearGradient
        colors={GRADIENTS.dangerBtn}
        style={[styles.inner, { height }, styles.borderRed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.shineDanger} />
        {loading ? (
          <ActivityIndicator color={COLORS.redGlow} size="small" />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </LinearGradient>
    );
  }

  if (variant === 'blue') {
    return (
      <View style={[styles.inner, { height }, styles.borderBlue, styles.bgBlue]}>
        {loading ? (
          <ActivityIndicator color={COLORS.blueGlow} size="small" />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </View>
    );
  }

  if (variant === 'red') {
    return (
      <View style={[styles.inner, { height }, styles.borderRedTeam, styles.bgRed]}>
        {loading ? (
          <ActivityIndicator color={COLORS.redGlow} size="small" />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </View>
    );
  }

  if (variant === 'secondary') {
    return (
      <View style={[styles.inner, { height }, styles.secondary]}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="small" />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </View>
    );
  }

  // ghost
  return (
    <View style={[styles.inner, { height }, styles.ghost]}>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="small" />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </View>
  );
}

const SIZE_HEIGHT = { sm: 40, md: 52, lg: 60 } as const;

const SIZE_LABEL = StyleSheet.create({
  sm: { fontSize: 11, letterSpacing: 2 },
  md: { fontSize: 13, letterSpacing: 2.5 },
  lg: { fontSize: 15, letterSpacing: 3 },
});

const VARIANT_TEXT = StyleSheet.create({
  primary:   { color: COLORS.goldGlow },
  secondary: { color: COLORS.gold },
  ghost:     { color: COLORS.textSecondary },
  danger:    { color: COLORS.redGlow },
  blue:      { color: COLORS.blueGlow },
  red:       { color: COLORS.redGlow },
});

const VARIANT_SHADOW: Record<ButtonVariant, object> = {
  primary:   SHADOWS.goldSubtle,
  secondary: {},
  ghost:     {},
  danger:    {},
  blue:      SHADOWS.blueGlow,
  red:       SHADOWS.redGlow,
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  wrapperDisabled: {
    opacity: 0.35,
  },
  pressable: {
    width: '100%',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },

  // Border variants
  borderGold: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  borderRed: {
    borderWidth: 1,
    borderColor: COLORS.cursedRed,
  },
  borderRedTeam: {
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  borderBlue: {
    borderWidth: 1,
    borderColor: COLORS.blue,
  },

  // Background variants (solid)
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.strokeSubtle,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  bgBlue: {
    backgroundColor: COLORS.blueDeep,
  },
  bgRed: {
    backgroundColor: COLORS.redDeep,
  },

  // Shine lines
  shineTop: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,220,100,0.35)',
    borderRadius: 1,
  },
  shineDanger: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,120,120,0.25)',
    borderRadius: 1,
  },

  // Label
  label: {
    ...TYPOGRAPHY.label,
    textTransform: 'uppercase',
  },
  labelDisabled: {
    color: COLORS.textDisabled,
  },
});
