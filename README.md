# Habla Bien

App móvil que actúa como **entrenador de comunicación** para estudiantes. El
estudiante elige un tema, graba una exposición oral de hasta 2 minutos y recibe
retroalimentación sobre **estructura, claridad, muletillas y tono**, con un tono
paciente y sin juicio.

## Demo Publicada

| App | URL |
|---|---|
| Demo | [https://habla-bien-frontend-production.up.railway.app/](https://habla-bien-frontend-production.up.railway.app/) |


> Alcance actual: **modo oral**. Los modos escrito y debate simulado aparecen en la
> app como "Próximamente".

## Arquitectura

| Componente | Tecnología | Carpeta |
|---|---|---|
| App móvil | Expo SDK 57 + React Native 0.86 (TypeScript, expo-router) | `mobile/` |
| App web | Mismo código Expo, exportado a estáticos y servido por nginx | `mobile/` |
| Backend | Next.js 16 (App Router, TypeScript), proxy de OpenAI | `backend/` |
| Contenedores | Podman + `podman-compose` (backend + web) | `docker-compose.yml` |

```
habla-bien-app/
├── backend/          # API Next.js, contenedor
├── mobile/           # app Expo (host) + build web (contenedor)
│   ├── Dockerfile    # contenedor web: export de Expo + nginx
│   └── nginx.conf    # sirve bajo /habla-bien/
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

## Ejecutar backend + web (contenedores)

```bash
podman-compose up --build
```

Servicios publicados:

| Servicio | URL |
|---|---|
| App web | http://localhost:8080/habla-bien/ |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/api/health |

Para detener:

```bash
podman-compose down
```

> La app web se exporta **en tiempo de build** con `EXPO_PUBLIC_API_URL` y el
> subpath `/habla-bien/` (`experiments.baseUrl` en `mobile/app.json`). Para
> producción, define `EXPO_PUBLIC_API_URL` con la URL HTTPS pública del backend y
> añade el origen de la web a `CORS_ALLOWED_ORIGINS`.

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

> En desarrollo (`expo start`) las rutas cuelgan de la raíz (`/record`, …). El
> subpath `/habla-bien/` (`experiments.baseUrl`) se aplica **solo en el export de
> producción**, que es el que usa el contenedor web.

## Variables de entorno

Raíz (`.env`, usadas por `podman-compose`):

| Variable | Default | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | — | Obligatoria |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1` | Único modelo con timestamps por palabra |
| `OPENAI_ANALYSIS_MODEL` | `gpt-4o` | Modelo que interpreta estructura/claridad/tono |
| `BACKEND_PORT` | `3000` | Puerto publicado en el host |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:8081,...` | Orígenes permitidos (incluye el de la web publicada) |
| `RATE_LIMIT_MAX` | `10` | Análisis por IP y por hora |
| `WEB_PORT` | `8080` | Puerto del contenedor web publicado en el host |
| `EXPO_PUBLIC_API_URL` | — | URL absoluta del backend; se inyecta en el build web |

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
npx expo export --platform web   # build web (debe referenciar /habla-bien/_expo/...)

# Contenedor web
podman-compose build web
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
- **404 del JS en la web publicada**: debe servirse bajo `/habla-bien/` con el
  `baseUrl` configurado y el `try_files` de `mobile/nginx.conf`. Verifica que el
  `dist` referencie `/habla-bien/_expo/...`. En producción el sitio debe ir por
  **HTTPS** (el micrófono lo exige).
