#!/usr/bin/env bash
# root@192.168.0.114 에서 실행: 원격 DB를 덤프해 로컬 MariaDB로 이관
set -euo pipefail

SRC_HOST="${SRC_HOST:-192.168.0.116}"
SRC_PORT="${SRC_PORT:-13306}"
APP_ENV="${APP_ENV:-/opt/smartpms/.env}"
APP_DIR="${APP_DIR:-/opt/smartpms}"

if [[ ! -f "$APP_ENV" ]]; then
  echo "ENV file not found: $APP_ENV" >&2
  exit 1
fi

read_kv() {
  local key="$1"
  grep -E "^${key}=" "$APP_ENV" | sed "s/^${key}=//"
}

DB_USER="$(read_kv DB_USER)"
DB_PASS="$(read_kv DB_PASSWORD)"
DB_NAME="$(read_kv DB_NAME)"

if [[ -z "$DB_USER" || -z "$DB_NAME" ]]; then
  echo "DB_USER or DB_NAME missing in $APP_ENV" >&2
  exit 1
fi

echo "[1/6] 소스 DB 연결 확인: ${SRC_HOST}:${SRC_PORT}/${DB_NAME}"
mysql --connect-timeout=8 --protocol=tcp -h "$SRC_HOST" -P "$SRC_PORT" -u "$DB_USER" -p"$DB_PASS" -D "$DB_NAME" -e "SELECT 1;" >/dev/null

echo "[2/6] 덤프 생성"
DUMP_GZ="/root/${DB_NAME}_from_proxy_$(date +%Y%m%d%H%M%S).sql.gz"
mysqldump --single-transaction --quick --routines --triggers --events --protocol=tcp \
  -h "$SRC_HOST" -P "$SRC_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip -9 > "$DUMP_GZ"
ls -lh "$DUMP_GZ"

echo "[3/6] 로컬 MariaDB 복원"
mysql -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;"
mysql -e "CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';"
mysql -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
gunzip -c "$DUMP_GZ" | mysql "$DB_NAME"

echo "[4/6] 앱 환경 로컬 DB로 전환"
cp "$APP_ENV" "${APP_ENV}.bak.$(date +%Y%m%d%H%M%S)"
sed -i 's/^DATABASE_URL=.*/DATABASE_URL=/' "$APP_ENV"
sed -i 's/^DB_HOST=.*/DB_HOST=127.0.0.1/' "$APP_ENV"
sed -i 's/^DB_PORT=.*/DB_PORT=3306/' "$APP_ENV"

echo "[5/6] 서비스 재기동"
systemctl restart mariadb
systemctl restart smartpms
sleep 2

echo "[6/6] 검증"
mysql --protocol=tcp -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" \
  -e "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema='${DB_NAME}';"
curl -skI https://127.0.0.1:5443/ | sed -n '1,5p'
echo "MIGRATION_DONE"
