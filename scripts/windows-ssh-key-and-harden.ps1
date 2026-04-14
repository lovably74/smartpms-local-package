# Requires: OpenSSH Client (Windows optional feature)
# Run in PowerShell. You will enter root password once when ssh asks.
# Open a second terminal and test key login BEFORE disabling password auth.

$ErrorActionPreference = "Stop"
$Server = "192.168.0.121"
$User = "root"
$SshDir = Join-Path $env:USERPROFILE ".ssh"
$KeyPath = Join-Path $SshDir "id_ed25519_smartpms_roit"

if (-not (Test-Path $SshDir)) {
    New-Item -ItemType Directory -Path $SshDir -Force | Out-Null
}

if (-not (Test-Path $KeyPath)) {
    ssh-keygen -t ed25519 -f $KeyPath -N '""' -C "smartpms-roit"
}

$Pub = "$KeyPath.pub"
Get-Content -Raw $Pub | ssh "${User}@${Server}" "umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh; touch ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; cat >> ~/.ssh/authorized_keys"

Write-Host ""
Write-Host "NEXT: New PowerShell window, test:"
Write-Host "  ssh -i `"$KeyPath`" ${User}@${Server}"
Write-Host "If that works without password, on the SERVER run sshd hardening (see block below)."
Write-Host ""

# --- On SERVER as root, after key login works:
# cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d%H%M%S)
# sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
# sed -i 's/^#\?KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config
# grep -q '^PubkeyAuthentication' /etc/ssh/sshd_config || echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config
# sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
# sshd -t && systemctl reload ssh
#
# Client ~/.ssh/config (optional):
# Host roit
#   HostName 192.168.0.121
#   User root
#   IdentityFile ~/.ssh/id_ed25519_smartpms_roit
