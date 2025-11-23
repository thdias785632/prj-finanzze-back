#!/usr/bin/env bash
ENV_FILE=".env"

if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not found. Install: npm i -g @railway/cli or see https://railway.app/"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE not found"
  exit 1
fi

set -o errexit
set -o nounset

while IFS= read -r line || [ -n "$line" ]; do
  line="$(echo "$line" | sed -e 's/^[[:space:]]*//')"
  if [ -z "$line" ] || [[ "$line" == \#* ]]; then
    continue
  fi
  key=$(printf "%s" "$line" | cut -d '=' -f 1)
  value=$(printf "%s" "$line" | cut -d '=' -f 2-)
  echo "Setting $key"
  railway variables set "$key" "$value"
done < "$ENV_FILE"
