# Habla Bien

App móvil que actúa como **entrenador de comunicación** para estudiantes. El
estudiante elige un tema, graba una exposición oral de hasta 2 minutos y recibe
retroalimentación sobre **estructura, claridad, muletillas y tono**, con un tono
paciente y sin juicio.

> Alcance actual: **modo oral**. Los modos escrito y debate simulado aparecen en la
> app como "Próximamente".

## Arquitectura

| Componente | Tecnología | Carpeta |
|---|---|---|
| App móvil | Expo SDK 57 + React Native 0.86 (TypeScript, expo-router) | `mobile/` |
| Backend | Next.js 16 (App Router, TypeScript), proxy de OpenAI | `backend/` |
| Contenedores | Podman + `podman-compose` (solo backend) | `docker-compose.yml` |

```
habla-bien-app/
├── backend/          # API Next.js, contenedor
├── mobile/           # app Expo (corre en el host)
├── docker-compose.yml
├── .env.example
├── AGENTS.md
└── README.md
```

La app móvil **nunca** llama a OpenAI: sube el audio a `POST /api/analyze` y el
backend, que es el único que conoce `OPENAI_API_KEY`, hace la transcripción y el
análisis.

## Cómo funciona el modo oral

1. El estudiante elige un tema (o uno aleatorio).
2. Graba hasta 2 minutos. La app corta automáticamente al llegar al límite.
3. El backend transcribe con `whisper-1` (timestamps por palabra) y calcula en
   código: duración, palabras por minuto, pausas > 1.5 s, muletillas y palabras
   repetidas.
4. Un modelo de lenguaje interpreta estructura (introducción / desarrollo /
   conclusión), claridad y tono, y devuelve un mensaje del entrenador con
   fortalezas y mejoras concretas.

## Requisitos

- [Podman](https://podman.io/) y `podman-compose` (este repo usa `podman-compose`,
  no el subcomando `podman compose`).
- Node.js 20+ para correr la app móvil (el backend se compila en su contenedor).
- Una `OPENAI_API_KEY`.

## Configuración

```bash
cp .env.example .env
```

Edita `.env` y define al menos `OPENAI_API_KEY`.

La app móvil lee su propio archivo de entorno:

```bash
cp mobile/.env.example mobile/.env
```

`EXPO_PUBLIC_API_URL` por defecto es `http://localhost:3000` (suficiente para la
vista web). En un dispositivo físico usa la IP LAN de tu PC.

## Ejecutar el backend (contenedor)

```bash
podman-compose up --build
```

Servicios publicados:

| Servicio | URL |
|---|---|
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/api/health |

Para detener:

```bash
podman-compose down
```

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/analyze` | Analiza un audio (`multipart/form-data`, campo `audio`, opcional `topicId`) |
| GET | `/api/topics` | Temas disponibles (`?random=true` para uno aleatorio) |
| GET | `/api/health` | Estado del servicio |

## Ejecutar la app móvil (host)

```bash
cd mobile
npm install
npm run web     # vista web en http://localhost:8081
# o
npm run start   # Expo Go / emulador
```

Para grabar audio desde el navegador, abre `http://localhost:8081` (los
navegadores solo permiten micrófono en contextos seguros; por IP en `http`
fallará).

## Variables de entorno

Raíz (`.env`, usadas por `podman-compose`):

| Variable | Default | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | — | Obligatoria |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1` | Único modelo con timestamps por palabra |
| `OPENAI_ANALYSIS_MODEL` | `gpt-4o` | Modelo que interpreta estructura/claridad/tono |
| `BACKEND_PORT` | `3000` | Puerto publicado en el host |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8081,...` | Orígenes permitidos |
| `RATE_LIMIT_MAX` | `10` | Análisis por IP y por hora |

Móvil (`mobile/.env`):

| Variable | Default | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | URL del backend |

## Verificación

```bash
# Backend
cd backend
npx tsc --noEmit
npm run lint
npm run build

# Móvil
cd mobile
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web
```

## Limitaciones conocidas

- **Muletillas aproximadas**: `whisper-1` normaliza disfluencias, así que el conteo
  es una referencia, no una medición exacta.
- **Tono percibido**: se infiere del texto y de las métricas (ritmo, pausas), no de
  un análisis acústico de pitch o energía.
- **Sin cuentas ni base de datos**: el historial se guarda localmente en el
  dispositivo (AsyncStorage) y el rate limit es en memoria (no sirve con varias
  réplicas).

## Troubleshooting

- **No se puede conectar al backend desde el host en Windows**: si el puerto
  publicado por Podman no responde, reinicia la máquina de Podman
  (`podman machine stop` y `podman machine start`) o revisa el firewall de Windows.
  Dentro del contenedor el servicio responde normalmente.
- **El micrófono no funciona en web**: usa `http://localhost:8081`, no la IP LAN.
