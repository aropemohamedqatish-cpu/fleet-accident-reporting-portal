$ErrorActionPreference = 'Stop'

$healthUrl = $env:APP_HEALTH_URL
$recipient = $env:HEALTH_ALERT_TO
$sender = $env:HEALTH_ALERT_FROM
$smtpHost = $env:HEALTH_SMTP_HOST
$smtpPort = if ($env:HEALTH_SMTP_PORT) { [int]$env:HEALTH_SMTP_PORT } else { 587 }
$smtpUser = $env:HEALTH_SMTP_USER
$smtpPassword = $env:HEALTH_SMTP_PASSWORD
$statePath = Join-Path $PSScriptRoot 'health-state.json'

if (-not $healthUrl -or -not $recipient -or -not $sender -or -not $smtpHost -or -not $smtpUser -or -not $smtpPassword) {
  throw 'Configure APP_HEALTH_URL, HEALTH_ALERT_TO, HEALTH_ALERT_FROM, HEALTH_SMTP_HOST, HEALTH_SMTP_USER, and HEALTH_SMTP_PASSWORD.'
}

$wasHealthy = $null
if (Test-Path -LiteralPath $statePath) {
  try {
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $wasHealthy = [bool]$state.healthy
  } catch {
    throw "Health monitor state file is invalid: $statePath"
  }
}

$healthy = $false
$failureReason = 'Health endpoint returned an unhealthy response.'
try {
  $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
  $healthy = $response.status -eq 'ok'
} catch {
  $failureReason = 'Health endpoint could not be reached or returned an error.'
}

$subject = $null
$body = $null
if (-not $healthy -and $wasHealthy -ne $false) {
  $subject = '[تنبيه] تعذر الوصول إلى بوابة حوادث الأسطول'
  $body = "تعذر على مراقب الصحة الوصول إلى الخدمة.`r`nالرابط: $healthUrl`r`nالوقت: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')`r`nالسبب: $failureReason"
} elseif ($healthy -and $wasHealthy -eq $false) {
  $subject = '[استعادة] عادت بوابة حوادث الأسطول للعمل'
  $body = "عاد endpoint الصحة للاستجابة بنجاح.`r`nالرابط: $healthUrl`r`nالوقت: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
}

if ($subject) {
  $securePassword = ConvertTo-SecureString $smtpPassword -AsPlainText -Force
  $credential = [System.Management.Automation.PSCredential]::new($smtpUser, $securePassword)
  Send-MailMessage -SmtpServer $smtpHost -Port $smtpPort -UseSsl -Credential $credential `
    -From $sender -To $recipient -Subject $subject -Body $body -Encoding UTF8
}

@{ healthy = $healthy; checkedAt = (Get-Date).ToUniversalTime().ToString('o') } |
  ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8

if (-not $healthy) { exit 1 }
