import { Platform } from 'react-native';

import type { AnalysisResult, Topic } from './types';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // ignore
  }
  return `El servidor respondió ${response.status}`;
}

export async function fetchTopics(): Promise<Topic[]> {
  const response = await fetch(`${API_URL}/api/topics`);
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as { topics: Topic[] };
  return data.topics;
}

export async function fetchRandomTopic(excludeId?: string): Promise<Topic> {
  const query = excludeId ? `?random=true&exclude=${encodeURIComponent(excludeId)}` : '?random=true';
  const response = await fetch(`${API_URL}/api/topics${query}`);
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as { topic: Topic };
  return data.topic;
}

interface AnalyzeInput {
  uri: string;
  mimeType: string;
  topicId?: string;
}

function guessExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
}

export async function analyzeAudio({ uri, mimeType, topicId }: AnalyzeInput): Promise<AnalysisResult> {
  const formData = new FormData();
  const extension = guessExtension(mimeType);
  const filename = `exposicion.${extension}`;

  if (Platform.OS === 'web') {
    const blobResponse = await fetch(uri);
    const blob = await blobResponse.blob();
    formData.append('audio', blob, filename);
  } else {
    formData.append(
      'audio',
      { uri, name: filename, type: mimeType } as unknown as Blob,
    );
  }
  if (topicId) formData.append('topicId', topicId);

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as AnalysisResult;
}
