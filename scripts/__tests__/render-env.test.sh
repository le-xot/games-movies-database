#!/usr/bin/env bash
# Tests for scripts/render-env.sh.
# Run: bash scripts/__tests__/render-env.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/render-env.sh"
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

run() { (cd "$work" && PATH="$work/bin:$PATH" "$@"); }

# 1. renders .env through the doppler branch
write_shim doppler 'printf "%s\n" "POSTGRES_PASSWORD=x" "FOO=bar"'
if run bash "$SCRIPT" >/dev/null 2>&1 \
  && grep -q '^FOO=bar$' "$work/.env" 2>/dev/null; then
  pass "renders .env from doppler provider"
else
  fail "renders .env from doppler provider"
fi

# 2. .env is chmod 600
if [ "$(stat -c %a "$work/.env" 2>/dev/null)" = "600" ]; then
  pass ".env has mode 600"
else
  fail ".env has mode 600"
fi

# 3. infisical branch works too
write_shim infisical 'printf "%s\n" "POSTGRES_PASSWORD=x" "BAZ=qux"'
if run env SECRETS_PROVIDER=infisical bash "$SCRIPT" >/dev/null 2>&1 \
  && grep -q '^BAZ=qux$' "$work/.env"; then
  pass "renders .env from infisical provider"
else
  fail "renders .env from infisical provider"
fi

# 4. unknown provider: exits non-zero, leaves .env untouched, no temp file
echo "KEEP=1" > "$work/.env"
if run env SECRETS_PROVIDER=nope bash "$SCRIPT" >/dev/null 2>&1; then
  fail "unknown provider exits non-zero"
else
  pass "unknown provider exits non-zero"
  [ "$(cat "$work/.env")" = "KEEP=1" ] && pass "unknown provider leaves .env untouched" || fail "unknown provider leaves .env untouched"
  [ ! -e "$work/.env.tmp" ] && pass "unknown provider leaves no temp file" || fail "unknown provider leaves no temp file"
fi

# 5. provider failure: exits non-zero, leaves .env untouched
write_shim doppler 'exit 3'
echo "KEEP=2" > "$work/.env"
if run bash "$SCRIPT" >/dev/null 2>&1; then
  fail "provider failure exits non-zero"
else
  pass "provider failure exits non-zero"
  [ "$(cat "$work/.env")" = "KEEP=2" ] && pass "provider failure leaves .env untouched" || fail "provider failure leaves .env untouched"
fi

# 6. credentials are sourced from GMD_SECRETS_ENV
write_shim doppler 'printf "%s\n" "POSTGRES_PASSWORD=x" "TOKEN=$DOPPLER_TOKEN"'
printf 'DOPPLER_TOKEN=dp.test.123\n' > "$work/secrets.env"
if run env GMD_SECRETS_ENV="$work/secrets.env" bash "$SCRIPT" >/dev/null 2>&1 \
  && grep -q '^TOKEN=dp.test.123$' "$work/.env"; then
  pass "credentials sourced from GMD_SECRETS_ENV"
else
  fail "credentials sourced from GMD_SECRETS_ENV"
fi

# 7. reserved DOPPLER_* variables are filtered out of .env
write_shim doppler 'printf "%s\n" "POSTGRES_PASSWORD=x" "FOO=bar" "DOPPLER_PROJECT=xyz" "DOPPLER_CONFIG=prd" "DOPPLER_ENVIRONMENT=Production" "BAZ=qux"'
if run bash "$SCRIPT" >/dev/null 2>&1 \
  && [ "$(grep -c '^DOPPLER_' "$work/.env")" = "0" ] \
  && grep -q '^FOO=bar$' "$work/.env" && grep -q '^BAZ=qux$' "$work/.env"; then
  pass "reserved DOPPLER_* vars are filtered"
else
  fail "reserved DOPPLER_* vars are filtered"
fi

# 8. provider exits 0 with empty output: refuses to wipe .env
write_shim doppler 'true'
echo "KEEP=3" > "$work/.env"
if run bash "$SCRIPT" >/dev/null 2>&1; then
  fail "empty provider output exits non-zero"
else
  pass "empty provider output exits non-zero"
  [ "$(cat "$work/.env")" = "KEEP=3" ] && pass "empty provider output leaves .env untouched" || fail "empty provider output leaves .env untouched"
fi

# 9. provider output without POSTGRES_PASSWORD: refuses (wrong config / partial render)
write_shim doppler 'echo "SOME_OTHER_CONFIG=1"'
echo "KEEP=4" > "$work/.env"
if run bash "$SCRIPT" >/dev/null 2>&1; then
  fail "incomplete provider output exits non-zero"
else
  pass "incomplete provider output exits non-zero"
  [ "$(cat "$work/.env")" = "KEEP=4" ] && pass "incomplete provider output leaves .env untouched" || fail "incomplete provider output leaves .env untouched"
fi

if [ "$failures" -eq 0 ]; then
  echo "all tests passed"
else
  echo "$failures test(s) failed"
  exit 1
fi
