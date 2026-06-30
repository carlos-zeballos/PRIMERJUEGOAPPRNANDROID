import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMatchAssets } from '../../../assets/createMatchAssets';

interface Props {
  kind: 'back' | 'settings';
  label: string;
  onPress: () => void;
}

function IconActionButtonBase({ kind, label, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const source =
    kind === 'back'
      ? pressed
        ? createMatchAssets.iconButtons.backPressed
        : createMatchAssets.iconButtons.backInactive
      : pressed
        ? createMatchAssets.iconButtons.settingsPressed
        : createMatchAssets.iconButtons.settingsInactive;

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={12}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.touch}
    >
      <Image source={source} resizeMode="contain" style={styles.icon} />
    </Pressable>
  );
}

export const IconActionButton = memo(IconActionButtonBase);

const styles = StyleSheet.create({
  touch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 44,
    height: 44,
  },
});
