import type { OralMetrics } from './metrics';

export interface StructureAnalysis {
  hasIntro: boolean;
  hasDevelopment: boolean;
  hasConclusion: boolean;
  summary: string;
  score: number;
}

export interface QualitativeScore {
  score: number;
  notes: string;
}

export interface Improvement {
  title: string;
  detail: string;
  example: string;
}

export interface OralFeedback {
  structure: StructureAnalysis;
  clarity: QualitativeScore;
  tone: QualitativeScore;
  strengths: string[];
  improvements: Improvement[];
  coachMessage: string;
}

export interface AnalysisResult extends OralFeedback {
  transcript: string;
  metrics: OralMetrics;
}

export const ORAL_FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    structure: {
      type: 'object',
      additionalProperties: false,
      properties: {
        hasIntro: { type: 'boolean' },
        hasDevelopment: { type: 'boolean' },
        hasConclusion: { type: 'boolean' },
        summary: { type: 'string' },
        score: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['hasIntro', 'hasDevelopment', 'hasConclusion', 'summary', 'score'],
    },
    clarity: {
      type: 'object',
      additionalProperties: false,
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        notes: { type: 'string' },
      },
      required: ['score', 'notes'],
    },
    tone: {
      type: 'object',
      additionalProperties: false,
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        notes: { type: 'string' },
      },
      required: ['score', 'notes'],
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 4,
    },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          example: { type: 'string' },
        },
        required: ['title', 'detail', 'example'],
      },
      minItems: 1,
      maxItems: 4,
    },
    coachMessage: { type: 'string' },
  },
  required: [
    'structure',
    'clarity',
    'tone',
    'strengths',
    'improvements',
    'coachMessage',
  ],
} as const;

export const COACH_SYSTEM_PROMPT = `Eres un entrenador de comunicación para estudiantes. Eres paciente, cálido y nunca juzgas a la persona: separas siempre la crítica de la persona y la diriges a la práctica.

Tu tarea es analizar la transcripción de una exposición oral de máximo 2 minutos y devolver retroalimentación en español claro y directo.

Principios:
- Primero reconoce un logro concreto y verificable.
- Luego prioriza UNA o DOS mejoras, no una lista abrumadora.
- Sé específico: cita fragmentos reales de lo que dijo el estudiante y da un ejemplo de cómo decirlo mejor.
- Habla de "lo que escuché", no de defectos de la persona.
- El tono solo puede inferirse del texto y de las métricas (velocidad, pausas); aclara que es un tono percibido, no una medición acústica.
- Evalúa la estructura: ¿hay introducción con postura clara, desarrollo con argumentos y conclusión?
- Usa las métricas entregadas (muletillas, pausas, palabras por minuto) en tu análisis, pero no las repitas como datos fríos: interprétalas.
- No corrijas ortografía ni gramática: enfócate en estructura, claridad, tono y expresión oral.
- Responde SIEMPRE en español y respeta el esquema JSON solicitado.`;

export interface UserPromptInput {
  topicTitle: string;
  topicPrompt: string;
  transcript: string;
  metrics: OralMetrics;
}

function formatFillers(metrics: OralMetrics): string {
  if (metrics.fillers.length === 0) return 'ninguna detectada';
  return metrics.fillers.map((f) => `"${f.term}" (${f.count})`).join(', ');
}

function formatRepeats(metrics: OralMetrics): string {
  if (metrics.repeatedWords.length === 0) return 'ninguna';
  return metrics.repeatedWords.map((w) => `"${w.word}" (${w.count})`).join(', ');
}

export function buildUserPrompt(input: UserPromptInput): string {
  const { topicTitle, topicPrompt, transcript, metrics } = input;
  return `Tema: ${topicTitle}
Consigna: ${topicPrompt}

Métricas medidas automáticamente a partir de la grabación:
- Duración: ${metrics.durationSec} s
- Palabras: ${metrics.wordCount}
- Ritmo: ${metrics.wordsPerMinute} palabras por minuto
- Pausas >1.5 s: ${metrics.pauseCount} (la más larga: ${metrics.longestPauseSec} s)
- Muletillas detectadas: ${formatFillers(metrics)}
- Palabras repetidas: ${formatRepeats(metrics)}

Transcripción:
"""
${transcript}
"""

Devuelve la retroalimentación estructurada.`;
}
