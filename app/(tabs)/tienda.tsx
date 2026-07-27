import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { Button } from '../../src/components/ui/Button';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../src/constants/theme';

const STORE = {
  name: 'SUSURROS — Tienda de Juegos',
  address: 'Chullo 612, Arequipa 04014',
  latitude: -16.3960823,
  longitude: -71.5493985,
};

export default function TiendaScreen() {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status === 'granted' ? 'granted' : 'denied');
    })();
  }, []);

  function openDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${STORE.latitude},${STORE.longitude}`;
    Linking.openURL(url);
  }

  return (
    <SafeAreaWrapper style={styles.wrap}>
      <Text style={styles.title}>TIENDA</Text>

      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: STORE.latitude,
            longitude: STORE.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={locationStatus === 'granted'}
          showsMyLocationButton={locationStatus === 'granted'}
        >
          <Marker
            coordinate={{ latitude: STORE.latitude, longitude: STORE.longitude }}
            title={STORE.name}
            description={STORE.address}
          />
        </MapView>
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.infoName}>{STORE.name}</Text>
        <Text style={styles.infoAddress}>{STORE.address}</Text>
      </View>

      {locationStatus === 'denied' && (
        <Text style={styles.hint}>
          Activa el permiso de ubicación para ver tu posición respecto a la tienda.
        </Text>
      )}

      <Button label="CÓMO LLEGAR" variant="primary" onPress={openDirections} style={styles.cta} />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: SPACING.xl },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING.lg,
  },
  mapCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.strokeSubtle,
  },
  map: { flex: 1 },
  infoPanel: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.abyss,
  },
  infoName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.gold,
    marginBottom: 4,
  },
  infoAddress: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  cta: { marginTop: SPACING.lg },
});
