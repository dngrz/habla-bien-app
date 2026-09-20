import { toFile } from 'openai';

import {
  ANALYSIS_MODEL,
  TRANSCRIBE_MODEL,
  TRANSCRIBE_PROMPT,
  getOpenAIClient,
} from '@/lib/openai';
import {
  COACH_SYSTEM_PROMPT,
  ORAL_FEEDBACK_SCHEMA,
  type OralFeedback,
  buildUserPrompt,
} from '@/lib/coach';
import { computeMetrics, type WordTimestamp } from '@/lib/metrics';
import { findTopic, getRandomTopic } from '@/lib/topics';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  errorResponse,
  getClientIp,
  jsonResponse,
  preflight,
} from '@/lib/http';

export const runtime = 'nodejs';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // límite de la API de transcripción

const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'webm',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'video/webm': 'webm',
};

const SUPPORTED_EXTENSIONS = new Set(['webm', 'm4a', 'mp4', 'mp3', 'mpeg', 'mpga', 'wav']);

function resolveExtension(file: File): string {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && SUPPORTED_EXTENSIONS.has(fromName)) return fromName;
  const fromMime = EXTENSION_BY_MIME[file.type.toLowerCase()];
  if (fromMime) return fromMime;
  return 'm4a';
}

export async function OPTIONS(request: Request): Promise<Response> {
  return preflight(request);
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(getClientIp(request));
  if (!limit.allowed) {
    const response = errorResponse(
      request,
      'Alcanzaste el límite de análisis por hora. Intenta más tarde.',
      429,
    );
    response.headers.set('Retry-After', String(limit.retryAfterSec));
    return response;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(request, 'No se pudo leer el formulario con el audio.', 400);
  }

  const audio = formData.get('audio');
  if (!(audio instanceof File)) {
    return errorResponse(request, 'Falta el archivo de audio en el campo "audio".', 400);
  }
  if (audio.size === 0) {
    return errorResponse(request, 'El archivo de audio está vacío.', 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse(request, 'El audio supera el límite de 25 MB.', 413);
  }

  const topicId = formData.get('topicId');
  const topic =
    findTopic(typeof topicId === 'string' ? topicId : undefined) ?? getRandomTopic();

  try {
    const openai = getOpenAIClient();
    const extension = resolveExtension(audio);
    const buffer = Buffer.from(await audio.arrayBuffer());
    const uploadable = await toFile(buffer, `exposicion.${extension}`, {
      type: audio.type || 'audio/m4a',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: uploadable,
      model: TRANSCRIBE_MODEL,
      language: 'es',
      prompt: TRANSCRIBE_PROMPT,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const words: WordTimestamp[] = (transcription.words ?? []).map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
    }));
    const transcript = transcription.text?.trim() ?? '';
    const metrics = computeMetrics(words, transcription.duration ?? 0);

    const completion = await openai.chat.completions.create({
      model: ANALYSIS_MODEL,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'oral_feedback',
          strict: true,
          schema: ORAL_FEEDBACK_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt({
            topicTitle: topic.title,
            topicPrompt: topic.prompt,
            transcript,
            metrics,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return errorResponse(request, 'El análisis no devolvió contenido.', 502);
    }

    const feedback = JSON.parse(content) as OralFeedback;

    return jsonResponse(request, {
      topic,
      transcript,
      metrics,
      ...feedback,
    });
  } catch (error) {
    console.error('[analyze] error', error);
    const message =
      error instanceof Error ? error.message : 'Error inesperado al analizar el audio.';
    return errorResponse(request, `No se pudo analizar el audio: ${message}`, 500);
  }
}
