#!/usr/bin/env bash
# Tests for scripts/rollback.sh.
# Run: bash scripts/__tests__/rollback.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/rollback.sh"
failures=0

pass() { echo "ok - $1"; }
fail() { echo "not ok - $1"; failures=$((failures + 1)); }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin"

write_shim() { # $1=name $2=body
  printf '#!/usr/bin/env bash\n%s\n' "$2" > "$work/bin/$1"
  chmod +x "$work/bin/$1"
}

run() { (cd "$work" && PATH="$work/bin:$PATH" HEALTH_URL=http://stub/health ROLLBACK_ATTEMPTS=1 bash ./rollback.sh 2>&1); }

# Скрипт живёт рядом с compose-файлом, поэтому копируем его в рабочий каталог.
cp "$SCRIPT" "$work/rollback.sh"

# 1. без сохранённого образа откатывать нечего
if output="$(run)" && false; then
  fail "fails when no rollback image is remembered"
else
  case "$output" in
    *"откатывать некуда"*) pass "fails when no rollback image is remembered" ;;
    *) fail "fails when no rollback image is remembered" ;;
  esac
fi

# 2. образ, который успел уехать в prune, не подменяем на пустоту
write_shim docker 'case "$1 $2" in "image inspect") exit 1;; *) exit 0;; esac'
printf 'sha256:deadbeef\n' > "$work/.rollback-image"
if output="$(run)"; then
  fail "fails when the previous image is gone"
else
  case "$output" in
    *"отсутствует локально"*) pass "fails when the previous image is gone" ;;
    *) fail "fails when the previous image is gone" ;;
  esac
fi

# 3. успешный откат: тег переставлен, контейнер поднят, health ответил
write_shim docker 'printf "docker %s\n" "$*" >> "$DOCKER_LOG"; exit 0'
write_shim curl 'exit 0'
export DOCKER_LOG="$work/docker.log"
: > "$DOCKER_LOG"
if output="$(run)"; then
  if grep -q '^docker tag sha256:deadbeef ghcr.io/le-xot/games-movies-database:latest$' "$DOCKER_LOG" \
    && grep -q '^docker compose up -d --force-recreate --no-deps application$' "$DOCKER_LOG"; then
    pass "retags the previous image and recreates the container"
  else
    fail "retags the previous image and recreates the container"
  fi
else
  fail "retags the previous image and recreates the container"
fi

# 4. если health так и не ответил — падаем, а не рапортуем об успехе
write_shim curl 'exit 22'
if output="$(run)"; then
  fail "fails when the rolled-back app stays unhealthy"
else
  case "$output" in
    *"откат не помог"*) pass "fails when the rolled-back app stays unhealthy" ;;
    *) fail "fails when the rolled-back app stays unhealthy" ;;
  esac
fi

if [ "$failures" -ne 0 ]; then
  echo "$failures failing"
  exit 1
fi
echo "all tests passed"
