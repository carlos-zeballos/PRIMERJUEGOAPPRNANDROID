import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { StartingTeam } from '../../../types/match.types';
import { TEAM_OPTIONS } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';
import { TeamOptionCard } from './TeamOptionCard';

interface Props {
  compact: boolean;
  value: StartingTeam;
  onChange: (value: StartingTeam) => void;
}

export function TeamSelectorSection({ compact, value, onChange }: Props) {
  return (
    <ImageBackground
      source={createMatchAssets.teamPanel.panel}
      resizeMode="stretch"
      style={[styles.panel, compact && styles.panelCompact]}
      imageStyle={styles.panelImage}
    >
      <Image
        source={createMatchAssets.characters.spiritBlue}
        resizeMode="contain"
        style={[styles.spirit, styles.blue, compact && styles.spiritCompact]}
      />
      <Image
        source={createMatchAssets.characters.spiritRed}
        resizeMode="contain"
        style={[styles.spirit, styles.red, compact && styles.spiritCompact]}
      />

      <Text style={[createMatchStyles.sectionTitle, styles.title]}>QUE EQUIPO INICIA?</Text>
      <View style={styles.options}>
        {TEAM_OPTIONS.map((option) => (
          <TeamOptionCard
            key={option.key}
            team={option.key}
            icon={option.icon}
            color={option.color}
            label={option.label}
            selected={value === option.key}
            onPress={() => onChange(option.key)}
          />
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    minHeight: 190,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
    overflow: 'hidden',
    marginBottom: 6,
  },
  panelImage: {
    width: '100%',
    height: '100%',
  },
  panelCompact: {
    minHeight: 166,
    paddingTop: 18,
    paddingBottom: 18,
  },
  spirit: {
    position: 'absolute',
    width: 116,
    height: 154,
    bottom: -8,
    opacity: 0.58,
  },
  spiritCompact: {
    opacity: 0.34,
    width: 90,
  },
  blue: {
    left: -26,
  },
  red: {
    right: -26,
  },
  title: {
    fontSize: 18,
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
});
