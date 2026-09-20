import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnalysisResult, StoredSession } from './types';

const STORAGE_KEY = 'habla-bien:sessions';
const MAX_SESSIONS = 30;

export async function loadSessions(): Promise<StoredSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredSession[];
  } catch {
    return [];
  }
}

export async function saveSession(result: AnalysisResult): Promise<void> {
  const session: StoredSession = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    topicTitle: result.topic.title,
    structureScore: result.structure.score,
    clarityScore: result.clarity.score,
    toneScore: result.tone.score,
    wordsPerMinute: result.metrics.wordsPerMinute,
    totalFillers: result.metrics.totalFillers,
    coachMessage: result.coachMessage,
  };

  const existing = await loadSessions();
  const updated = [session, ...existing].slice(0, MAX_SESSIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
