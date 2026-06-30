import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StartingTeam } from '../../types/match.types';

const SPIRIT_BLUE = require('../../../assets/images/spirit_blue.png');
const SPIRIT_RED  = require('../../../assets/images/spirit_red.png');

interface Props {
  value: StartingTeam;
  onChange: (t: StartingTeam) => void;
}

export function TeamSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.sectionLabel}>¿QUÉ EQUIPO INICIA?</Text>
        <View style={styles.labelLine} />
      </View>

      <View style={styles.row}>
        <TeamOption
          team="blue"
          label="AZUL"
          color="#4A90E8"
          selected={value === 'blue'}
          onPress={() => onChange('blue')}
        >
          <Image source={SPIRIT_BLUE} style={styles.spirit} resizeMode="contain" />
        </TeamOption>

        <RandomOption
          selected={value === 'random'}
          onPress={() => onChange('random')}
        />

        <TeamOption
          team="red"
          label="ROJO"
          color="#C44040"
          selected={value === 'red'}
          onPress={() => onChange('red')}
        >
          <Image source={SPIRIT_RED} style={styles.spirit} resizeMode="contain" />
        </TeamOption>
      </View>
    </View>
  );
}

function TeamOption({
  team,
  label,
  color,
  selected,
  onPress,
  children,
}: {
  team: 'blue' | 'red';
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 220 });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.teamTouch}
      accessibilityRole="button"
      accessibilityLabel={`Equipo ${label}`}
      accessibilityState={{ selected }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          styles.teamCard,
          {
            borderColor: selected ? color : 'rgba(196,150,58,0.25)',
            borderWidth: selected ? 1.5 : 1,
            backgroundColor: selected
              ? (team === 'blue' ? 'rgba(74,144,232,0.18)' : 'rgba(196,64,64,0.18)')
              : 'rgba(7,6,14,0.6)',
          },
          animatedStyle,
        ]}
      >
        {children}
        <Text style={[styles.teamLabel, { color: selected ? color : 'rgba(160,148,138,0.55)' }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function RandomOption({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 220 });
  }, [selected]);

  function handlePress() {
    rotateY.value = withSequence(
      withTiming(90, { duration: 120 }),
      withTiming(0, { duration: 120 }),
    );
    onPress();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 400 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return (
    <Pressable
      onPress={handlePress}
      style={styles.teamTouch}
      accessibilityRole="button"
      accessibilityLabel="Equipo aleatorio"
      accessibilityState={{ selected }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          styles.teamCard,
          {
            borderColor: selected ? 'rgba(196,150,58,0.7)' : 'rgba(196,150,58,0.25)',
            borderWidth: selected ? 1.5 : 1,
            backgroundColor: selected ? 'rgba(196,150,58,0.12)' : 'rgba(7,6,14,0.6)',
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.randomIcon, selected && styles.randomIconSelected]}>
          {selected ? '⟳' : '?'}
        </Text>
        <Text style={[styles.teamLabel, selected && { color: '#C4963A' }]}>
          AZAR
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(196,150,58,0.2)',
  },
  sectionLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 8,
    letterSpacing: 2.5,
    color: 'rgba(196,150,58,0.75)',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  teamTouch: {
    flex: 1,
  },
  teamCard: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    minHeight: 88,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spirit: {
    width: 40,
    height: 48,
  },
  teamLabel: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 8,
    letterSpacing: 2.5,
    color: 'rgba(160,148,138,0.55)',
  },
  randomIcon: {
    fontSize: 28,
    color: 'rgba(196,150,58,0.45)',
  },
  randomIconSelected: {
    color: '#C4963A',
  },
});
