import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/lib/ui';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Habla Bien' }} />
        <Stack.Screen name="topic" options={{ title: 'Elige un tema' }} />
        <Stack.Screen name="record" options={{ title: 'Exposición oral' }} />
        <Stack.Screen name="feedback" options={{ title: 'Retroalimentación' }} />
        <Stack.Screen name="history" options={{ title: 'Historial' }} />
      </Stack>
    </>
  );
}
