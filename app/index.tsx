/**
 * index.tsx
 *
 * HOME 1 (no autenticado):
 *   Fila 1: INICIAR SESIÓN
 *   Fila 2: CREAR CUENTA | COMO JUGAR
 *
 * HOME 2 (autenticado):
 *   Fila 1: JUGAR CAMPAÑA
 *   Fila 2: JUGAR MODO LOCAL PRESENCIAL
 *   Fila 3: CERRAR SESIÓN | COMO JUGAR
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../src/components/layout/SafeAreaWrapper';
import { useAuthStore } from '../src/store/authStore';
import { useAudioTrack } from '../src/hooks/useAudioTrack';

const BG          = require('../assets/images/susurros_home_bg.png');
const HOW_TO_PLAY = require('../assets/images/como_jugar.jpg');

const G = {
  gold:  '#C4963A',
  gold2: '#E2B85A',
  bg:    '#07060E',
} as const;

// ─── Cómo Jugar con zoom ──────────────────────────────────────────────────────

function HowToPlayModal({ onClose }: { onClose: () => void }) {
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
    <GestureHandlerRootView style={hw.overlay}>
      <View style={hw.header}>
        <Text style={hw.title}>CÓMO JUGAR</Text>
        <Text style={hw.hint}>
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
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12} onPress={onClose} style={hw.closeBtn}>
        <Text style={hw.closeText}>CERRAR</Text>
      </Pressable>
    </GestureHandlerRootView>
  );
}

const hw = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:'rgba(3,3,8,0.97)', alignItems:'center', justifyContent:'center', padding:8, gap:16 },
  header:   { alignItems:'center', gap:4 },
  title:    { fontFamily:'Cinzel-Bold', fontSize:18, letterSpacing:3, color:'rgba(226,184,90,0.95)' },
  hint:     { fontFamily:'Inter-Regular', fontSize:11, color:'rgba(200,180,140,0.60)', textAlign:'center' },
  closeBtn: { borderWidth:1, borderColor:'rgba(200,169,107,0.55)', paddingHorizontal:28, paddingVertical:10, borderRadius:8, backgroundColor:'rgba(10,8,18,0.72)' },
  closeText:{ fontFamily:'Cinzel-Bold', fontSize:11, letterSpacing:2, color:'rgba(226,184,90,0.90)' },
});

// ─── Panel de inicio de sesión (inline) ───────────────────────────────────────

function LoginPanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) return;
    await login(email.trim(), password);
    if (!useAuthStore.getState().error) onSuccess();
  }

  async function handleGoogle() {
    await loginWithGoogle();
    if (!useAuthStore.getState().error) onSuccess();
  }

  return (
    <View style={panel.wrap}>
      <Text style={panel.title}>INICIAR SESIÓN</Text>

      <Text style={panel.label}>CORREO</Text>
      <TextInput
        style={panel.input}
        value={email}
        onChangeText={t => { setEmail(t); clearError(); }}
        placeholder="tu@correo.com"
        placeholderTextColor="rgba(150,140,120,0.50)"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={[panel.label, { marginTop: 16 }]}>CONTRASEÑA</Text>
      <TextInput
        style={panel.input}
        value={password}
        onChangeText={t => { setPassword(t); clearError(); }}
        placeholder="••••••••"
        placeholderTextColor="rgba(150,140,120,0.50)"
        secureTextEntry
      />

      {error ? <Text style={panel.error}>{error}</Text> : null}

      <Pressable
        onPress={handleLogin}
        disabled={isLoading || !email || !password}
        style={({ pressed }) => [panel.btnPrimary, pressed && panel.pressed, (isLoading || !email || !password) && panel.dimmed]}
        accessibilityRole="button" accessibilityLabel="Entrar"
      >
        {isLoading ? <ActivityIndicator color={G.gold2} size="small" /> : <Text style={panel.btnPrimaryText}>ENTRAR</Text>}
      </Pressable>

      <View style={panel.sep}>
        <View style={panel.sepLine} /><Text style={panel.sepText}>O</Text><View style={panel.sepLine} />
      </View>

      <Pressable
        onPress={handleGoogle}
        disabled={isLoading}
        style={({ pressed }) => [panel.btnSecondary, pressed && panel.pressed]}
        accessibilityRole="button" accessibilityLabel="Continuar con Google"
      >
        <Text style={panel.btnSecondaryText}>CONTINUAR CON GOOGLE</Text>
      </Pressable>

      <Pressable onPress={onClose} style={({ pressed }) => [panel.btnGhost, pressed && panel.pressed]} accessibilityRole="button">
        <Text style={panel.btnGhostText}>CANCELAR</Text>
      </Pressable>
    </View>
  );
}

const panel = StyleSheet.create({
  wrap:          { width:'100%', gap:4 },
  title:         { fontFamily:'Cinzel-Bold', fontSize:20, letterSpacing:4, color:'rgba(226,184,90,0.95)', textAlign:'center', marginBottom:16 },
  label:         { fontFamily:'Cinzel-Bold', fontSize:10, letterSpacing:2, color:'rgba(200,169,107,0.75)' },
  input:         { fontFamily:'Inter-Regular', fontSize:15, color:'rgba(226,215,185,0.95)', borderBottomWidth:1, borderBottomColor:'rgba(200,169,107,0.40)', paddingVertical:10, marginBottom:4 },
  error:         { fontFamily:'Inter-Regular', fontSize:12, color:'#FF8A7A', textAlign:'center', marginTop:8 },
  btnPrimary:    { backgroundColor:'rgba(10,8,18,0.80)', borderWidth:1.5, borderColor:G.gold, borderRadius:8, paddingVertical:14, alignItems:'center', marginTop:16, minHeight:50 },
  btnPrimaryText:{ fontFamily:'Cinzel-Bold', fontSize:12, letterSpacing:3, color:G.gold2 },
  sep:           { flexDirection:'row', alignItems:'center', gap:10, marginVertical:12 },
  sepLine:       { flex:1, height:1, backgroundColor:'rgba(200,169,107,0.22)' },
  sepText:       { fontFamily:'Cinzel-Regular', fontSize:11, color:'rgba(200,169,107,0.45)', letterSpacing:2 },
  btnSecondary:  { borderWidth:1, borderColor:'rgba(200,169,107,0.50)', borderRadius:8, paddingVertical:12, alignItems:'center', backgroundColor:'rgba(10,8,18,0.55)' },
  btnSecondaryText:{ fontFamily:'Cinzel-Bold', fontSize:10, letterSpacing:2, color:G.gold2 },
  btnGhost:      { paddingVertical:12, alignItems:'center' },
  btnGhostText:  { fontFamily:'Cinzel-Regular', fontSize:11, letterSpacing:2, color:'rgba(200,169,107,0.45)' },
  pressed:       { opacity:0.72, transform:[{ scale:0.985 }] },
  dimmed:        { opacity:0.45 },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, logout, continueAsGuest } = useAuthStore();
  const [howToVisible,   setHowToVisible]   = useState(false);
  const [loginVisible,   setLoginVisible]   = useState(false);

  const isAuthenticated = !!user;

  useAudioTrack('PRINCIPAL');

  async function handleGuest() {
    await continueAsGuest();
  }

  function handleLoginSuccess() {
    setLoginVisible(false);
    // El observer de auth actualizará isAuthenticated automáticamente
  }

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

          {!isAuthenticated ? (
            /* ══ HOME 1 — Sin sesión ══ */
            <>
              {/* Fila 1: INICIAR SESIÓN */}
              <Btn label="INICIAR SESIÓN"    onPress={() => setLoginVisible(true)}          primary />
              <View style={{ height: 10 }} />
              {/* Fila 2: CREAR CUENTA | COMO JUGAR */}
              <View style={styles.row}>
                <Btn label="CREAR CUENTA"   onPress={() => router.push('/(auth)/register')} secondary flex />
                <Btn label="COMO JUGAR"     onPress={() => setHowToVisible(true)}           secondary flex />
              </View>
              <View style={{ height: 10 }} />
              {/* Acceso rápido como invitado */}
              <Btn label="Entrar como invitado" onPress={handleGuest} ghost />
            </>
          ) : (
            /* ══ HOME 2 — Con sesión ══ */
            <>
              {/* Fila 1: JUGAR CAMPAÑA */}
              <Btn label="JUGAR CAMPAÑA"             onPress={() => router.push('/(solo)/difficulty')}  primary />
              <View style={{ height: 10 }} />
              {/* Fila 2: JUGAR MODO LOCAL PRESENCIAL */}
              <Btn label="JUGAR MODO LOCAL PRESENCIAL" onPress={() => router.push('/(game)/setup')}      secondary />
              <View style={{ height: 10 }} />
              {/* Fila 3: CERRAR SESIÓN | COMO JUGAR */}
              <View style={styles.row}>
                <Btn label="CERRAR SESIÓN" onPress={logout}                          secondary flex />
                <Btn label="COMO JUGAR"   onPress={() => setHowToVisible(true)}      secondary flex />
              </View>
            </>
          )}
        </View>
      </ImageBackground>

      {/* Modal: Inicio de sesión */}
      <Modal
        visible={loginVisible}
        transparent
        animationType="fade"
        supportedOrientations={['portrait','landscape','landscape-left','landscape-right']}
        onRequestClose={() => setLoginVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LoginPanel onClose={() => setLoginVisible(false)} onSuccess={handleLoginSuccess} />
          </View>
        </View>
      </Modal>

      {/* Modal: Cómo Jugar */}
      <Modal
        visible={howToVisible}
        transparent
        animationType="fade"
        supportedOrientations={['portrait','landscape','landscape-left','landscape-right']}
        onRequestClose={() => setHowToVisible(false)}
      >
        <HowToPlayModal onClose={() => setHowToVisible(false)} />
      </Modal>
    </SafeAreaWrapper>
  );
}

