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
set -euo pipefail

secrets_env="${GMD_SECRETS_ENV:-$HOME/.config/gmd/secrets.env}"
if [ -f "$secrets_env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$secrets_env"
  set +a
fi

provider="${SECRETS_PROVIDER:-doppler}"
tmp=".env.tmp"
trap 'rm -f "$tmp"' EXIT

case "$provider" in
  doppler)
    doppler secrets download --no-file --format docker \
      | sed -E '/^DOPPLER_(PROJECT|CONFIG|ENVIRONMENT)=/d' > "$tmp"
    ;;
  infisical)
    infisical export --format=dotenv > "$tmp"
    ;;
  *)
    echo "render-env.sh: unknown SECRETS_PROVIDER: $provider" >&2
    exit 1
    ;;
esac

mv "$tmp" .env
chmod 600 .env
echo "render-env.sh: .env rendered via $provider"
