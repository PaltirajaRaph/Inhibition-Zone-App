param(
    [switch]$SkipOpen,
    [switch]$SkipApiDeploy,
    [switch]$SkipBackend,
    [switch]$SkipAndroidSync,
    [switch]$SkipGradleBuild,
    [switch]$SkipXampp,
    [switch]$ForcePortCleanup
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardRoot = Resolve-Path (Join-Path $scriptDir '..')
$androidRoot = Join-Path $dashboardRoot 'android'
$backendScript = Join-Path $scriptDir 'backend-services.ps1'
$apiSource = Join-Path $dashboardRoot 'database\api'
$apiTarget = 'C:\xampp\htdocs\biotech-api'
$androidStudioJbr = 'C:\Program Files\Android\Android Studio\jbr'

function Write-Info {
    param([string]$Message)
    Write-Host "[run-all] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[run-all] $Message" -ForegroundColor Green
}

function Invoke-InDashboard {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Info $Label
    Push-Location $dashboardRoot
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            throw "$Label failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

function Invoke-InAndroid {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Info $Label
    Push-Location $androidRoot
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            throw "$Label failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

function Invoke-BackendScript {
    param(
        [string]$Label,
        [string[]]$Arguments
    )

    Write-Info $Label
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $backendScript @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

if (-not $SkipApiDeploy) {
    Write-Info 'Step 1/5: Deploy PHP API to XAMPP'
    if (-not (Test-Path $apiSource)) {
        throw "PHP API source folder not found: $apiSource"
    }

    robocopy $apiSource $apiTarget /MIR
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed with exit code $LASTEXITCODE"
    }
    $global:LASTEXITCODE = 0
} else {
    Write-Info 'Step 1/5 skipped: deploy PHP API'
}

if (-not $SkipBackend) {
    Write-Info 'Step 2/5: Start backend services'
    $backendArgs = @('start')
    if ($ForcePortCleanup) {
        $backendArgs += '-ForcePortCleanup'
    }
    if ($SkipXampp) {
        $backendArgs += '-SkipXampp'
    }

    Invoke-BackendScript 'Starting backend services' $backendArgs
    Invoke-BackendScript 'Checking backend health' @('status')
} else {
    Write-Info 'Step 2/5 skipped: backend services'
}

if (-not $SkipAndroidSync) {
    Invoke-InDashboard 'Step 3/5: Build web assets and sync Android' {
        npm.cmd run android:sync
    }
} else {
    Write-Info 'Step 3/5 skipped: Android sync'
}

if (-not $SkipGradleBuild) {
    if (Test-Path (Join-Path $androidStudioJbr 'bin\java.exe')) {
        $env:JAVA_HOME = $androidStudioJbr
        $env:Path = "$env:JAVA_HOME\bin;$env:Path"
        Write-Info "Using Gradle JDK: $env:JAVA_HOME"
    } else {
        Write-Info 'Android Studio bundled JDK not found; using current Java from PATH'
    }

    Invoke-InAndroid 'Step 4/5: Build Android debug APK' {
        .\gradlew.bat assembleDebug --no-daemon
    }
} else {
    Write-Info 'Step 4/5 skipped: Gradle build'
}

if (-not $SkipOpen) {
    Invoke-InDashboard 'Step 5/5: Open Android Studio project' {
        npx.cmd cap open android
    }
} else {
    Write-Info 'Step 5/5 skipped: open Android Studio'
}

Write-Ok 'Done. Selected run steps completed successfully.'
exit 0