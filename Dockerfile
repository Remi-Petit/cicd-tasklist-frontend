# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier les sources et builder l'application Vite
COPY . .
RUN npm run build

# ---- Stage 2: runtime (nginx) ----
FROM nginx:1.29-alpine AS runner

# Mettre à jour les paquets OS pour récupérer les derniers correctifs de sécurité
RUN apk update && apk upgrade --no-cache

# Configuration nginx personnalisée (SPA fallback + proxy /api)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques générés par Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
