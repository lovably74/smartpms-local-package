# Deploy SmartPMS to Ubuntu (SSH + tar + remote install)
# Requires: OpenSSH scp/ssh, tar (Windows 10+)
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\deploy-to-ubuntu.ps1

param(
    [string]$Server = "192.168.0.121",
    [string]$User = "root",
    [string]$KeyPath = "",
    [string]$ProjectRoot = "",
    [string]$RemotePath = "/opt/smartpms",
    # 기본값: 서버 /opt/smartpms/.env 를 덮어쓰지 않음(로컬 개발용 DB_HOST 등이 프로덕션 DB로 올라가 ETIMEDOUT 유발 방지).
    # 최초 배포나 .env 갱신이 필요할 때만 -UploadEnv 를 지정한다.
    [switch]$UploadEnv
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptDir)) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if ([string]::IsNullOrEmpty($ProjectRoot)) {
    $ProjectRoot = Split-Path -Parent $ScriptDir
}
if ([string]::IsNullOrEmpty($KeyPath)) {
    $KeyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519_smartpms_roit"
}

$SmartpmsDir = Join-Path $ProjectRoot "smartpms"
$Tarball = Join-Path $env:TEMP "smartpms-deploy.tgz"
$SshTarget = "${User}@${Server}"
$ScpOpts = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new")
$SshCmd = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new", $SshTarget)

if (-not (Test-Path $SmartpmsDir)) {
    Write-Error "smartpms folder not found: $SmartpmsDir"
}

if (-not (Test-Path $KeyPath)) {
    Write-Error "SSH key not found: $KeyPath"
}

Write-Host "[1/5] Creating archive (exclude node_modules, dist, .git, .env*)..."
if (Test-Path $Tarball) { Remove-Item $Tarball -Force }
Push-Location $ProjectRoot
try {
    # 로컬 smartpms/.env 가 tar 에 포함되면 원격 tar x 시 /opt/smartpms/.env 가 매번 덮어씌워져 DB_HOST 가 깨진다(ETIMEDOUT).
    # -UploadEnv 는 SCP 로만 반영하고, 일반 배포 tarball 에는 비밀·환경 파일을 넣지 않는다.
    & tar -czf $Tarball `
        --exclude=smartpms/node_modules `
        --exclude=smartpms/dist `
        --exclude=smartpms/.git `
        --exclude=smartpms/.env `
        --exclude=smartpms/.env.local `
        --exclude=smartpms/.env.production.local `
        smartpms
    if ($LASTEXITCODE -ne 0) { throw "tar failed" }
    $listOut = & tar -tzf $Tarball 2>&1
    if ($LASTEXITCODE -ne 0) { throw "tar -tzf failed: $listOut" }
    $listing = @($listOut | ForEach-Object { if ($_ -is [string]) { $_.TrimEnd("`r") } else { $_ } })
    $forbidden = @('smartpms/.env', 'smartpms/.env.local', 'smartpms/.env.production.local')
    foreach ($p in $forbidden) {
        if ($listing -contains $p) {
            throw "배포 tarball에 $p 가 포함되었습니다. 서버 DB 설정이 덮어씌워질 수 있어 중단했습니다."
        }
    }
} finally {
    Pop-Location
}

Write-Host "[2/5] Uploading tarball..."
& scp @ScpOpts $Tarball "${SshTarget}:/tmp/smartpms-deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp tarball failed" }

$envTmp = "/tmp/smartpms.env.upload"
if ($UploadEnv) {
    if (Test-Path (Join-Path $SmartpmsDir ".env")) {
        Write-Host "[3/5] Uploading .env from local smartpms/.env (-UploadEnv) ..."
        & scp @ScpOpts (Join-Path $SmartpmsDir ".env") "${SshTarget}:${envTmp}"
        if ($LASTEXITCODE -ne 0) { throw "scp .env failed" }
    } else {
        Write-Error "UploadEnv was set but smartpms/.env not found locally."
    }
} else {
    Write-Host "[3/5] Skipping .env upload (server keeps existing ${RemotePath}/.env). Use -UploadEnv to push local smartpms/.env once for initial setup."
}

Write-Host "[4/5] Remote extract + nginx + systemd + build ..."
$bootstrap = Join-Path $ScriptDir "remote-bootstrap.sh"
if (-not (Test-Path $bootstrap)) {
    Write-Error "bootstrap script not found: $bootstrap"
}
& scp @ScpOpts $bootstrap "${SshTarget}:/tmp/remote-bootstrap.sh"
if ($LASTEXITCODE -ne 0) { throw "scp bootstrap failed" }
& ssh @SshCmd "sed -i 's/\r$//' /tmp/remote-bootstrap.sh 2>/dev/null; chmod +x /tmp/remote-bootstrap.sh; exec bash /tmp/remote-bootstrap.sh"
if ($LASTEXITCODE -ne 0) { throw "remote install failed" }

Write-Host "[5/5] Done. Open https://wbs.smartpms.net:5443 or http://wbs.smartpms.net:5080 (Nginx). Node API: 127.0.0.1:8090 only."
