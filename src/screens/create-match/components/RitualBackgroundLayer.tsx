import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { createMatchAssets } from '../../../assets/createMatchAssets';

export function RitualBackgroundLayer() {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <ImageBackground
        source={createMatchAssets.background.underworld}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
