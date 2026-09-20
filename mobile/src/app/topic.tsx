import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card, PrimaryButton, SectionTitle } from '@/components/kit';
import { fetchRandomTopic, fetchTopics } from '@/lib/api';
import type { Topic } from '@/lib/types';
import { palette } from '@/lib/ui';

export default function TopicScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTopics(await fetchTopics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los temas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goToRecord = useCallback(
    (topic: Topic) => {
      router.push({
        pathname: '/record',
        params: {
          topicId: topic.id,
          topicTitle: topic.title,
          topicPrompt: topic.prompt,
        },
      });
    },
    [router],
  );

  const pickRandom = useCallback(async () => {
    setRandomLoading(true);
    try {
      goToRecord(await fetchRandomTopic());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener un tema.');
    } finally {
      setRandomLoading(false);
    }
  }, [goToRecord]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <SectionTitle>¿Sobre qué quieres hablar?</SectionTitle>
      <Text style={styles.help}>
        Elige un tema o deja que la app te proponga uno al azar. Tendrás hasta 2
        minutos para exponerlo.
      </Text>

      <PrimaryButton
        label={randomLoading ? 'Buscando tema…' : 'Tema aleatorio'}
        onPress={() => void pickRandom()}
        disabled={randomLoading}
      />

      {loading ? <ActivityIndicator color={palette.primary} style={styles.loader} /> : null}

      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void load()} />
        </Card>
      ) : null}

      {topics.map((topic) => (
        <Pressable
          key={topic.id}
          onPress={() => goToRecord(topic)}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicPrompt}>{topic.prompt}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  help: { fontSize: 14, lineHeight: 21, color: palette.muted },
  loader: { marginVertical: 12 },
  error: { color: palette.danger, fontSize: 14 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: palette.text },
  topicPrompt: { fontSize: 14, lineHeight: 20, color: palette.muted },
  pressed: { opacity: 0.8 },
});
