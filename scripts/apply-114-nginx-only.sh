#!/usr/bin/env bash
# root on 192.168.0.114: stop Nextcloud snap, Nginx + SmartPMS only
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "[1] Nextcloud snap stop/disable (free port 80)"
snap stop nextcloud 2>/dev/null || true
snap disable nextcloud 2>/dev/null || true
sleep 2
ss -tlnp | grep ":80 " || echo "port 80 free"

echo "[2] Stop ddzzang node processes"
pkill -u ddzzang -f "node dist/index.js" 2>/dev/null || true
sleep 1

echo "[3] Packages"
apt-get update -y || true
apt-get install -y nginx openssl curl ca-certificates
systemctl enable nginx

echo "[4] Node 22"
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=1
else
  V=$(node -v | sed 's/^v//;s/\..*//')
  if [[ "${V:-0}" -lt 20 ]]; then NEED_NODE=1; else NEED_NODE=0; fi
fi
if [[ "${NEED_NODE:-0}" -eq 1 ]]; then
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -y || true
  apt-get install -y nodejs
fi
corepack enable
corepack prepare pnpm@10.4.1 --activate

NODE_BACKEND_PORT=8090

echo "[5] /opt/smartpms"
mkdir -p /opt/smartpms
if [[ -d /home/ddzzang/smartpms ]]; then
  rsync -a --delete --exclude node_modules /home/ddzzang/smartpms/ /opt/smartpms/
fi
if [[ -f /home/ddzzang/smartpms/.env && ! -f /opt/smartpms/.env ]]; then
  cp /home/ddzzang/smartpms/.env /opt/smartpms/.env
fi
chown -R root:root /opt/smartpms

cat > /opt/smartpms/.env.deploy <<EOF
HOST=127.0.0.1
PORT=${NODE_BACKEND_PORT}
TRUST_PROXY=1
OAUTH_SERVER_URL=https://wbs.smartpms.net:5443
VITE_OAUTH_PORTAL_URL=https://wbs.smartpms.net:5443
EOF
chmod 0644 /opt/smartpms/.env.deploy

if [[ ! -f /opt/smartpms/.env ]]; then
  echo "ERROR: /opt/smartpms/.env missing"
  exit 1
fi

cd /opt/smartpms
find scripts/deploy -maxdepth 1 -name "*.sh" -exec sed -i "s/\r$//" {} \; 2>/dev/null || true
chmod +x scripts/deploy/generate-selfsigned-ssl.sh
cp -f .env.deploy .env.production.local
pnpm install --frozen-lockfile
pnpm run build

echo "[6] TLS"
export SMARTPMS_SSL_IP=192.168.0.114
bash /opt/smartpms/scripts/deploy/generate-selfsigned-ssl.sh

echo "[7] Nginx 5443"
cat > /etc/nginx/conf.d/smartpms-wbs.conf <<NGX
server {
    listen 5443 ssl http2;
    server_name wbs.smartpms.net;

    ssl_certificate     /etc/nginx/ssl/wbs.smartpms.net.crt;
    ssl_certificate_key /etc/nginx/ssl/wbs.smartpms.net.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:${NODE_BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
NGX
chmod 0644 /etc/nginx/conf.d/smartpms-wbs.conf

nginx -t
systemctl restart nginx

echo "[8] smartpms.service"
install -m 0644 /opt/smartpms/scripts/deploy/smartpms.service /etc/systemd/system/smartpms.service
systemctl daemon-reload
systemctl enable smartpms
systemctl restart smartpms

echo "[9] Done"
systemctl is-active nginx smartpms
ss -tlnp | grep -E ":80 |:5443|:8090" || true
curl -skI https://127.0.0.1:5443/ | head -5
