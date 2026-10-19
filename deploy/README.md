# Выкатка на VPS

По скиллу `vps-ops`: приложение типа `web`, один контейнер — Nest отдаёт API
и собранный фронтенд. База — SQLite в `/srv/apps/viet-speller/data`, она в
ночном бэкапе.

## Первый раз

На сервере, от root:

```bash
vps add viet-speller --type web \
    --repo git@github.com:budapesht6666/viet-speller.git \
    --domain viet-speller.p1gog.duckdns.org --port 3000

cp /srv/apps/viet-speller/repo/deploy/compose.yml /srv/apps/viet-speller/compose.yml

# Секрет сессий — свой на этом сервере, в git его нет.
echo "JWT_SECRET=$(openssl rand -base64 48)" > /srv/apps/viet-speller/.env
# Ключи ИИ-собеседника, бесплатные тарифы (apps/api/.env.example).
# Без них собеседник показывает «не настроен», остальное работает.
echo "GEMINI_API_KEY=..." >> /srv/apps/viet-speller/.env
echo "GROQ_API_KEY=..."   >> /srv/apps/viet-speller/.env
chmod 600 /srv/apps/viet-speller/.env

vps deploy viet-speller
vps status
curl -sSI https://viet-speller.p1gog.duckdns.org/health | head -1
```

Первый запрос к домену дольше обычного: Caddy получает сертификат.
Поддомен регистрировать не нужно — DuckDNS резолвит его сам.

Сборка идёт в Docker на сервере: `npm ci` и `vite build` берут около
гигабайта памяти на пару минут. На машине с 2 ГБ, где уже живут боты, —
выкатывать в тихое время.

## Дальше

```bash
vps deploy viet-speller     # git pull + сборка образа + перезапуск
vps logs viet-speller -f
```

Миграции базы накатываются сами при старте контейнера
(`prisma migrate deploy` в CMD Dockerfile).

## Что проверить после выкатки

- `https://viet-speller.p1gog.duckdns.org/health` — 200.
- С iPhone: открыть адрес, «На экран Домой», запустить с иконки —
  распознавание работает только по https и только с иконки проверяется
  честно (CLAUDE.md, «Проверка на устройстве»).
- Регистрация, код семьи, второй человек входит по коду.
