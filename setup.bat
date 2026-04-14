@echo off
chcp 65001 >nul
echo =====================================================
echo  SmartPMS 로컬 환경 설정 스크립트 (Windows)
echo =====================================================
echo.

REM ─── Node.js 버전 확인 ───
echo [1/5] Node.js 버전 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo        https://nodejs.org 에서 Node.js 22 LTS를 설치하세요.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo        Node.js %NODE_VER% 확인됨

REM ─── pnpm 확인 ───
echo [2/5] pnpm 확인 중...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo        pnpm이 없습니다. 설치 중...
    npm install -g pnpm
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
echo        pnpm %PNPM_VER% 확인됨

REM ─── .env 파일 복사 ───
echo [3/5] 환경 변수 파일 설정 중...
if not exist "smartpms\.env" (
    copy "env-files\.env.local.example" "smartpms\.env" >nul
    echo        .env 파일이 생성되었습니다.
    echo        [주의] smartpms\.env 파일을 열어 DATABASE_URL을 확인하세요.
) else (
    echo        .env 파일이 이미 존재합니다. 건너뜁니다.
)

REM ─── 의존성 설치 ───
echo [4/5] 패키지 의존성 설치 중...
cd smartpms
pnpm install
if %errorlevel% neq 0 (
    echo [오류] 의존성 설치에 실패했습니다.
    pause
    exit /b 1
)
cd ..
echo        의존성 설치 완료

REM ─── 완료 안내 ───
echo [5/5] 설정 완료!
echo.
echo =====================================================
echo  다음 단계:
echo  1. MySQL을 시작하고 DB를 초기화하세요.
echo     (Docker 사용 시: docker-compose up -d db)
echo  2. DB 초기화 후 아래 명령으로 앱을 실행하세요:
echo     cd smartpms
echo     pnpm dev
echo  3. 브라우저에서 http://localhost:3000 접속
echo =====================================================
echo.
pause
