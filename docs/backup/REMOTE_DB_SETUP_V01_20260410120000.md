# SmartPMS Remote MariaDB Setup

## 목적
- SmartPMS를 로컬 PC에서 실행할 때 원격 MariaDB 서버 `10.10.10.30`의 `smartpms` 데이터베이스를 사용한다.
- 애플리케이션 계정은 `smartcon`을 사용한다.

## 적용 파일
- `smartpms/.env`
- `env-files/.env.local.example`
- `smartpms/server/_core/env.ts`
- `smartpms/server/db.ts`

## 환경 변수 설정
`smartpms/.env` 파일에서 아래 값을 사용한다.

```env
DATABASE_URL=
DB_HOST=10.10.10.30
DB_PORT=3306
DB_USER=smartcon
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=smartpms
```

## 동작 우선순위
- `DATABASE_URL` 값이 비어있지 않으면 해당 값을 사용한다.
- `DATABASE_URL` 값이 비어있으면 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` 조합으로 연결 문자열을 생성한다.

## 검증 절차
1. `smartpms/.env`에 `DB_PASSWORD`를 실제 비밀번호로 입력한다.
2. `smartpms` 디렉터리에서 테스트를 실행한다.
3. 개발 서버 실행 후 `http://localhost:3000` 접속 시 프로젝트 목록이 조회되는지 확인한다.

## 참고
- 비밀번호는 저장소에 커밋하지 않는다.
- 원격 DB 방화벽/접근제어에서 개발 PC IP 허용이 필요할 수 있다.
