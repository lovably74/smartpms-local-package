# SmartPMS 로컬 PC 실행 가이드 (Windows)

> **요약**: 이 가이드는 SmartPMS WBS 수행관리 시스템을 Windows PC에서 로컬로 실행하는 방법을 단계별로 안내합니다. 두 가지 방법(Docker 사용 / 직접 설치)을 모두 설명하며, 초보자도 따라할 수 있도록 상세히 기술하였습니다.

---

## 패키지 구성

```
smartpms-local-package/
├── README-로컬실행가이드.md   ← 이 파일 (실행 가이드)
├── setup.bat                  ← 초기 설정 스크립트
├── start.bat                  ← 개발 서버 시작 스크립트
├── db-init.bat                ← DB 초기화 스크립트 (직접 설치 방식)
├── docker-compose.yml         ← Docker Compose 설정
├── db/
│   └── smartpms_data.sql      ← DB 스키마 + 전체 데이터 덤프
├── env-files/
│   └── .env.local.example     ← 환경 변수 설정 예시
└── smartpms/                  ← 소스 코드 전체
    ├── client/                ← React 프론트엔드
    ├── server/                ← Express + tRPC 백엔드
    ├── drizzle/               ← DB 스키마 및 마이그레이션
    ├── package.json
    └── pnpm-lock.yaml
```

---

## 방법 A: Docker Desktop 사용 (권장)

Docker를 사용하면 MySQL, Node.js 환경을 별도로 설치할 필요 없이 한 번에 실행할 수 있습니다.

### 사전 요구사항

| 소프트웨어 | 버전 | 다운로드 |
|---|---|---|
| Docker Desktop | 최신 버전 | https://www.docker.com/products/docker-desktop |
| Git (선택) | 최신 버전 | https://git-scm.com |

### 실행 절차

**1단계: Docker Desktop 설치 및 실행**

Docker Desktop을 설치한 후 실행합니다. 시스템 트레이에 고래 아이콘이 표시되면 준비 완료입니다.

**2단계: 패키지 압축 해제**

다운로드한 `smartpms-local-package.zip`을 원하는 폴더에 압축 해제합니다. 예: `C:\Projects\smartpms-local-package\`

**3단계: Docker Compose 실행**

Windows 탐색기에서 압축 해제 폴더를 열고, 주소창에 `cmd`를 입력하여 명령 프롬프트를 엽니다.

```bat
REM DB + 앱 동시 시작 (최초 실행 시 이미지 빌드로 5~10분 소요)
docker-compose up -d
```

**4단계: 접속 확인**

브라우저에서 `http://localhost:3000` 으로 접속합니다.

> **완료 상태**: SmartPMS 메인 화면이 표시되고, 왼쪽 사이드바에 프로젝트 목록이 보이면 성공입니다.

### Docker 관련 명령어

```bat
REM 서비스 중지
docker-compose down

REM 로그 확인
docker-compose logs -f app

REM DB만 재시작
docker-compose restart db

REM 전체 데이터 초기화 (주의: 데이터 삭제됨)
docker-compose down -v
docker-compose up -d
```

---

## 방법 B: 직접 설치 (Node.js + MySQL)

Docker 없이 Node.js와 MySQL을 직접 설치하여 실행하는 방법입니다.

### 사전 요구사항

| 소프트웨어 | 버전 | 다운로드 |
|---|---|---|
| Node.js | 22 LTS 이상 | https://nodejs.org |
| MySQL | 8.0 이상 | https://dev.mysql.com/downloads/mysql/ |
| MySQL Workbench (선택) | 최신 버전 | https://dev.mysql.com/downloads/workbench/ |

### 실행 절차

**1단계: Node.js 설치**

