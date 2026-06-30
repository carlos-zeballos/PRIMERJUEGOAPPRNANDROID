import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TeamColor } from '../../types/game.types';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  blueScore: number;
  blueTotal: number;
  redScore: number;
  redTotal: number;
  activeTeam: TeamColor;
}

export function ScoreTracker({ blueScore, blueTotal, redScore, redTotal, activeTeam }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.team, activeTeam === 'BLUE' && styles.activeTeam]}>
        <Text style={styles.labelBlue}>AZUL</Text>
        <View style={styles.segmentRow}>
          {Array.from({ length: blueTotal }).map((_, i) => (
            <View
              key={i}
              style={[styles.segment, i < blueScore ? styles.segmentBlue : styles.segmentEmpty]}
            />
          ))}
        </View>
        <Text style={styles.scoreText}>{blueScore}/{blueTotal}</Text>
      </View>

      <View style={styles.divider} />

      <View style={[styles.team, activeTeam === 'RED' && styles.activeTeamRed]}>
        <Text style={styles.labelRed}>ROJO</Text>
        <View style={styles.segmentRow}>
          {Array.from({ length: redTotal }).map((_, i) => (
            <View
              key={i}
              style={[styles.segment, i < redScore ? styles.segmentRed : styles.segmentEmpty]}
            />
          ))}
        </View>
        <Text style={styles.scoreText}>{redScore}/{redTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.abyss,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  activeTeam: {
    backgroundColor: COLORS.blueDeep,
  },
  activeTeamRed: {
    backgroundColor: COLORS.redDeep,
  },
  labelBlue: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.blueGlow,
    letterSpacing: 2,
    marginBottom: 4,
  },
  labelRed: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.redGlow,
    letterSpacing: 2,
    marginBottom: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 3,
  },
  segment: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  segmentBlue: { backgroundColor: COLORS.blue },
  segmentRed:  { backgroundColor: COLORS.red },
  segmentEmpty:{ backgroundColor: COLORS.ash },
  scoreText: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.ash,
    marginHorizontal: SPACING.sm,
  },
});
