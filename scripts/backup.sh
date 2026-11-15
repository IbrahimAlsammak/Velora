#!/bin/sh
# Nightly backup of the shop (runs on the server, planned every night with cron):
#   - the database (products, orders, customers, settings) -> backups/db-DATE.sql.gz
#   - the uploaded photos                                   -> backups/uploads-DATE.tar.gz
#   - and a copy of the database is SENT TO YOUR TELEGRAM, so a copy is always OFF the server
# Keeps the last 14 days on the server.
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y-%m-%d-%H%M)
DB_FILE="backups/db-$STAMP.sql.gz"

docker compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --no-tablespaces velora' \
  | gzip > "$DB_FILE"
docker compose exec -T backend tar czf - -C /app/uploads . > "backups/uploads-$STAMP.tar.gz"

find backups -name '*.gz' -mtime +14 -delete
echo "Backup done: $DB_FILE and backups/uploads-$STAMP.tar.gz"

# Off-server copy: send the database file to the store owner's Telegram (if the bot is set up in .env)
TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2- || true)
CHAT=$(grep -E '^TELEGRAM_CHAT_ID=' .env | cut -d= -f2- || true)
if [ -n "$TOKEN" ] && [ -n "$CHAT" ]; then
  if curl -fsS -o /dev/null -F "chat_id=$CHAT" -F "document=@$DB_FILE" \
       -F "caption=Velora database backup $STAMP" "https://api.telegram.org/bot$TOKEN/sendDocument"; then
    echo "Database copy sent to Telegram."
  else
    echo "WARNING: could not send the database copy to Telegram." >&2
  fi
fi
