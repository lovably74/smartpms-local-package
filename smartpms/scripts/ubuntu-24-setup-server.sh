#!/usr/bin/env bash
# Ubuntu 24: Node 22, pnpm, 빌드 도구 준비 (앱 소스는 별도로 /opt/smartpms 등에 배치)
set -euo pipefail

SMARTPMS_ROOT="${SMARTPMS_ROOT:-/opt/smartpms}"

echo "[1/4] 패키지 업데이트 및 필수 도구"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git rsync

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  echo "[2/4] Node.js 22 (NodeSource)"
  install -d /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

echo "[3/4] pnpm (corepack)"
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.4.1 --activate
else
  npm install -g pnpm@10.4.1
fi

echo "Node: $(node -v)  pnpm: $(pnpm -v)"

if [[ -f "${SMARTPMS_ROOT}/package.json" ]]; then
  echo "[4/4] 의존성 설치 및 프로덕션 빌드: ${SMARTPMS_ROOT}"
  cd "${SMARTPMS_ROOT}"
  pnpm install --frozen-lockfile
  pnpm run build
  echo "완료. 실행 예: cd ${SMARTPMS_ROOT} && NODE_ENV=production HOST=0.0.0.0 PORT=3000 pnpm start"
  echo ".env 파일이 ${SMARTPMS_ROOT}/.env 에 있어야 합니다."
else
  echo "[4/4] 스킵: ${SMARTPMS_ROOT}/package.json 없음"
  echo "소스를 ${SMARTPMS_ROOT} 에 복사(git/rsync)한 뒤 이 스크립트를 다시 실행하거나, 해당 디렉터리에서 pnpm install && pnpm build 를 실행하세요."
fi
