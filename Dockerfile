# Образ приложения viet-speller (тип web по vps-ops): один контейнер — Nest
# отдаёт API и собранный фронтенд. Сборка идёт здесь, на сервере node нет.
#
# База — node:24-slim (Debian), а не alpine: better-sqlite3 и argon2 ставятся
# готовыми бинарниками под glibc, без компилятора в образе.

# ── сборка ────────────────────────────────────────────────────────────────
FROM node:24.22.0-slim AS build
# Движку миграций Prisma нужен libssl — в slim его может не оказаться.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Swagger UI тянет @scarf/scarf — сборщик телеметрии в postinstall. Не нужен.
ENV SCARF_ANALYTICS=false

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/content/package.json packages/content/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web
COPY apps/api apps/api
# Пакеты ядра и контента → фронтенд (Vite) → бэкенд (prisma generate + nest build).
RUN npm run build:packages \
 && npm run build -w @viet/web \
 && npm run build -w @viet/api \
 && npm prune --omit=dev

# ── запуск ────────────────────────────────────────────────────────────────
FROM node:24.22.0-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/viet-speller.db \
    WEB_DIST=/app/apps/web/dist

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/core/package.json packages/core/
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/content/package.json packages/content/
COPY --from=build /app/packages/content/dist packages/content/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/prisma7.config.ts apps/api/
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/dist apps/api/dist

# SQLite живёт в /app/data — это том ./data на сервере, он в ночном бэкапе.
# Процесс — от root, как остальные приложения по vps-ops: каталог data/ на
# хосте создаёт root, и под другим пользователем база не открылась бы.
RUN mkdir -p /app/data /app/logs
WORKDIR /app/apps/api
EXPOSE 3000

# Миграции — при каждом старте: новая версия сама доводит схему базы.
# exec — чтобы SIGTERM от docker stop дошёл до Nest и база закрылась штатно.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