[nodejs.org](https://nodejs.org)에서 **22 LTS** 버전을 다운로드하여 설치합니다. 설치 완료 후 명령 프롬프트에서 확인합니다.

```bat
node --version
REM 출력 예: v22.x.x
```

**2단계: MySQL 8.0 설치**

MySQL Installer를 사용하여 MySQL Server 8.0을 설치합니다. 설치 중 root 비밀번호를 설정하고 기억해 두세요.

**3단계: 패키지 압축 해제**

다운로드한 `smartpms-local-package.zip`을 `C:\Projects\smartpms-local-package\` 에 압축 해제합니다.

**4단계: 초기 설정 스크립트 실행**

`setup.bat`을 더블클릭하거나 명령 프롬프트에서 실행합니다.

```bat
cd C:\Projects\smartpms-local-package
setup.bat
```

이 스크립트는 다음을 자동으로 수행합니다.
- Node.js 및 pnpm 버전 확인
- `.env` 파일 생성 (`env-files\.env.local.example` 복사)
- `pnpm install` 로 의존성 설치

**5단계: DB 초기화**

```bat
db-init.bat
```

MySQL root 비밀번호를 입력하면 다음이 자동 실행됩니다.
- `smartpms` 데이터베이스 생성
- `smartpms_user` 계정 생성
- 스키마 및 전체 데이터 임포트 (108개 테스크, 36개 액티비티 등)

**6단계: 환경 변수 확인**

`smartpms\.env` 파일을 메모장으로 열어 `DATABASE_URL`이 올바른지 확인합니다.

```
DATABASE_URL=mysql://smartpms_user:smartpms_pass@localhost:3306/smartpms
```

**7단계: 개발 서버 시작**

```bat
start.bat
```

또는 직접 실행:

```bat
cd smartpms
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속합니다.

> **완료 상태**: 터미널에 `Server running on http://localhost:3000/` 메시지가 표시되고, 브라우저에서 SmartPMS 화면이 열리면 성공입니다.

---

## 로컬 환경 제한 사항

로컬 환경에서는 Manus 플랫폼 전용 기능 일부가 비활성화됩니다.

| 기능 | 로컬 상태 | 비고 |
|---|---|---|
| WBS 그리드/간트 뷰 | 정상 작동 | |
| 진행률 입력/롤업 | 정상 작동 | |
| 이슈 관리 | 정상 작동 | |
| 인라인 편집 (추가/수정/삭제) | 정상 작동 | |
| 파일 업로드 (S3) | **비활성화** | Manus S3 스토리지 필요 |
| 이메일/SMS 알림 | **비활성화** | Manus 알림 API 필요 |
| Manus OAuth 로그인 | **비활성화** | 로컬 우회 모드 사용 |
| AI 기능 | **비활성화** | Manus LLM API 필요 |

### 로컬 로그인 방법

Manus OAuth가 비활성화되어 있으므로, 로컬에서는 **직접 DB에 사용자를 추가**하거나 코드에서 임시 인증을 우회해야 합니다. 아래 SQL로 테스트 사용자를 추가할 수 있습니다.

```sql
-- MySQL Workbench 또는 명령줄에서 실행
USE smartpms;

INSERT INTO users (openId, name, email, role, createdAt, updatedAt)
VALUES ('local-test-user', '테스트관리자', 'admin@local.dev', 'admin', NOW(), NOW());
```

---

## 문제 해결

**Q: `pnpm: command not found` 오류가 발생합니다.**

```bat
npm install -g pnpm
```

**Q: MySQL 연결 오류 (`ECONNREFUSED`)가 발생합니다.**

MySQL 서비스가 실행 중인지 확인합니다.
```bat
REM Windows 서비스 확인
net start MySQL80
```

**Q: 포트 3000이 이미 사용 중입니다.**

`smartpms\.env` 파일에서 포트를 변경하거나, 기존 프로세스를 종료합니다.
```bat
netstat -ano | findstr :3000
taskkill /PID [프로세스ID] /F
```

**Q: Docker 빌드 중 오류가 발생합니다.**

```bat
REM 캐시 없이 재빌드
docker-compose build --no-cache
docker-compose up -d
```

---

## 방법 비교

| 항목 | Docker 방식 | 직접 설치 방식 |
|---|---|---|
| 설치 난이도 | 낮음 (Docker만 설치) | 중간 (Node.js + MySQL 설치) |
| 실행 속도 | 최초 빌드 5~10분 | 빠름 |
| 환경 격리 | 완전 격리 | PC 환경에 의존 |
| 권장 대상 | 빠른 테스트, 팀 공유 | 장기 개발, 디버깅 |

---

*이 가이드는 SmartPMS v81dd8214 기준으로 작성되었습니다.*
