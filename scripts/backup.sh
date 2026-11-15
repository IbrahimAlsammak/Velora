#!/bin/sh
# Daily backup of the shop (run on the server, from the project folder or anywhere):
#   - the database (products, orders, customers, settings) -> backups/db-DATE.sql.gz
#   - the uploaded photos                                   -> backups/uploads-DATE.tar.gz
# Keeps the last 14 days. Planned to run every night automatically (cron).
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y-%m-%d-%H%M)

docker compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --no-tablespaces velora' \
  | gzip > "backups/db-$STAMP.sql.gz"
docker compose exec -T backend tar czf - -C /app/uploads . > "backups/uploads-$STAMP.tar.gz"

find backups -name '*.gz' -mtime +14 -delete
echo "Backup done: backups/db-$STAMP.sql.gz and backups/uploads-$STAMP.tar.gz"
