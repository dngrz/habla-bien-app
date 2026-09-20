import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, SectionTitle } from '@/components/kit';
import { clearSessions, loadSessions } from '@/lib/storage';
import type { StoredSession } from '@/lib/types';
import { palette, scoreColor } from '@/lib/ui';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadSessions().then((data) => {
        if (active) setSessions(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const confirmClear = useCallback(() => {
    const clear = async () => {
      await clearSessions();
      setSessions([]);
    };
    if (Platform.OS === 'web') {
      void clear();
      return;
    }
    Alert.alert('Borrar historial', '¿Seguro que quieres borrar todas tus prácticas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => void clear() },
    ]);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {sessions.length === 0 ? (
        <Card>
          <SectionTitle>Todavía no hay prácticas</SectionTitle>
          <Text style={styles.body}>
            Cuando termines una exposición, aquí verás tu progreso y podrás comparar
            cómo mejoras con el tiempo.
          </Text>
          <PrimaryButton label="Comenzar ahora" onPress={() => router.push('/topic')} />
        </Card>
      ) : (
        <>
          {sessions.map((session) => (
            <Card key={session.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.topic}>{session.topicTitle}</Text>
                <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
              </View>
              <View style={styles.scores}>
                <ScoreChip label="Estructura" score={session.structureScore} />
                <ScoreChip label="Claridad" score={session.clarityScore} />
                <ScoreChip label="Tono" score={session.toneScore} />
              </View>
              <Text style={styles.meta}>
                {session.wordsPerMinute} ppm · {session.totalFillers} muletillas
              </Text>
              <Text style={styles.coach}>{session.coachMessage}</Text>
            </Card>
          ))}
          <PrimaryButton
            label="Borrar historial"
            variant="secondary"
            onPress={confirmClear}
          />
        </>
      )}
    </ScrollView>
  );
}

function ScoreChip({ label, score }: { label: string; score: number }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, { color: scoreColor(score) }]}>{score}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  body: { fontSize: 14, lineHeight: 21, color: palette.muted },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topic: { fontSize: 16, fontWeight: '700', color: palette.text, flexShrink: 1 },
  date: { fontSize: 12, color: palette.muted, marginLeft: 8 },
  scores: { flexDirection: 'row', gap: 10 },
  chip: {
    flexGrow: 1,
    backgroundColor: palette.bg,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chipValue: { fontSize: 18, fontWeight: '800' },
  chipLabel: { fontSize: 11, color: palette.muted, marginTop: 2 },
  meta: { fontSize: 13, color: palette.muted },
  coach: { fontSize: 14, lineHeight: 20, color: palette.text, fontStyle: 'italic' },
});
