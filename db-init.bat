@echo off
chcp 65001 >nul
echo =====================================================
echo  SmartPMS DB 초기화 스크립트
echo  MySQL에 스키마 및 데이터를 가져옵니다.
echo =====================================================
echo.

REM ─── MySQL 연결 정보 ───
set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_NAME=smartpms

echo [주의] MySQL root 비밀번호를 입력해야 합니다.
echo        Docker Compose 사용 시 비밀번호: smartpms_root_pw
echo.

REM ─── DB 생성 ───
echo [1/3] 데이터베이스 생성 중...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo [오류] DB 생성에 실패했습니다. MySQL이 실행 중인지 확인하세요.
    pause
    exit /b 1
)
echo        데이터베이스 '%DB_NAME%' 생성 완료

REM ─── 사용자 생성 ───
echo [2/3] DB 사용자 생성 중...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p -e "CREATE USER IF NOT EXISTS 'smartpms_user'@'%%' IDENTIFIED BY 'smartpms_pass'; GRANT ALL PRIVILEGES ON smartpms.* TO 'smartpms_user'@'%%'; FLUSH PRIVILEGES;"
echo        사용자 'smartpms_user' 생성 완료

REM ─── 데이터 임포트 ───
echo [3/3] 스키마 및 데이터 임포트 중...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p %DB_NAME% < db\smartpms_data.sql
if %errorlevel% neq 0 (
    echo [오류] 데이터 임포트에 실패했습니다.
    pause
    exit /b 1
)
echo        데이터 임포트 완료!

echo.
echo =====================================================
echo  DB 초기화가 완료되었습니다.
echo  이제 start.bat 을 실행하여 앱을 시작하세요.
echo =====================================================
pause
