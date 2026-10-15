#!/usr/bin/env bash
# Renders .env for docker compose from the configured secrets provider.
#
# Usage (from the docker compose project directory):
#   bash render-env.sh
#
# Providers: doppler (default), infisical.
# Credentials are read from $GMD_SECRETS_ENV (default ~/.config/gmd/secrets.env):
#   DOPPLER_TOKEN=...            # doppler service token (read-only, config prd)
#   INFISICAL_TOKEN=...          # for the infisical provider
#   SECRETS_PROVIDER=infisical   # optional provider override
#   INFISICAL_PROJECT_ID / INFISICAL_ENV / INFISICAL_DOMAIN  # optional infisical flags
#
# Fails closed: if the provider returns empty output or a set without
# POSTGRES_PASSWORD (required by docker-compose.yml), .env is left untouched.
set -euo pipefail

secrets_env="${GMD_SECRETS_ENV:-$HOME/.config/gmd/secrets.env}"
if [ -f "$secrets_env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$secrets_env"
  set +a
fi

provider="${SECRETS_PROVIDER:-doppler}"
tmp="$(mktemp ./.env.tmp.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

case "$provider" in
  doppler)
    doppler secrets download --no-file --format docker \
      | sed -E '/^DOPPLER_(PROJECT|CONFIG|ENVIRONMENT)=/d' > "$tmp"
    ;;
  infisical)
    infisical_args=(export --format=dotenv)
    if [ -n "${INFISICAL_PROJECT_ID:-}" ]; then
      infisical_args+=(--projectId "$INFISICAL_PROJECT_ID")
    fi
    if [ -n "${INFISICAL_ENV:-}" ]; then
      infisical_args+=(--env "$INFISICAL_ENV")
    fi
    if [ -n "${INFISICAL_DOMAIN:-}" ]; then
      infisical_args+=(--domain "$INFISICAL_DOMAIN")
    fi
    infisical "${infisical_args[@]}" > "$tmp"
    ;;
  *)
    echo "render-env.sh: unknown SECRETS_PROVIDER: $provider" >&2
    exit 1
    ;;
esac

if [ ! -s "$tmp" ] || ! grep -q '^POSTGRES_PASSWORD=' "$tmp"; then
  echo "render-env.sh: provider returned empty or incomplete secrets; .env left untouched" >&2
  exit 1
fi

mv "$tmp" .env
chmod 600 .env
echo "render-env.sh: .env rendered via $provider"
