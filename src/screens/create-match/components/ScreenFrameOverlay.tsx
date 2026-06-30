import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';

export function ScreenFrameOverlay() {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <Image
        resizeMode="stretch"
        source={createMatchAssets.frame.screen}
        style={styles.frame}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  frame: {
    width: '100%',
    height: '100%',
    opacity: 0.96,
  },
});
