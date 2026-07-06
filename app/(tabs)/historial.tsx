import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaWrapper } from '../../src/components/layout/SafeAreaWrapper';
import { useAuth } from '../../src/context/AuthContext';
import {
  suscribirHistorialPartidas,
  PartidaHistorial,
} from '../../src/services/firebase/realtimeGames';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { DIFFICULTY_LABELS } from '../../src/constants/gameConfig';

export default function HistorialScreen() {
  const { user } = useAuth();
  const [games, setGames] = useState<PartidaHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGames([]);
      setLoading(false);
      return;
    }

    const unsubscribe = suscribirHistorialPartidas(user.uid, (partidas) => {
      setGames(partidas);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <SafeAreaWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>HISTORIAL</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Cargando...</Text>
        </View>
      ) : games.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No hay partidas registradas.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <GameHistoryItem session={item} />}
        />
      )}
    </SafeAreaWrapper>
  );
}

function GameHistoryItem({ session }: { session: PartidaHistorial }) {
  const isBlueWin  = session.resultado === 'BLUE_WIN';
  const resultColor = isBlueWin ? COLORS.blueGlow : COLORS.redGlow;
  const resultLabel = isBlueWin ? 'AZUL GANA' : 'ROJO GANA';
  const date = session.finalizadaEn
    ? new Date(session.finalizadaEn).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <View style={itemStyles.container}>
      <View style={itemStyles.row}>
        <Text style={[itemStyles.result, { color: resultColor }]}>{resultLabel}</Text>
        <Text style={itemStyles.date}>{date}</Text>
      </View>
      <View style={itemStyles.row}>
        <Text style={itemStyles.detail}>
          {DIFFICULTY_LABELS[session.dificultad as keyof typeof DIFFICULTY_LABELS]} · {session.turnos} turnos
        </Text>
        <Text style={itemStyles.detail}>
          🔵 {session.blueScore}/{session.blueTotal} · 🔴 {session.redScore}/{session.redTotal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 20,
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  list: {
    padding: SPACING.base,
    gap: SPACING.sm,
  },
});

const itemStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.abyss,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surface,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  result: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
  },
  date: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detail: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
