import React, { useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BORDER_RADIUS, COLORS, GRADIENTS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  visible: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Modal({ visible, title, onClose, children }: Props) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.wrapper, SHADOWS.panel]}>
          <LinearGradient
            colors={GRADIENTS.panel}
            style={styles.content}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Top border glow line */}
            <View style={styles.topGlow} />

            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {title && (
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <View style={styles.titleLine} />
                  <Text style={styles.title}>{title}</Text>
                  <View style={styles.titleLine} />
                </View>
              </View>
            )}

            <View style={styles.body}>
              {children}
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,7,14,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  wrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
  },
  content: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    overflow: 'hidden',
    padding: SPACING.xl,
  },

  // Top accent glow
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.5)',
  },

  // Corner bracket accents
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: COLORS.gold,
    borderWidth: 1,
  },
  cornerTL: { top: 8,  left: 8,  borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 3 },
  cornerTR: { top: 8,  right: 8, borderLeftWidth: 0,  borderBottomWidth: 0, borderTopRightRadius: 3 },
  cornerBL: { bottom: 8, left: 8,  borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 3 },
  cornerBR: { bottom: 8, right: 8, borderLeftWidth: 0,  borderTopWidth: 0, borderBottomRightRadius: 3 },

  header: {
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.gold,
    textAlign: 'center',
  },
  body: {
    gap: SPACING.sm,
  },
});
