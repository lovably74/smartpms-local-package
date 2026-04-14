#!/usr/bin/env bash
# Ubuntu 서버에서 실행: 소스는 이미 /opt/smartpms 에 압축 해제된 상태
set -euo pipefail

SMARTPMS_ROOT="${SMARTPMS_ROOT:-/opt/smartpms}"
cd "${SMARTPMS_ROOT}"

find scripts/deploy -maxdepth 1 -name '*.sh' -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

if [[ ! -f .env ]]; then
  echo "ERROR: ${SMARTPMS_ROOT}/.env 가 없습니다. DB·JWT 등을 설정한 뒤 다시 실행하세요."
  echo "예: env-files/.env.local.example 참고하여 생성"
  exit 1
fi

if [[ ! -f .env.deploy ]]; then
  cp scripts/deploy/env.deploy.example .env.deploy
  echo "Created .env.deploy from env.deploy.example — review URLs if needed."
fi

export DEBIAN_FRONTEND=noninteractive
# Proxmox 등 일부 저장소 오류 시에도 nginx 설치 시도
apt-get update -y || echo "[warn] apt-get update failed — continuing"
apt-get install -y nginx openssl

chmod +x scripts/deploy/generate-selfsigned-ssl.sh
# LAN에서 IP로 접속할 때도 인증서 경고를 줄이려면: SMARTPMS_SSL_IP=192.168.x.x
bash scripts/deploy/generate-selfsigned-ssl.sh

install -m 0644 scripts/deploy/nginx-wbs-smartpms.conf /etc/nginx/conf.d/smartpms-wbs.conf
nginx -t
systemctl reload nginx
systemctl enable nginx

install -m 0644 scripts/deploy/smartpms.service /etc/systemd/system/smartpms.service
systemctl daemon-reload

corepack enable 2>/dev/null || true
command -v pnpm >/dev/null || npm install -g pnpm@10.4.1

pnpm install --frozen-lockfile

# Vite production 빌드가 VITE_* 를 읽도록 (.env 는 bash source 하지 않음 — 테이블/특수문자 줄로 인한 오류 방지)
cp -f .env.deploy .env.production.local
pnpm run build

systemctl enable smartpms
systemctl restart smartpms

echo "OK: smartpms.service 및 Nginx(5443 HTTPS, 5080 HTTP) 적용됨. systemctl status smartpms"
