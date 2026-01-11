#!/bin/sh
set -eu

status="${STATUS:-}"
if [ -z "$status" ]; then
  echo "STATUS is not set"
  exit 1
fi

if [ -n "${CI_COMMIT_TAG:-}" ]; then
  version="$CI_COMMIT_TAG"
else
  version="${CI_COMMIT_SHORT_SHA:-unknown}"
fi

case "$status" in
  success) icon="✅"; label="Deploy success" ;;
  failure) icon="❌"; label="Deploy failed" ;;
  *)
    echo "Unknown STATUS: $status"
    exit 1
    ;;
esac

text="$(printf "%s *%s*\n*Project:* %s\n*Version:* %s\n*Pipeline:* %s" \
  "$icon" "$label" "${CI_PROJECT_NAME}" "$version" "${CI_PIPELINE_URL}")"

curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${text}" \
  -d "parse_mode=Markdown"
