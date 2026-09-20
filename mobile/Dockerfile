# Contenedor WEB: export estático de Expo (SDK 57) servido por nginx bajo /habla-bien/.
# El nombre debe ser "Dockerfile" (podman-compose ignora el campo `dockerfile:`).
FROM node:22-alpine AS build
WORKDIR /app
ENV CI=1
ENV EXPO_NO_TELEMETRY=1
COPY mobile/package*.json ./
RUN npm ci
COPY mobile/. .
# Se inyecta en tiempo de build: la app web no puede usar localhost en producción.
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export --platform web

FROM nginx:alpine
COPY mobile/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
