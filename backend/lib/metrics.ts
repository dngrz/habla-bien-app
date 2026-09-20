export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface FillerCount {
  term: string;
  count: number;
}

export interface RepeatCount {
  word: string;
  count: number;
}

export interface OralMetrics {
  durationSec: number;
  wordCount: number;
  wordsPerMinute: number;
  pauseCount: number;
  longestPauseSec: number;
  totalPauseSec: number;
  totalFillers: number;
  fillers: FillerCount[];
  repeatedWords: RepeatCount[];
}

/**
 * A pause is any silence between consecutive words longer than this.
 */
export const PAUSE_THRESHOLD_SEC = 1.5;

/**
 * Muletillas frecuentes en español. Es una detección aproximada: Whisper tiende a
 * normalizar disfluencias, por eso el conteo puede ser menor al real.
 * Se comparan frases largas primero para no contar "o" dentro de "o sea".
 */
const FILLER_PHRASES = [
  'o sea',
  'es que',
  'me entiendes',
  'en plan',
  'como que',
  'mas o menos',
  'este',
  'eh',
  'em',
  'mmm',
  'bueno',
  'pues',
  'digamos',
  'sabes',
  'tipo',
  'vale',
] as const;

const STOPWORDS = new Set([
  'para',
  'porque',
  'cuando',
  'donde',
  'como',
  'pero',
  'este',
  'esta',
  'esto',
  'estos',
  'estas',
  'sobre',
  'entre',
  'hacia',
  'desde',
  'hasta',
  'aunque',
  'mientras',
  'entonces',
  'tambien',
  'tampoco',
  'mucho',
  'muchos',
  'mucha',
  'muchas',
  'poco',
  'pocos',
  'todos',
  'todas',
  'todo',
  'toda',
  'algun',
  'alguna',
  'algunos',
  'algunas',
  'mismo',
  'misma',
  'otros',
  'otras',
  'otro',
  'otra',
  'porque',
  'puede',
  'pueden',
  'hacer',
  'tener',
  'decir',
  'creo',
  'pienso',
  'cosa',
  'cosas',
  'parte',
  'forma',
  'manera',
  'ser',
  'estar',
  'hace',
  'solo',
  'cada',
  'muy',
  'mas',
  'menos',
  'con',
  'por',
  'las',
  'los',
  'una',
  'unos',
  'unas',
  'del',
  'que',
  'les',
  'nos',
  'mis',
  'sus',
  'tus',
]);

export function normalizeToken(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function computePauses(
  words: WordTimestamp[],
  thresholdSec: number = PAUSE_THRESHOLD_SEC,
): { pauseCount: number; longestPauseSec: number; totalPauseSec: number } {
  let pauseCount = 0;
  let longestPauseSec = 0;
  let totalPauseSec = 0;

  for (let i = 1; i < words.length; i += 1) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= thresholdSec) {
      pauseCount += 1;
      totalPauseSec += gap;
      if (gap > longestPauseSec) longestPauseSec = gap;
    }
  }

  return {
    pauseCount,
    longestPauseSec: round(longestPauseSec),
    totalPauseSec: round(totalPauseSec),
  };
}

export function countFillers(words: WordTimestamp[]): FillerCount[] {
  const tokens = words.map((w) => normalizeToken(w.word)).filter(Boolean);
  const counts = new Map<string, number>();

  for (const phrase of FILLER_PHRASES) {
    const parts = phrase.split(' ');
    let index = 0;
    while (index <= tokens.length - parts.length) {
      let match = true;
      for (let j = 0; j < parts.length; j += 1) {
        if (tokens[index + j] !== parts[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
        index += parts.length;
      } else {
        index += 1;
      }
    }
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);
}

export function countRepeatedWords(words: WordTimestamp[], minCount = 3): RepeatCount[] {
  const counts = new Map<string, number>();

  for (const w of words) {
    const token = normalizeToken(w.word);
    if (token.length < 4 || STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function computeMetrics(
  words: WordTimestamp[],
  fallbackDurationSec: number,
): OralMetrics {
  const lastWordEnd = words.length > 0 ? words[words.length - 1].end : 0;
  const durationSec = Math.max(fallbackDurationSec, lastWordEnd, 0);
  const wordCount = words.length;
  const safeDuration = durationSec > 0 ? durationSec : 1;
  const { pauseCount, longestPauseSec, totalPauseSec } = computePauses(words);
  const fillers = countFillers(words);

  return {
    durationSec: round(durationSec),
    wordCount,
    wordsPerMinute: Math.round((wordCount / safeDuration) * 60),
    pauseCount,
    longestPauseSec,
    totalPauseSec,
    totalFillers: fillers.reduce((sum, f) => sum + f.count, 0),
    fillers,
    repeatedWords: countRepeatedWords(words),
  };
}

export function formatClock(totalSeconds: number): string {
  const safe = clamp(Math.round(totalSeconds), 0, Number.MAX_SAFE_INTEGER);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