// ─── Botón reutilizable ───────────────────────────────────────────────────────

function Btn({
  label, onPress, primary, secondary, ghost, flex,
}: {
  label: string; onPress: () => void;
  primary?: boolean; secondary?: boolean; ghost?: boolean; flex?: boolean;
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
        flex      && { flex: 1 },
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { backgroundColor: G.bg },
  bg:   { flex: 1 },

  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  tagline: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 13,
    letterSpacing: 5,
    color: 'rgba(224,205,165,0.75)',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:20 },
  divLine: { flex:1, height:1, backgroundColor:'rgba(196,150,58,0.35)' },
  divGem:  { color:G.gold2, fontSize:12 },

  row: { flexDirection:'row', gap:10 },

  // Botones
  btn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnPrimary:   { backgroundColor:'rgba(10,8,18,0.80)', borderWidth:1.5, borderColor:G.gold },
  btnSecondary: { backgroundColor:'rgba(10,8,18,0.55)', borderWidth:1,   borderColor:'rgba(196,150,58,0.50)' },
  btnGhost:     { backgroundColor:'transparent' },

  btnText:          { fontFamily:'Cinzel-Bold', textTransform:'uppercase', textAlign:'center' },
  btnTextPrimary:   { fontSize:13, letterSpacing:3, color:G.gold2 },
  btnTextSecondary: { fontSize:10, letterSpacing:2, color:G.gold2 },
  btnTextGhost:     { fontSize:11, letterSpacing:1, color:'rgba(200,169,107,0.50)' },

  pressed: { opacity:0.72, transform:[{ scale:0.985 }] },

  // Modal de login
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,3,8,0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(12,10,20,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.30)',
    borderRadius: 12,
    padding: 28,
  },
});
