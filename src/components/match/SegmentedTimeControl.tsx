import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TimeOption } from '../../types/match.types';

const OPTIONS: TimeOption[] = [0, 30, 60, 90];

function getLabel(t: TimeOption) {
  return t === 0 ? '∞' : `${t}s`;
}

interface Props {
  label: string;
  value: TimeOption;
  onChange: (t: TimeOption) => void;
}

export function SegmentedTimeControl({ label, value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.labelLine} />
      </View>

      <View style={styles.track}>
        {OPTIONS.map((opt) => (
          <TimeSegment
            key={opt}
            option={opt}
            selected={value === opt}
            onPress={() => onChange(opt)}
          />
        ))}
      </View>
    </View>
  );
}

function TimeSegment({
  option,
  selected,
  onPress,
}: {
  option: TimeOption;
  selected: boolean;
  onPress: () => void;
}) {
  const fillOpacity = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    fillOpacity.value = withTiming(selected ? 1 : 0, { duration: 180 });
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 16, stiffness: 260 });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fillOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.segmentTouch}
      accessibilityRole="button"
      accessibilityLabel={option === 0 ? 'Sin límite de tiempo' : `${option} segundos`}
      accessibilityState={{ selected }}
      hitSlop={6}
    >
      <Animated.View style={[styles.segment, animatedStyle]}>
        {/* Active fill — semi-transparent gold */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.segmentFill, fillStyle]} />

        {/* Top diamond indicator */}
        {selected && <View style={styles.activeDiamond} />}

        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
          {getLabel(option)}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(196,150,58,0.25)',
  },
  label: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 8,
    letterSpacing: 2.5,
    color: 'rgba(196,150,58,0.8)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  track: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentTouch: {
    flex: 1,
  },
  segment: {
    // Semi-transparent so scroll_banner art shows through
    backgroundColor: 'rgba(7,6,14,0.55)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,150,58,0.2)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 48,
  },
  segmentFill: {
    backgroundColor: 'rgba(196,150,58,0.18)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,150,58,0.55)',
  },
  activeDiamond: {
    position: 'absolute',
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: '#C4963A',
    transform: [{ rotate: '45deg' }],
  },
  segmentText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 13,
    letterSpacing: 1,
    color: 'rgba(82,76,94,0.9)',
  },
  segmentTextActive: {
    color: '#E2B85A',
  },
});
