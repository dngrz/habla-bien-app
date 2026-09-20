import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, SectionTitle } from '@/components/kit';
import { palette } from '@/lib/ui';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Entrena tu comunicación</Text>
        <Text style={styles.subtitle}>
          Un entrenador paciente y sin juicio para practicar tu exposición oral.
          Recibe retroalimentación concreta sobre estructura, claridad y muletillas.
        </Text>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <SectionTitle>Modo oral</SectionTitle>
          <Text style={styles.badge}>Disponible</Text>
        </View>
        <Text style={styles.body}>
          Graba una exposición de hasta 2 minutos sobre un tema. La IA transcribe lo
          que dijiste y te devuelve observaciones específicas.
        </Text>
        <PrimaryButton label="Empezar exposición" onPress={() => router.push('/topic')} />
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <SectionTitle>Modo escrito</SectionTitle>
          <Text style={styles.badgeMuted}>Próximamente</Text>
        </View>
        <Text style={styles.bodyMuted}>
          Revisión de textos argumentativos enfocada en hipótesis y argumentos, no solo
          en ortografía.
        </Text>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <SectionTitle>Debate simulado</SectionTitle>
          <Text style={styles.badgeMuted}>Próximamente</Text>
        </View>
        <Text style={styles.bodyMuted}>
          La IA toma la posición contraria y tú debes rebatirla con argumentos.
        </Text>
      </Card>

      <PrimaryButton
        label="Ver historial de prácticas"
        variant="secondary"
        onPress={() => router.push('/history')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.bg,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  hero: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.muted,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    color: palette.success,
    fontWeight: '700',
    fontSize: 12,
  },
  badgeMuted: {
    color: palette.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.text,
  },
  bodyMuted: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.muted,
  },
});
