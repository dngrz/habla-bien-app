import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton } from '@/components/kit';
import { formatClock, palette } from '@/lib/ui';

const MAX_SECONDS = 120;

export default function RecordScreen() {
  const router = useRouter();
  const { topicId, topicTitle, topicPrompt } = useLocalSearchParams<{
    topicId?: string;
    topicTitle?: string;
    topicPrompt?: string;
  }>();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigated = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await requestRecordingPermissionsAsync();
        if (!active) return;
        if (!status.granted) {
          setPermissionDenied(true);
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo acceder al micrófono.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const elapsedSec = recorderState.durationMillis / 1000;
  const progress = Math.min(1, elapsedSec / MAX_SECONDS);

  const finish = useCallback(async () => {
    if (navigated.current) return;
    navigated.current = true;
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No se obtuvo el archivo de audio.');
      const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
      router.replace({
        pathname: '/feedback',
        params: {
          uri,
          mimeType,
          topicId: topicId ?? '',
          topicTitle: topicTitle ?? '',
          topicPrompt: topicPrompt ?? '',
        },
      });
    } catch (err) {
      navigated.current = false;
      setBusy(false);
      setError(err instanceof Error ? err.message : 'No se pudo detener la grabación.');
    }
  }, [recorder, router, topicId, topicTitle, topicPrompt]);

  useEffect(() => {
    if (recorderState.isRecording && elapsedSec >= MAX_SECONDS) {
      void finish();
    }
  }, [elapsedSec, finish, recorderState.isRecording]);

  const start = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la grabación.');
    } finally {
      setBusy(false);
    }
  }, [recorder]);

  const recording = recorderState.isRecording;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Card>
        <Text style={styles.label}>Tema</Text>
        <Text style={styles.topicTitle}>{topicTitle || 'Tema libre'}</Text>
        {topicPrompt ? <Text style={styles.prompt}>{topicPrompt}</Text> : null}
      </Card>

      <Card style={styles.recorderCard}>
        <Text style={styles.timer}>{formatClock(elapsedSec)}</Text>
        <Text style={styles.timerHint}>de {formatClock(MAX_SECONDS)}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.dot, recording && styles.dotActive]} />
          <Text style={styles.statusText}>
            {recording ? 'Grabando… habla con calma' : 'Listo para grabar'}
          </Text>
        </View>
      </Card>

      {permissionDenied ? (
        <Card>
          <Text style={styles.error}>
            Necesitamos permiso para usar el micrófono. Habilítalo en los ajustes del
            navegador o del dispositivo y vuelve a intentar.
          </Text>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
        </Card>
      ) : null}

      {!recording ? (
        <PrimaryButton
          label={elapsedSec > 0 ? 'Grabar de nuevo' : 'Comenzar a grabar'}
          onPress={() => void start()}
          disabled={busy || permissionDenied}
        />
      ) : (
        <PrimaryButton
          label={busy ? 'Procesando…' : 'Detener y analizar'}
          variant="danger"
          onPress={() => void finish()}
          disabled={busy}
        />
      )}

      <Text style={styles.tip}>
        Consejo: estructura tu exposición en introducción, desarrollo y conclusión.
        Al terminar, la IA te mostrará en qué mejorar.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'uppercase' },
  topicTitle: { fontSize: 20, fontWeight: '800', color: palette.text },
  prompt: { fontSize: 14, lineHeight: 21, color: palette.muted },
  recorderCard: { alignItems: 'center', gap: 10 },
  timer: { fontSize: 48, fontWeight: '800', color: palette.text, fontVariant: ['tabular-nums'] },
  timerHint: { fontSize: 13, color: palette.muted, marginTop: -6 },
  track: {
    height: 8,
    width: '100%',
    borderRadius: 999,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 999, backgroundColor: palette.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: palette.muted },
  dotActive: { backgroundColor: palette.danger },
  statusText: { fontSize: 14, color: palette.muted },
  error: { color: palette.danger, fontSize: 14, lineHeight: 20 },
  tip: { fontSize: 13, lineHeight: 19, color: palette.muted, textAlign: 'center' },
});
