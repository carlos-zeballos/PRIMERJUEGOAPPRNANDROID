import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';

interface Props {
  compact: boolean;
}

export function PortalDecorationLayer({ compact }: Props) {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Image source={createMatchAssets.portal.arch} resizeMode="contain" style={styles.portal} />
      {!compact ? (
        <>
          <Image source={createMatchAssets.decorations.hourglassLeft} resizeMode="contain" style={[styles.hourglass, styles.left]} />
          <Image source={createMatchAssets.decorations.hourglassRight} resizeMode="contain" style={[styles.hourglass, styles.right]} />
          <Image source={createMatchAssets.decorations.book} resizeMode="contain" style={styles.book} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: -28,
    right: -28,
    top: -88,
    bottom: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portal: {
    width: '112%',
    height: '112%',
    opacity: 0.9,
  },
  hourglass: {
    position: 'absolute',
    top: 18,
    width: 76,
    height: 130,
    opacity: 0.9,
  },
  left: {
    left: 4,
  },
  right: {
    right: 4,
  },
  book: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 100,
    height: 86,
    opacity: 0.92,
  },
});
