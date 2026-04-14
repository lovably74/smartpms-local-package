#!/usr/bin/env bash
# Run ONCE on server: sudo bash setup-114-root-sudo-nginx-https.sh
# Configures: ddzzang NOPASSWD sudo, root SSH (key), Nginx HTTPS :5443, SmartPMS in /opt
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "root privileges required: sudo bash $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
SMARTPMS_IP="${SMARTPMS_IP:-192.168.0.114}"
NODE_BACKEND_PORT="${NODE_BACKEND_PORT:-8090}"

echo "[1/8] ddzzang: passwordless sudo"
if ! id -nG ddzzang | grep -qw sudo; then
  usermod -aG sudo ddzzang
fi
printf '%s\n' 'ddzzang ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/ddzzang-nopasswd
chmod 0440 /etc/sudoers.d/ddzzang-nopasswd

echo "[2/8] root: SSH authorized_keys (same keys as ddzzang)"
install -d -m 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
if [[ -f /home/ddzzang/.ssh/authorized_keys ]]; then
  while IFS= read -r line || [[ -n "${line:-}" ]]; do
    [[ -z "${line// }" || "$line" =~ ^# ]] && continue
    grep -qxF "$line" /root/.ssh/authorized_keys 2>/dev/null || echo "$line" >> /root/.ssh/authorized_keys
  done < /home/ddzzang/.ssh/authorized_keys
fi

echo "[3/8] sshd: PermitRootLogin prohibit-password (key only)"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
grep -q '^PubkeyAuthentication' /etc/ssh/sshd_config || echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config
sshd -t
systemctl reload ssh

echo "[4/8] packages: nginx openssl curl"
apt-get update -y || true
apt-get install -y nginx openssl curl ca-certificates gnupg

echo "[5/8] Node.js 22 (system /usr/bin/node for systemd)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//;s/\..*//')" -lt 20 ]]; then
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -y || true
  apt-get install -y nodejs
fi
corepack enable 2>/dev/null || true
corepack prepare pnpm@10.4.1 --activate

echo "[6/8] SmartPMS -> /opt/smartpms"
pkill -u ddzzang -f "node dist/index.js" 2>/dev/null || true
sleep 1
mkdir -p /opt/smartpms
if [[ -d /home/ddzzang/smartpms ]]; then
  rsync -a --delete --exclude node_modules /home/ddzzang/smartpms/ /opt/smartpms/
fi
if [[ -f /home/ddzzang/smartpms/.env && ! -f /opt/smartpms/.env ]]; then
  cp /home/ddzzang/smartpms/.env /opt/smartpms/.env
fi
chown -R root:root /opt/smartpms

cat > /opt/smartpms/.env.deploy <<ENVEOF
HOST=127.0.0.1
PORT=${NODE_BACKEND_PORT}
TRUST_PROXY=1
OAUTH_SERVER_URL=https://wbs.smartpms.net:5443
VITE_OAUTH_PORTAL_URL=https://wbs.smartpms.net:5443
ENVEOF
chmod 0644 /opt/smartpms/.env.deploy

if [[ ! -f /opt/smartpms/.env ]]; then
  echo "ERROR: /opt/smartpms/.env missing. Place DB secrets in /opt/smartpms/.env then re-run."
  exit 1
fi

cd /opt/smartpms
find scripts/deploy -maxdepth 1 -name '*.sh' -exec sed -i 's/\r$//' {} \; 2>/dev/null || true
chmod +x scripts/deploy/generate-selfsigned-ssl.sh
cp -f .env.deploy .env.production.local
pnpm install --frozen-lockfile
pnpm run build

echo "[7/8] TLS + Nginx :5443 -> 127.0.0.1:${NODE_BACKEND_PORT}"
export SMARTPMS_SSL_IP="${SMARTPMS_IP}"
bash /opt/smartpms/scripts/deploy/generate-selfsigned-ssl.sh

cat > /etc/nginx/conf.d/smartpms-wbs.conf <<NGXEOF
server {
    listen 5443 ssl;
    http2 on;
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
NGXEOF
chmod 0644 /etc/nginx/conf.d/smartpms-wbs.conf

nginx -t
systemctl enable nginx
systemctl reload nginx

install -m 0644 /opt/smartpms/scripts/deploy/smartpms.service /etc/systemd/system/smartpms.service
systemctl daemon-reload
systemctl enable smartpms
systemctl restart smartpms

echo "[8/8] Done."
systemctl is-active smartpms nginx ssh
ss -tlnp | grep -E ":5443|:${NODE_BACKEND_PORT}" || true
