import React, { memo, useEffect } from 'react';
import { Image, ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { StartingTeam } from '../../../types/match.types';
import { createMatchStyles } from '../styles/createMatch.styles';

interface Props {
  color: string;
  icon: ImageSourcePropType;
  label: string;
  selected: boolean;
  team: StartingTeam;
  onPress: () => void;
}

function getAsset(team: StartingTeam, selected: boolean) {
  if (!selected) return createMatchAssets.teamOptions.inactive;
  if (team === 'blue') return createMatchAssets.teamOptions.blueActive;
  if (team === 'red') return createMatchAssets.teamOptions.redActive;
  return createMatchAssets.teamOptions.randomActive;
}

function TeamOptionCardBase({ color, icon, label, selected, team, onPress }: Props) {
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.05 : 1, { damping: 14, stiffness: 230 });
    lift.value = withTiming(selected ? -3 : 0, { duration: 160 });
  }, [lift, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel={`Seleccionar equipo inicial ${label.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={handlePress}
      style={styles.touch}
    >
      <Animated.View style={[styles.wrap, animatedStyle]}>
        {selected ? <View style={[styles.aura, { backgroundColor: color }]} /> : null}
        <ImageBackground
          source={getAsset(team, selected)}
          resizeMode="stretch"
          style={styles.card}
          imageStyle={styles.cardImage}
        >
          <Image source={icon} resizeMode="contain" style={styles.icon} />
          <Text style={[createMatchStyles.secondaryLabel, styles.label, selected && { color }]}>
            {label}
          </Text>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

export const TeamOptionCard = memo(TeamOptionCardBase);

const styles = StyleSheet.create({
  touch: {
    flex: 1,
    minHeight: 104,
  },
  wrap: {
    flex: 1,
    minHeight: 104,
  },
  aura: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    bottom: 10,
    opacity: 0.25,
    borderRadius: 12,
  },
  card: {
    flex: 1,
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  icon: {
    width: 40,
    height: 40,
  },
  label: {
    fontSize: 15,
    color: '#D6C091',
  },
});
