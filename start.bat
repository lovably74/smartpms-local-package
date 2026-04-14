@echo off
chcp 65001 >nul
echo =====================================================
echo  SmartPMS 개발 서버 시작
echo =====================================================
echo.
echo  브라우저에서 http://localhost:3000 으로 접속하세요.
echo  종료하려면 Ctrl+C 를 누르세요.
echo.
cd smartpms
pnpm dev
