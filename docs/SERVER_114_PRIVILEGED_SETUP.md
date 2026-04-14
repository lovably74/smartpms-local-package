# 192.168.0.114 — Nginx 전용, SmartPMS(HTTPS 5443)

## 현재 구성 요약

- **포트 80**: Apache(Nextcloud snap) 제거 후 **Nginx**만 사용.
- **Nextcloud snap**: `snap disable nextcloud` 로 중지·비활성화됨(다시 쓰려면 `snap enable nextcloud` 후 포트 충돌 주의).
- **SmartPMS**: `/opt/smartpms`, **Node `127.0.0.1:8090`**, **Nginx HTTPS `5443`** 프록시, **`smartpms.service`**.
- **DB**: 개발서버 로컬 MariaDB(`127.0.0.1:3306`) 사용. 앱 `.env`의 `DB_HOST=127.0.0.1`, `DB_PORT=3306`.

## 접속

- `https://wbs.smartpms.net:5443` (DNS/hosts 필요, 사설 인증서 경고 가능)

## 재적용 스크립트 (root)

저장소의 `scripts/apply-114-nginx-only.sh` 를 서버에 올린 뒤:

```bash
sudo bash /tmp/apply-114-nginx-only.sh
```

(root SSH 예: `ssh -i ~/.ssh/id_ed25519_smartpms_roit root@192.168.0.114`)

- GPG 비대화식 오류 방지: NodeSource 키는 `gpg --batch --yes --dearmor` 사용.
- Ubuntu Nginx 1.24: `http2 on` 대신 **`listen 5443 ssl http2;`** (`smartpms/scripts/deploy/nginx-wbs-smartpms.conf` 와 동일).

## DB 이관 (원격 DB -> 개발서버 로컬 DB)

개발서버에서 원격 DB(10.10.10.30)가 직접 안 보일 때는 운영 PC에서 임시 TCP 프록시를 띄운 뒤 이관한다.

1) 운영 PC(Windows)에서 임시 프록시 실행 (`192.168.0.116:13306 -> 10.10.10.30:3306`)

2) 서버(114)에서 아래 스크립트 실행:

```bash
sudo bash /tmp/migrate-db-local-on-114.sh
```

스크립트 위치(저장소): `scripts/migrate-db-local-on-114.sh`

동작:
- 원격 DB 덤프 생성(`mysqldump`)
- 로컬 MariaDB로 복원
- `/opt/smartpms/.env`를 로컬 DB(`127.0.0.1:3306`)로 전환
- `mariadb`, `smartpms` 재시작

## 이전 수동 절차 (참고)

`scripts/setup-114-root-sudo-nginx-https.sh` — ddzzang sudo, root 키 복제 등. 필요 시 별도 실행.

## 상태 확인

```bash
systemctl is-active nginx smartpms
ss -tlnp | grep -E ':80 |:5443|:8090'
curl -skI https://127.0.0.1:5443/
```
