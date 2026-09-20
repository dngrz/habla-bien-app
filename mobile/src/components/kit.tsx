import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { palette, scoreColor } from '@/lib/ui';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === 'secondary' && styles.buttonLabelSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ScoreBar({
  label,
  score,
  note,
}: {
  label: string;
  score: number;
  note?: string;
}) {
  const color = scoreColor(score);
  return (
    <View style={styles.scoreBlock}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={[styles.scoreValue, { color }]}>{score}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }]} />
      </View>
      {note ? <Text style={styles.scoreNote}>{note}</Text> : null}
    </View>
  );
}

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const backgroundColor =
    tone === 'good' ? '#DCFCE7' : tone === 'bad' ? '#FEE2E2' : palette.accentSoft;
  const color =
    tone === 'good' ? palette.success : tone === 'bad' ? palette.danger : palette.primaryDark;
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: palette.primary,
  },
  buttonSecondary: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  buttonDanger: {
    backgroundColor: palette.danger,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonLabelSecondary: {
    color: palette.primary,
  },
  scoreBlock: {
    gap: 6,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 999,
  },
  scoreNote: {
    fontSize: 13,
    color: palette.muted,
    lineHeight: 19,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
