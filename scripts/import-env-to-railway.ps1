Param(
  [string]$EnvFile = ".env"
)

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  Write-Error "railway CLI not found. Install it from https://railway.app/ or via npm: npm i -g @railway/cli"
  exit 1
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "Env file '$EnvFile' not found."
  exit 1
}

Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $pair = $line -split "=", 2
  if ($pair.Count -lt 2) { return }
  $key = $pair[0].Trim()
  $value = $pair[1].Trim()
  # If value contains spaces or special chars, keep them
  Write-Host "Setting variable: $key"
  railway variables set $key "$value"
}
