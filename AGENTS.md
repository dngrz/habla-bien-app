# AGENTS.md

"Habla Bien": app móvil que entrena comunicación oral de estudiantes. El estudiante
graba una exposición de hasta 2 minutos; la IA transcribe y devuelve feedback sobre
estructura, claridad, muletillas y tono.

## Estructura

- `backend/` — Next.js 16 (App Router, TypeScript). Proxy de OpenAI. Único lugar con `OPENAI_API_KEY`.
- `mobile/` — Expo SDK 57 + React Native 0.86 (TypeScript, expo-router). Rutas en `src/app`, alias `@/*` → `src/*`.

## Comandos

Backend (en `backend/`):
- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` (eslint)
- `npx tsc --noEmit`

Mobile (en `mobile/`):
- `npm run web` (`expo start --web`) / `npm run start`
- `npm run lint` (`expo lint`)
- `npx tsc --noEmit`
- `npx expo-doctor`
- `npx expo export --platform web` (build web, verifica que empaqueta)

Raíz:
- `podman-compose up --build` / `podman-compose down`
- Solo el backend está containerizado; la app móvil corre en el host.

## Reglas y gotchas

- **La app móvil nunca llama a OpenAI.** Sube el audio a `POST /api/analyze`; la key vive solo en el backend.
- **Transcripción con `whisper-1`**, no `gpt-transcribe`: es el único que entrega timestamps por palabra, necesarios para medir pausas y ritmo. Ver `backend/lib/openai.ts`.
- **Las métricas se calculan en código**, no con IA: `backend/lib/metrics.ts` (funciones puras) a partir de los timestamps. El LLM solo interpreta estructura, claridad y tono.
- **Métricas orientadas al texto**:
  - Muletillas: `backend/lib/metrics.ts` lista `FILLER_PHRASES`; la detección es aproximada porque Whisper normaliza disfluencias.
  - Pausas: `PAUSE_THRESHOLD_SEC = 1.5`.
- **Schema de la respuesta compartido**: `backend/lib/coach.ts` (`ORAL_FEEDBACK_SCHEMA`) y `mobile/src/lib/types.ts`. Mantener en sincronía.
- **Formato de audio según plataforma**: `expo-audio` graba `webm` en web y `m4a` en nativo. El backend acepta ambos (`EXTENSION_BY_MIME`).
- **CORS por defecto**: `http://localhost:8081` (Expo web). Configurable con `CORS_ALLOWED_ORIGINS`.
- **Rate limit en memoria por IP** en `/api/analyze` (`backend/lib/rate-limit.ts`, `RATE_LIMIT_MAX`, 1 h). No comparte estado entre réplicas.
- **Env**: el `.env` de la raíz lo usa `podman-compose`. Expo lee `mobile/.env` (no el de la raíz) para `EXPO_PUBLIC_API_URL`.
- **Nombre del archivo de compose**: `docker-compose.yml`, ejecutado con `podman-compose` (el subcomando `podman compose` de esta máquina delega en Docker Compose; no usarlo).

## Documentación obligatoria de los frameworks

Ambos frameworks tienen instrucciones propias que hay que leer antes de tocar código:
- `backend/AGENTS.md` → leer guías en `backend/node_modules/next/dist/docs/` (Next 16 cambió APIs).
- `mobile/AGENTS.md` → leer docs versionadas en https://docs.expo.dev/versions/v57.0.0/
