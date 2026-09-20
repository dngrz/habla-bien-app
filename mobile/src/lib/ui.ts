export const palette = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  accentSoft: '#DBEAFE',
};

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function scoreColor(score: number): string {
  if (score >= 75) return palette.success;
  if (score >= 50) return palette.warning;
  return palette.danger;
}
