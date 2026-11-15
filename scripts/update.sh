#!/bin/sh
# Puts the newest version of the shop online (run on the server):
#   1. backup first (database + photos), for safety
#   2. download the new code from GitHub
#   3. rebuild the Docker boxes and restart them (the database and photos are kept)
# Usage:  ./scripts/update.sh
set -eu
cd "$(dirname "$0")/.."

echo "== 1/3 Backup =="
./scripts/backup.sh

echo "== 2/3 New code from GitHub =="
git pull --ff-only

echo "== 3/3 Rebuild and restart =="
docker compose up -d --build
docker image prune -f > /dev/null   # remove old, unused boxes to keep the disk tidy

echo "Done - the new version is online."
