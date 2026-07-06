import React, { useState } from 'react';
import { ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { HowToPlayModal } from '../../src/components/HowToPlayModal';
import { useAudioTrack } from '../../src/hooks/useAudioTrack';

const BG = require('../../assets/images/susurros_home_bg.png');

const G = {
  gold:  '#C4963A',
  gold2: '#E2B85A',
  bg:    '#07060E',
} as const;

export default function InicioScreen() {
  const [howToVisible, setHowToVisible] = useState(false);

  useAudioTrack('PRINCIPAL');

  return (
    <SafeAreaWrapper style={styles.safe}>
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <View style={styles.bottom}>
          <Text style={styles.tagline}>ESCUCHA · INTERPRETA · LIBERA</Text>
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divGem}>✦</Text>
            <View style={styles.divLine} />
          </View>

          <Btn label="JUGAR CAMPAÑA" onPress={() => router.push('/(solo)/difficulty')} primary />
          <View style={{ height: 10 }} />
          <Btn label="JUGAR MODO LOCAL PRESENCIAL" onPress={() => router.push('/(game)/setup')} secondary />
          <View style={{ height: 10 }} />
          <Btn label="COMO JUGAR" onPress={() => setHowToVisible(true)} ghost />
        </View>
      </ImageBackground>

      <Modal
        visible={howToVisible}
        transparent
        animationType="fade"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => setHowToVisible(false)}
      >
        <HowToPlayModal onClose={() => setHowToVisible(false)} />
      </Modal>
    </SafeAreaWrapper>
  );
}

function Btn({
  label, onPress, primary, secondary, ghost,
}: {
  label: string; onPress: () => void;
  primary?: boolean; secondary?: boolean; ghost?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        primary   && styles.btnPrimary,
        secondary && styles.btnSecondary,
        ghost     && styles.btnGhost,
        pressed   && styles.pressed,
      ]}
    >
      <Text style={[
        styles.btnText,
        primary   && styles.btnTextPrimary,
        secondary && styles.btnTextSecondary,
        ghost     && styles.btnTextGhost,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: G.bg },
  bg:   { flex: 1 },

  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tagline: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 13,
    letterSpacing: 5,
    color: 'rgba(224,205,165,0.75)',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(196,150,58,0.35)' },
  divGem:  { color: G.gold2, fontSize: 12 },

  btn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnPrimary:   { backgroundColor: 'rgba(10,8,18,0.80)', borderWidth: 1.5, borderColor: G.gold },
  btnSecondary: { backgroundColor: 'rgba(10,8,18,0.55)', borderWidth: 1,   borderColor: 'rgba(196,150,58,0.50)' },
  btnGhost:     { backgroundColor: 'transparent' },

  btnText:          { fontFamily: 'Cinzel-Bold', textTransform: 'uppercase', textAlign: 'center' },
  btnTextPrimary:   { fontSize: 13, letterSpacing: 3, color: G.gold2 },
  btnTextSecondary: { fontSize: 10, letterSpacing: 2, color: G.gold2 },
  btnTextGhost:     { fontSize: 11, letterSpacing: 1, color: 'rgba(200,169,107,0.50)' },

  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
