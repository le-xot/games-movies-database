#!/usr/bin/env bash
#
# Возвращает `application` на образ, который работал до последнего деплоя.
#
# `docker.yaml` перед обновлением складывает id текущего образа в
# `.rollback-image`; при провале health-чека шаг деплоя вызывает этот скрипт.
# Запускать можно и руками из каталога деплоя: `bash rollback.sh`.
#
# Откатывается только приложение: миграции — отдельный one-shot образ, и если
# схема уже уехала вперёд, откат кода её не отменит. В таком случае скрипт
# честно скажет, что приложение не поднялось, вместо тихой поломки.
set -euo pipefail

IMAGE="ghcr.io/le-xot/games-movies-database:latest"
STATE=".rollback-image"
HEALTH_URL="${HEALTH_URL:-https://le-xot.dev/api/health}"
ATTEMPTS="${ROLLBACK_ATTEMPTS:-30}"

cd "$(dirname "$0")"

if [ ! -s "$STATE" ]; then
  echo "rollback.sh: нет сохранённого образа ($STATE) — откатывать некуда" >&2
  exit 1
fi

previous="$(cat "$STATE")"

if ! docker image inspect "$previous" >/dev/null 2>&1; then
  echo "rollback.sh: образ $previous отсутствует локально (удалён prune'ом)" >&2
  echo "rollback.sh: нужен откат коммитом в master или пул по digest" >&2
  exit 1
fi

echo "rollback.sh: возвращаю $IMAGE на $previous"
docker tag "$previous" "$IMAGE"
docker compose up -d --force-recreate --no-deps application

for _ in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "rollback.sh: приложение снова отвечает на $HEALTH_URL"
    exit 0
  fi
  sleep 2
done

echo "rollback.sh: откат не помог — нужен ручной разбор" >&2
docker compose logs --tail 50 application || true
exit 1
