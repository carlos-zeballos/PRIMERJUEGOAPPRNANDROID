import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';
import { TimeOption } from '../../../types/match.types';
import { TIMER_OPTIONS } from '../constants/createMatch.constants';
import { createMatchStyles } from '../styles/createMatch.styles';
import { PortalDecorationLayer } from './PortalDecorationLayer';
import { SegmentedOptionButton } from './SegmentedOptionButton';

interface Props {
  compact: boolean;
  mediumValue: TimeOption;
  interpretersValue: TimeOption;
  onMediumChange: (value: TimeOption) => void;
  onInterpretersChange: (value: TimeOption) => void;
}

export function TimerSettingsSection({
  compact,
  mediumValue,
  interpretersValue,
  onMediumChange,
  onInterpretersChange,
}: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <PortalDecorationLayer compact={compact} />
      <TimerPanel
        title="TIEMPO DEL MEDIUM"
        asset="medium"
        value={mediumValue}
        onChange={onMediumChange}
      />
      <TimerPanel
        title="TIEMPO DE INTERPRETES"
        asset="interpreters"
        value={interpretersValue}
        onChange={onInterpretersChange}
      />
    </View>
  );
}

function TimerPanel({
  title,
  asset,
  value,
  onChange,
}: {
  title: string;
  asset: 'medium' | 'interpreters';
  value: TimeOption;
  onChange: (value: TimeOption) => void;
}) {
  return (
    <ImageBackground
      source={createMatchAssets.timerPanels[asset]}
      resizeMode="stretch"
      style={styles.panel}
      imageStyle={styles.panelImage}
    >
      <Text style={[createMatchStyles.sectionTitle, styles.title]}>{title}</Text>
      <View style={styles.options}>
        {TIMER_OPTIONS.map((option) => (
          <SegmentedOptionButton
            key={option}
            value={option}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    gap: 10,
    marginBottom: 10,
    paddingTop: 22,
  },
  wrapCompact: {
    gap: 5,
    marginBottom: 4,
    paddingTop: 8,
  },
  panel: {
    width: '100%',
    minHeight: 118,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 13,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  panelImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 18,
    letterSpacing: 1.6,
    color: '#2B1A0E',
    textShadowRadius: 0,
    marginBottom: 9,
  },
  options: {
    flexDirection: 'row',
    gap: 6,
  },
});
