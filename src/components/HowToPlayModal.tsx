import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const HOW_TO_PLAY = require('../../assets/images/como_jugar.jpg');

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const imgW = landscape ? Math.min(width * 0.90, 900) : Math.min(width * 0.96, 600);
  const imgH = imgW * (559 / 1024);

  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate(e => { scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4); })
    .onEnd(() => { savedScale.value = scale.value; });

  const dblTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => { scale.value = withTiming(1, { duration: 250 }); savedScale.value = 1; });

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <GestureHandlerRootView style={styles.overlay}>
      <View style={styles.header}>
        <Text style={styles.title}>CÓMO JUGAR</Text>
        <Text style={styles.hint}>
          {landscape
            ? 'Pellizca para zoom · Doble toque para restablecer'
            : 'Gira el teléfono · Pellizca para hacer zoom'}
        </Text>
      </View>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, dblTap)}>
        <Animated.View style={[{ width: imgW, height: imgH }, animStyle]}>
          <Image source={HOW_TO_PLAY} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
        </Animated.View>
      </GestureDetector>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12} onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeText}>CERRAR</Text>
      </Pressable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:'rgba(3,3,8,0.97)', alignItems:'center', justifyContent:'center', padding:8, gap:16 },
  header:   { alignItems:'center', gap:4 },
  title:    { fontFamily:'Cinzel-Bold', fontSize:18, letterSpacing:3, color:'rgba(226,184,90,0.95)' },
  hint:     { fontFamily:'Inter-Regular', fontSize:11, color:'rgba(200,180,140,0.60)', textAlign:'center' },
  closeBtn: { borderWidth:1, borderColor:'rgba(200,169,107,0.55)', paddingHorizontal:28, paddingVertical:10, borderRadius:8, backgroundColor:'rgba(10,8,18,0.72)' },
  closeText:{ fontFamily:'Cinzel-Bold', fontSize:11, letterSpacing:2, color:'rgba(226,184,90,0.90)' },
});
