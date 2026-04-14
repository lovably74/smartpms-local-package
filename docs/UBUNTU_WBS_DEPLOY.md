# Ubuntu 개발 서버 배포 (wbs.smartpms.net:5443)

## 구성 요약

| 구분 | 설명 |
|------|------|
| 브라우저 접속 | `https://wbs.smartpms.net:5443` (Nginx TLS, 사설 인증서) |
| Node(Express + 정적 + tRPC) | `127.0.0.1:8090` 만 수신 (외부에서 직접 8090 접속 불가 권장) |
| 리버스 프록시 | Nginx가 HTTPS 종료 후 `http://127.0.0.1:8090` 로 전달 (`8080`은 다른 서비스와 충돌 가능) |

PC의 `hosts` 또는 DNS에 `wbs.smartpms.net` → 서버 IP(예: `192.168.0.121`)를 등록해야 한다.

## DB 연결 (서버 자체 MariaDB)

서버에서 앱이 로컬 DB를 쓰는 경우 `/opt/smartpms/.env`에 **`DB_HOST=127.0.0.1`**(또는 동일 호스트의 DB)을 둔다.

배포 스크립트가 매번 로컬 PC의 `smartpms/.env`를 서버에 반영하면, 개발 PC용 `DB_HOST`(예: 사내망 `10.x.x.x`)가 올라가 **`journalctl -u smartpms`에 `connect ETIMEDOUT`**이 나고 목록/로그인 등 DB 조회가 실패한다.

**중요(재발 원인)**: 과거에는 `deploy-to-ubuntu.ps1`가 만든 **tar 안에 `smartpms/.env`가 포함**되어, 원격에서 `tar x` 할 때마다 `/opt/smartpms/.env`가 로컬 파일로 **덮어씌워졌다**. (`-UploadEnv`를 쓰지 않아도 동일)  
현재 스크립트는 **`smartpms/.env`, `.env.local`, `.env.production.local`을 tarball에서 제외**하고, 생성된 아카이브에 해당 경로가 없는지 **검증 후 실패**한다.

- 확인: `journalctl -u smartpms -n 50 --no-pager`
- 서버 DB 확인: `grep ^DB_HOST= /opt/smartpms/.env` (로컬 MariaDB면 `127.0.0.1`)
- 재발 방지: 아래 **`.env` 업로드 정책** 및 tarball 제외 규칙 준수

## 사설 SSL 인증서

- 생성 스크립트: `smartpms/scripts/deploy/generate-selfsigned-ssl.sh`
- 설치 위치: `/etc/nginx/ssl/wbs.smartpms.net.crt`, `/etc/nginx/ssl/wbs.smartpms.net.key`
- 최초 배포 시 `remote-install.sh`가 OpenSSL로 자동 생성한다.
- **재발급**: 서버에서 `REGENERATE_SSL=1 bash /opt/smartpms/scripts/deploy/generate-selfsigned-ssl.sh` 후 `nginx -t && systemctl reload nginx`
- **SAN**: 기본은 `DNS:wbs.smartpms.net`, `DNS:localhost`, `IP:127.0.0.1` 및 선택적으로 `SMARTPMS_SSL_IP`(예: `192.168.0.121`)로 IP 접속 시 이름 불일치 완화

브라우저는 사설 인증서에 대해 **경고**를 표시한다. 개발 PC에서 신뢰하려면 해당 `.crt`를 로컬 신뢰 저장소로 가져가면 된다(선택).

## Windows에서 자동 배포

프로젝트 루트에서:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-to-ubuntu.ps1
```

선택 매개변수: `-Server`, `-User`, `-KeyPath`, `-ProjectRoot`, `-RemotePath` (기본 `/opt/smartpms`).

### 개발 서버 반영(필수 운영 원칙)

본 저장소에서 **앱·프론트·백엔드 코드를 변경한 뒤에는 개발 서버 `192.168.0.114`에도 항상 동일 배포를 반영**한다. (기본: `-UploadEnv` 없이 서버 `/opt/smartpms/.env` 유지)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-to-ubuntu.ps1 -Server 192.168.0.114 -User root
```

배포 후 `grep ^DB_HOST= /opt/smartpms/.env`가 `127.0.0.1`인지 확인하는 것을 권장한다.

### `.env` 업로드 정책

- **기본**: 배포 tarball에 **`.env`를 넣지 않는다**(압축 해제 시 서버 기존 `/opt/smartpms/.env` 유지).
- **기본**: `-UploadEnv` 없이 **SCP로 `.env`를 올리지 않는다**.
- **최초 1회** 또는 서버 `.env`를 의도적으로 바꿀 때만 `-UploadEnv`를 지정한다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-to-ubuntu.ps1 -Server 192.168.0.114 -UploadEnv
```

동작: `smartpms` 소스 tar 압축(`.env` 제외·검증) → SCP → 원격에서 압축 해제 → `scripts/remote-bootstrap.sh` → `scripts/deploy/remote-install.sh` (OpenSSL 사설 인증서, Nginx, systemd, `pnpm install`, `pnpm build`).

## 서버 측 파일

| 경로 | 설명 |
|------|------|
| `/opt/smartpms/.env` | DB, JWT 등 비밀값 (수동 편집 또는 `-UploadEnv`로 최초 반영) |
| `/opt/smartpms/.env.deploy` | `HOST=127.0.0.1`, `PORT=8090`, `TRUST_PROXY=1`, 공개 URL `https://wbs.smartpms.net:5443` (`OAUTH_*`, `VITE_*`) — `env.deploy.example` 기준 |
| `/etc/nginx/conf.d/smartpms-wbs.conf` | `listen 5443 ssl http2`, `proxy_pass` → `127.0.0.1:8090` |
| `/etc/systemd/system/smartpms.service` | `EnvironmentFile`로 `.env`와 `.env.deploy` 로드 |

빌드 시 Vite가 `VITE_*`를 읽도록 `remote-install.sh`에서 `.env.deploy`를 `.env.production.local`로 복사한 뒤 `pnpm build` 한다. `.env`는 bash `source` 하지 않는다(테이블/특수문자 줄로 인한 오류 방지).

`TRUST_PROXY=1`이면 Nginx가 넘기는 `X-Forwarded-Proto: https`를 Express가 반영해 Secure 쿠키 등에 사용한다.

## apt 저장소 오류(Proxmox enterprise 401)

`apt-get update`가 enterprise 저장소 때문에 실패할 수 있다. `remote-install.sh`는 경고 후 계속하며, `nginx` 등 패키지 설치는 Debian 기본 미러로 진행된다. 근본 해결은 해당 저장소 비활성화 또는 구독 설정이다.

## 유용한 명령

```bash
systemctl status smartpms
journalctl -u smartpms -f
nginx -t && systemctl reload nginx
openssl x509 -in /etc/nginx/ssl/wbs.smartpms.net.crt -noout -subject -dates
```
