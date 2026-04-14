# 192.168.0.114 — Nginx 전용, SmartPMS(HTTPS 5443)

## 현재 구성 요약

- **포트 80**: Apache(Nextcloud snap) 제거 후 **Nginx**만 사용.
- **Nextcloud snap**: `snap disable nextcloud` 로 중지·비활성화됨(다시 쓰려면 `snap enable nextcloud` 후 포트 충돌 주의).
- **SmartPMS**: `/opt/smartpms`, **Node `127.0.0.1:8090`**, **Nginx HTTPS `5443`** 프록시, **`smartpms.service`**.

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

## 이전 수동 절차 (참고)

`scripts/setup-114-root-sudo-nginx-https.sh` — ddzzang sudo, root 키 복제 등. 필요 시 별도 실행.

## 상태 확인

```bash
systemctl is-active nginx smartpms
ss -tlnp | grep -E ':80 |:5443|:8090'
curl -skI https://127.0.0.1:5443/
```
