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

# 3. infisical branch works and forwards optional project/env/domain flags
write_shim infisical 'printf "%s\n" "POSTGRES_PASSWORD=x" "ARGS=$*" "BAZ=qux"'
if run env SECRETS_PROVIDER=infisical \
     INFISICAL_PROJECT_ID=proj-1 INFISICAL_ENV=prod INFISICAL_DOMAIN=https://infisical.example \
     bash "$SCRIPT" >/dev/null 2>&1 \
  && grep -q '^BAZ=qux$' "$work/.env" \
  && grep -q '^ARGS=export --format=dotenv --projectId proj-1 --env prod --domain https://infisical.example$' "$work/.env"; then
  pass "renders .env from infisical provider with optional flags"
else
  fail "renders .env from infisical provider with optional flags"
fi

# 4. unknown provider: exits non-zero, leaves .env untouched, no temp file
echo "KEEP=1" > "$work/.env"
if run env SECRETS_PROVIDER=nope bash "$SCRIPT" >/dev/null 2>&1; then
  fail "unknown provider exits non-zero"
else
  pass "unknown provider exits non-zero"
  [ "$(cat "$work/.env")" = "KEEP=1" ] && pass "unknown provider leaves .env untouched" || fail "unknown provider leaves .env untouched"
  if compgen -G "$work/.env.tmp*" > /dev/null; then
    fail "unknown provider leaves no temp file"
  else
    pass "unknown provider leaves no temp file"
  fi
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

# 10. temp file uses a unique mktemp name (no fixed .env.tmp collisions)
cat > "$work/bin/doppler" <<'SHIM'
#!/usr/bin/env bash
ls ./.env.tmp* | sed 's#^\./##' > "$SEEN_FILE"
printf "%s\n" "POSTGRES_PASSWORD=x" "FOO=bar"
SHIM
chmod +x "$work/bin/doppler"
if run env SEEN_FILE="$work/seen.txt" bash "$SCRIPT" >/dev/null 2>&1 \
  && grep -qE '^\.env\.tmp\.[A-Za-z0-9]{6,}$' "$work/seen.txt" \
  && ! grep -qx '\.env\.tmp' "$work/seen.txt"; then
  pass "temp file uses a unique mktemp name"
else
  fail "temp file uses a unique mktemp name"
fi

# 11. real doppler --format docker output shape is preserved verbatim (minus reserved vars)
cat > "$work/doppler-sample.env" <<'FIXTURE'
POSTGRES_PASSWORD=s3cret
DATASOURCE_URL=postgresql://le_xot:s3cret@postgres:5432/lists
CORS_ORIGINS=http://localhost:3000,https://le-xot.dev
JWT_SECRET="secret with spaces"
DOPPLER_PROJECT=games-movies-database
DOPPLER_CONFIG=prd
DOPPLER_ENVIRONMENT=Production
FIXTURE
cat > "$work/bin/doppler" <<'SHIM'
#!/usr/bin/env bash
cat "$SAMPLE"
SHIM
chmod +x "$work/bin/doppler"
grep -v '^DOPPLER_' "$work/doppler-sample.env" > "$work/expected.env"
if run env SAMPLE="$work/doppler-sample.env" bash "$SCRIPT" >/dev/null 2>&1 \
  && diff -q "$work/expected.env" "$work/.env" > /dev/null; then
  pass "provider output is preserved verbatim apart from reserved vars"
else
  fail "provider output is preserved verbatim apart from reserved vars"
fi

if [ "$failures" -eq 0 ]; then
  echo "all tests passed"
else
  echo "$failures test(s) failed"
  exit 1
fi
