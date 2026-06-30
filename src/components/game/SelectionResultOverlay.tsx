/**
 * SelectionResultOverlay
 * Panel modal que aparece tras cada selección del Intérprete.
 *
 * Muestra la imagen de resultado a pantalla casi completa.
 * Se cierra automáticamente (excepto la Palabra Maldita) o al tocar CONTINUAR.
 * El tablero queda bloqueado mientras es visible.
 */

import React, { useCallback, useEffect } from 'react';
import {
  AccessibilityInfo,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ALERT_CONFIG, SelectionAlertType } from '../../assets/selectionAlertAssets';

interface Props {
  visible:      boolean;
  alertType:    SelectionAlertType | null;
  onContinue:   () => void;
}

export function SelectionResultOverlay({ visible, alertType, onContinue }: Props) {
  const { width, height } = useWindowDimensions();

  // Tamaño responsive de la imagen: máximo 94% del ancho, 74% del alto
  const imgW = Math.min(width  * 0.94, 720);
  const imgH = Math.min(height * 0.74, imgW * 0.78);

  // ── Animación de entrada / salida ──────────────────────────────────────────
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.88);

  useEffect(() => {
    if (visible) {
      // Entrada
      opacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      scale.value   = withSequence(
        withTiming(1.03, { duration: 260, easing: Easing.out(Easing.back(1.2)) }),
        withTiming(1,    { duration: 120 }),
      );

      // Anunciar accesibilidad
      if (alertType) {
        const msg = ALERT_CONFIG[alertType].a11yMessage;
        AccessibilityInfo.announceForAccessibility(msg);
      }
    } else {
      // Salida
      opacity.value = withTiming(0,    { duration: 200, easing: Easing.in(Easing.cubic) });
      scale.value   = withTiming(0.96, { duration: 200 });
    }
  }, [visible, alertType, opacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle     = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // ── Cierre automático ──────────────────────────────────────────────────────
  const stableOnContinue = useCallback(() => onContinue(), [onContinue]);

  useEffect(() => {
    if (!visible || !alertType) return;

    const cfg = ALERT_CONFIG[alertType];
    if (!cfg.autoCloseMs) return; // Palabra Maldita no se cierra sola

    const id = setTimeout(() => stableOnContinue(), cfg.autoCloseMs);
    return () => clearTimeout(id);
  }, [visible, alertType, stableOnContinue]);

  if (!alertType) return null;

  const cfg = ALERT_CONFIG[alertType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        // Solo permite cerrar con atrás si no requiere confirmación
        if (cfg.autoCloseMs !== null) stableOnContinue();
      }}
    >
      {/* ── Fondo oscuro animado ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />

      {/* ── Contenido centrado ── */}
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Imagen de resultado */}
          <Image
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source={cfg.image as any}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{ width: imgW, height: imgH }}
            accessibilityLabel={cfg.a11yMessage}
          />

          {/* Botón de confirmación */}
          <Pressable
            onPress={stableOnContinue}
            accessibilityRole="button"
            accessibilityLabel={cfg.buttonLabel}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>{cfg.buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.90)',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    alignItems: 'center',
    gap: 20,
  },

  btn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(200,169,107,0.80)',
    backgroundColor: 'rgba(8,6,14,0.82)',
  },
  btnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  btnText: {
    fontFamily: 'Cinzel-Bold',
    fontSize: 15,
    letterSpacing: 3,
    color: 'rgba(226,184,90,0.95)',
    textAlign: 'center',
  },
});
