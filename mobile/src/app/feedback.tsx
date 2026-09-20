import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card, Pill, PrimaryButton, ScoreBar, SectionTitle } from '@/components/kit';
import { analyzeAudio } from '@/lib/api';
import { saveSession } from '@/lib/storage';
import type { AnalysisResult } from '@/lib/types';
import { palette, formatClock } from '@/lib/ui';

interface Segment {
  text: string;
  filler: boolean;
}

function splitByFillers(text: string, terms: string[]): Segment[] {
  if (terms.length === 0 || !text) return [{ text, filler: false }];
  const escaped = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const lowered = new Set(terms.map((t) => t.toLowerCase()));
  return text
    .split(regex)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, filler: lowered.has(part.toLowerCase()) }));
}

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    mimeType?: string;
    topicId?: string;
    topicTitle?: string;
    topicPrompt?: string;
  }>();

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (!params.uri) {
      setError('No se recibió el audio para analizar.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeAudio({
        uri: params.uri,
        mimeType: params.mimeType || 'audio/m4a',
        topicId: params.topicId || undefined,
      });
      setResult(analysis);
      void saveSession(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar el audio.');
    } finally {
      setLoading(false);
    }
  }, [params.mimeType, params.topicId, params.uri]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void runAnalysis();
  }, [runAnalysis]);

  const segments = useMemo(() => {
    if (!result) return [];
    return splitByFillers(
      result.transcript,
      result.metrics.fillers.map((f) => f.term),
    );
  }, [result]);

  const retryTopic = useCallback(() => {
    router.replace({
      pathname: '/record',
      params: {
        topicId: params.topicId ?? '',
        topicTitle: params.topicTitle ?? '',
        topicPrompt: params.topicPrompt ?? '',
      },
    });
  }, [params.topicId, params.topicPrompt, params.topicTitle, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingTitle}>Analizando tu exposición…</Text>
        <Text style={styles.loadingHint}>
          Estamos transcribiendo y midiendo pausas, ritmo y muletillas.
        </Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <Card>
          <SectionTitle>No pudimos analizar el audio</SectionTitle>
          <Text style={styles.errorText}>{error ?? 'Intenta grabar de nuevo.'}</Text>
        </Card>
        <PrimaryButton label="Grabar de nuevo" onPress={retryTopic} />
        <PrimaryButton
          label="Reintentar análisis"
          variant="secondary"
          onPress={() => void runAnalysis()}
        />
      </ScrollView>
    );
  }

  const { metrics, structure, clarity, tone } = result;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Card style={styles.coachCard}>
        <Text style={styles.coachLabel}>Tu entrenador dice</Text>
        <Text style={styles.coachMessage}>{result.coachMessage}</Text>
      </Card>

      <Card>
        <SectionTitle>Estructura</SectionTitle>
        <View style={styles.checklist}>
          <CheckItem label="Introducción" ok={structure.hasIntro} />
          <CheckItem label="Desarrollo" ok={structure.hasDevelopment} />
          <CheckItem label="Conclusión" ok={structure.hasConclusion} />
        </View>
        <Text style={styles.body}>{structure.summary}</Text>
      </Card>

      <Card>
        <SectionTitle>Indicadores</SectionTitle>
        <ScoreBar label="Estructura" score={structure.score} />
        <ScoreBar label="Claridad" score={clarity.score} note={clarity.notes} />
        <ScoreBar label="Tono percibido" score={tone.score} note={tone.notes} />
      </Card>

      <Card>
        <SectionTitle>Tu voz en números</SectionTitle>
        <View style={styles.statsRow}>
          <Stat label="Ritmo" value={`${metrics.wordsPerMinute}`} unit="ppm" />
          <Stat label="Duración" value={formatClock(metrics.durationSec)} unit="" />
          <Stat label="Pausas" value={`${metrics.pauseCount}`} unit=">1.5s" />
          <Stat label="Muletillas" value={`${metrics.totalFillers}`} unit="" />
        </View>

        {metrics.fillers.length > 0 ? (
          <View style={styles.pillGroup}>
            <Text style={styles.pillLabel}>Muletillas detectadas</Text>
            <View style={styles.pills}>
              {metrics.fillers.map((filler) => (
                <Pill key={filler.term} text={`${filler.term} ×${filler.count}`} tone="bad" />
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.body}>No detectamos muletillas frecuentes. ¡Buen trabajo!</Text>
        )}

        {metrics.repeatedWords.length > 0 ? (
          <View style={styles.pillGroup}>
            <Text style={styles.pillLabel}>Palabras que repetiste</Text>
            <View style={styles.pills}>
              {metrics.repeatedWords.map((word) => (
                <Pill key={word.word} text={`${word.word} ×${word.count}`} />
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.note}>
          La detección de muletillas es aproximada: el transcriptor a veces las
          normaliza. Toma el número como una referencia, no como un juicio exacto.
        </Text>
      </Card>

      <Card>
        <SectionTitle>Transcripción</SectionTitle>
        <Text style={styles.transcript}>
          {segments.map((segment, index) =>
            segment.filler ? (
              <Text key={index} style={styles.fillerText}>
                {segment.text}
              </Text>
            ) : (
              <Text key={index}>{segment.text}</Text>
            ),
          )}
        </Text>
      </Card>

      <Card>
        <SectionTitle>Lo que hiciste bien</SectionTitle>
        {result.strengths.map((strength, index) => (
          <Text key={index} style={styles.bullet}>
            • {strength}
          </Text>
        ))}
      </Card>

      <Card>
        <SectionTitle>Para tu próxima práctica</SectionTitle>
        {result.improvements.map((improvement, index) => (
          <View key={index} style={styles.improvement}>
            <Text style={styles.improvementTitle}>{improvement.title}</Text>
            <Text style={styles.body}>{improvement.detail}</Text>
            <Text style={styles.example}>“{improvement.example}”</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton label="Repetir este tema" onPress={retryTopic} />
      <PrimaryButton
        label="Elegir otro tema"
        variant="secondary"
        onPress={() => router.replace('/topic')}
      />
      <PrimaryButton
        label="Ver historial"
        variant="secondary"
        onPress={() => router.push('/history')}
      />
    </ScrollView>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.checkItem}>
      <Text style={[styles.checkMark, { color: ok ? palette.success : palette.danger }]}>
        {ok ? '✓' : '✗'}
      </Text>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.bg },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: palette.bg,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: palette.text },
  loadingHint: { fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 20 },
  coachCard: { backgroundColor: palette.accentSoft, borderColor: palette.primary },
  coachLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.primaryDark,
    textTransform: 'uppercase',
  },
  coachMessage: { fontSize: 16, lineHeight: 24, color: palette.text, fontWeight: '500' },
  checklist: { gap: 6 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkMark: { fontSize: 16, fontWeight: '800', width: 18 },
  checkLabel: { fontSize: 15, color: palette.text },
  body: { fontSize: 14, lineHeight: 21, color: palette.text },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexGrow: 1,
    minWidth: 72,
    backgroundColor: palette.bg,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: palette.text },
  statUnit: { fontSize: 12, fontWeight: '600', color: palette.muted },
  statLabel: { fontSize: 12, color: palette.muted, marginTop: 2 },
  pillGroup: { gap: 6 },
  pillLabel: { fontSize: 13, fontWeight: '700', color: palette.text },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { fontSize: 12, lineHeight: 18, color: palette.muted, fontStyle: 'italic' },
  transcript: { fontSize: 15, lineHeight: 24, color: palette.text },
  fillerText: { color: palette.danger, fontWeight: '700' },
  bullet: { fontSize: 14, lineHeight: 21, color: palette.text },
  improvement: { gap: 4, marginBottom: 8 },
  improvementTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  example: { fontSize: 14, lineHeight: 20, color: palette.primaryDark, fontStyle: 'italic' },
  errorText: { fontSize: 14, lineHeight: 21, color: palette.danger },
});
