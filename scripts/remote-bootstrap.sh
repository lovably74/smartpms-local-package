#!/usr/bin/env bash
set -euo pipefail
mkdir -p /opt
# tarball 에 smartpms/.env 를 넣지 않으므로, 기존 /opt/smartpms/.env(서버 DB·JWT)는 tar 로 덮어씌워지지 않는다.
# -UploadEnv 로만 /tmp/smartpms.env.upload 가 올 때 아래에서 반영한다.
tar -xzf /tmp/smartpms-deploy.tgz -C /opt
rm -f /tmp/smartpms-deploy.tgz
if [[ -f /tmp/smartpms.env.upload ]]; then
  mv /tmp/smartpms.env.upload /opt/smartpms/.env
fi
cd /opt/smartpms
sed -i 's/\r$//' scripts/deploy/remote-install.sh 2>/dev/null || true
chmod +x scripts/deploy/remote-install.sh
exec bash scripts/deploy/remote-install.sh
