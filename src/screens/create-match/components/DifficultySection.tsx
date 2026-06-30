import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { Difficulty } from '../../../types/match.types';
import { DIFFICULTY_OPTIONS } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';
import { DifficultyIconButton } from './DifficultyIconButton';

interface Props {
  compact: boolean;
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

export function DifficultySection({ compact, value, onChange }: Props) {
  return (
    <ImageBackground
      source={createMatchAssets.difficulty.panel}
      resizeMode="stretch"
      style={[styles.panel, compact && styles.panelCompact]}
      imageStyle={styles.panelImage}
    >
      <Image
        source={createMatchAssets.characters.medium}
        resizeMode="contain"
        style={[styles.medium, compact && styles.mediumCompact]}
      />

      <View style={styles.content}>
        <Text style={[createMatchStyles.sectionTitle, styles.title]}>DIFICULTAD</Text>
        <View style={styles.options}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <DifficultyIconButton
              key={option.key}
              activeIcon={option.activeIcon}
              inactiveIcon={option.inactiveIcon}
              color={option.color}
              label={option.label}
              selected={value === option.key}
              onPress={() => onChange(option.key)}
            />
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    minHeight: 150,
    justifyContent: 'center',
    overflow: 'visible',
    marginBottom: 10,
  },
  panelCompact: {
    minHeight: 132,
    marginBottom: 4,
  },
  panelImage: {
    width: '100%',
    height: '100%',
    opacity: 0.98,
  },
  medium: {
    position: 'absolute',
    left: -28,
    bottom: -2,
    width: '34%',
    height: '112%',
  },
  mediumCompact: {
    left: -18,
    width: '28%',
    opacity: 0.72,
  },
  content: {
    marginLeft: '25%',
    marginRight: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    letterSpacing: 2.8,
    marginBottom: 8,
  },
  options: {
    width: '100%',
    flexDirection: 'row',
    gap: 5,
  },
});
