param(
    [switch]$SkipOpen
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardRoot = Resolve-Path (Join-Path $scriptDir '..')

function Write-Info {
    param([string]$Message)
    Write-Host "[android-daily] $Message" -ForegroundColor Cyan
}

function Invoke-NpmScript {
    param([string]$ScriptName)

    Write-Info "Running npm script: $ScriptName"
    Push-Location $dashboardRoot
    try {
        npm.cmd run $ScriptName
        if ($LASTEXITCODE -ne 0) {
            throw "npm script failed: $ScriptName"
        }
    } finally {
        Pop-Location
    }
}

Write-Info 'Step 1/3: Start backend (without touching XAMPP, force-clean conflicting ports)'
Invoke-NpmScript 'backend:start:noxampp:force'

Write-Info 'Step 2/3: Build and sync Android assets'
Invoke-NpmScript 'android:sync'

if ($SkipOpen) {
    Write-Info 'Step 3/3 skipped: open Android Studio'
    Write-Host '[android-daily] Done. Open Android Studio manually when needed.' -ForegroundColor Green
    exit 0
}

Write-Info 'Step 3/3: Open Android Studio project'
Push-Location $dashboardRoot
try {
    npx cap open android
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to open Android Studio project'
    }
} finally {
    Pop-Location
}

Write-Host '[android-daily] Done. Backend running, assets synced, Android Studio opened.' -ForegroundColor Green
