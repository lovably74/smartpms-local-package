# 192.168.0.114 — root SSH, ddzzang sudo, Nginx HTTPS(5443)

이 환경에서는 **원격에서 `sudo` 비밀번호를 대신 입력할 수 없으므로**, 아래 **한 번만** 서버 콘솔 또는 SSH 세션에서 실행해야 한다.

## 사전 조건

- `ddzzang` 계정으로 SSH 가능(공개키 등록됨)
- `~/smartpms` 에 앱이 있고 **`.env`(DB 등)** 가 있음
- 배포 스크립트가 홈 디렉터리에 업로드됨: `~/setup-114-root-sudo-nginx-https.sh`

## 실행 (비밀번호 1회)

로컬 PC PowerShell 또는 터미널:

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_smartpms_roit" ddzzang@192.168.0.114
```

접속 후:

```bash
sudo bash ~/setup-114-root-sudo-nginx-https.sh
```

`ddzzang` 비밀번호를 물으면 입력한다.

## 스크립트가 하는 일

1. **`ddzzang`** 에 **비밀번호 없이 sudo** (`/etc/sudoers.d/ddzzang-nopasswd`)
2. **`root`** 의 `~/.ssh/authorized_keys` 에 **ddzzang과 동일한 공개키** 복사 → **root SSH는 공개키만** (`PermitRootLogin prohibit-password`)
3. **OpenSSH** 재로드
4. **Node.js 22**, **pnpm**, **Nginx**, **openssl** 설치
5. **`/home/ddzzang/smartpms`** → **`/opt/smartpms`** 로 반영(`node_modules` 제외 후 `pnpm install` / `pnpm build`)
6. **사설 TLS** (`/etc/nginx/ssl/`), **Nginx `5443` → `127.0.0.1:8090`** (내부 Node; 8080 점유 회피)
7. **`smartpms.service`** (systemd) 활성화

## 접속 URL

- 브라우저: `https://wbs.smartpmis.net:5443` (사설 인증서 경고 가능)
- 공개 URL/OAuth는 `.env.deploy` 기준 `https://wbs.smartpmis.net:5443`

## 이후 root로 SSH

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_smartpms_roit" root@192.168.0.114
```

## 스크립트 위치 (저장소)

`scripts/setup-114-root-sudo-nginx-https.sh`

서버에 다시 올릴 때:

```powershell
scp -i "$env:USERPROFILE\.ssh\id_ed25519_smartpms_roit" `
  "h:\projects\smartpms-local-package\scripts\setup-114-root-sudo-nginx-https.sh" `
  ddzzang@192.168.0.114:~/
```
