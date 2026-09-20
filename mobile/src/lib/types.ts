export interface Topic {
  id: string;
  title: string;
  prompt: string;
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

export interface AnalysisResult {
  topic: Topic;
  transcript: string;
  metrics: OralMetrics;
  structure: StructureAnalysis;
  clarity: QualitativeScore;
  tone: QualitativeScore;
  strengths: string[];
  improvements: Improvement[];
  coachMessage: string;
}

export interface StoredSession {
  id: string;
  createdAt: string;
  topicTitle: string;
  structureScore: number;
  clarityScore: number;
  toneScore: number;
  wordsPerMinute: number;
  totalFillers: number;
  coachMessage: string;
}
