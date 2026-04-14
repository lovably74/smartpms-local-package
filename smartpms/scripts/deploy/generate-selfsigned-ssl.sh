#!/usr/bin/env bash
# 사설 인증서 생성 (Nginx TLS 종료용). Debian/Ubuntu, OpenSSL 1.1.1+
set -euo pipefail

SSL_DIR="${SSL_DIR:-/etc/nginx/ssl}"
CN="${SMARTPMS_SSL_CN:-wbs.smartpms.net}"
KEY="${SSL_DIR}/${CN}.key"
CRT="${SSL_DIR}/${CN}.crt"
DAYS="${SMARTPMS_SSL_DAYS:-3650}"

mkdir -p "$SSL_DIR"
chmod 755 "$SSL_DIR"

if [[ -f "$KEY" && -f "$CRT" && "${REGENERATE_SSL:-0}" != "1" ]]; then
  echo "[ssl] 이미 존재: $CRT (재발급: REGENERATE_SSL=1)"
  exit 0
fi

# SAN: 브라우저 호환을 위해 DNS + 루프백 + 선택 LAN IP
SAN="DNS:${CN},DNS:localhost,IP:127.0.0.1"
if [[ -n "${SMARTPMS_SSL_IP:-}" ]]; then
  SAN="${SAN},IP:${SMARTPMS_SSL_IP}"
fi

openssl req -x509 -nodes -newkey rsa:2048 -days "$DAYS" \
  -keyout "$KEY" \
  -out "$CRT" \
  -subj "/CN=${CN}/O=SmartPMS-Dev/C=KR" \
  -addext "subjectAltName=${SAN}"

chmod 600 "$KEY"
chmod 644 "$CRT"
echo "[ssl] 생성 완료: $CRT"
