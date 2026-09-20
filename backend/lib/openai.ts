import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la variable de entorno OPENAI_API_KEY');
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * whisper-1 es el único modelo de transcripción de OpenAI que entrega
 * timestamps por palabra, necesarios para medir pausas y velocidad.
 */
export const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1';

export const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL ?? 'gpt-4o';

/**
 * Prompt que ayuda a Whisper a conservar muletillas y puntuación en español.
 */
export const TRANSCRIBE_PROMPT =
  'Exposición oral en español de un estudiante. Transcribe literalmente, conservando muletillas y disfluencias como "eh", "mmm", "o sea", "este", "bueno", "pues", con su puntuación.';
