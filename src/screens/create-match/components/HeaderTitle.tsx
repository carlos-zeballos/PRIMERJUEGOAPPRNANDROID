import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createMatchStyles } from '../styles/createMatch.styles';

interface Props {
  compact: boolean;
}

export function HeaderTitle({ compact }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[createMatchStyles.title, styles.title, compact && styles.titleCompact]}>
        SUSURROS
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 8,
  },
  wrapCompact: {
    paddingTop: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 31,
    letterSpacing: 5,
  },
  titleCompact: {
    fontSize: 25,
  },
  rule: {
    width: 150,
    height: 1,
    marginTop: 5,
    backgroundColor: 'rgba(200,169,107,0.42)',
  },
});
