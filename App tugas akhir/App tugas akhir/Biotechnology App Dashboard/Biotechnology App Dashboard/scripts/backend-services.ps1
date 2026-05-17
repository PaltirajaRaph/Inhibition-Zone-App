param(
    [ValidateSet('start', 'stop', 'status', 'restart')]
    [string]$Action = 'start',
    [switch]$ForcePortCleanup,
    [switch]$SkipXampp
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardRoot = Resolve-Path (Join-Path $scriptDir '..')
$workspaceRoot = Resolve-Path (Join-Path $dashboardRoot '..\..')
$homographyDir = Join-Path $workspaceRoot 'homography'
$yoloDir = Join-Path $workspaceRoot 'yolo_service'
$statePath = Join-Path $scriptDir '.backend-services.json'

function Write-Info {
    param([string]$Message)
    Write-Host "[backend] $Message" -ForegroundColor Cyan
}

function Write-WarnText {
    param([string]$Message)
    Write-Host "[backend] $Message" -ForegroundColor Yellow
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[backend] $Message" -ForegroundColor Green
}

function Save-State {
    param($State)
    $json = $State | ConvertTo-Json -Depth 5
    Set-Content -Path $statePath -Value $json -Encoding UTF8
}

function Load-State {
    if (-not (Test-Path $statePath)) {
        return [pscustomobject]@{}
    }

    try {
        $raw = Get-Content -Path $statePath -Raw
        if (-not $raw) {
            return [pscustomobject]@{}
        }
        return ($raw | ConvertFrom-Json)
    } catch {
        Write-WarnText 'Failed to read backend state file. Ignoring old state.'
        return [pscustomobject]@{}
    }
}

function Remove-State {
    if (Test-Path $statePath) {
        Remove-Item -Path $statePath -Force
    }
}

function Test-ProcessAlive {
    param([int]$ProcessId)

    try {
        $null = Get-Process -Id $ProcessId -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Wait-Health {
    param(
        [string]$Name,
        [string]$Url,
        [int]$Retries = 20,
        [int]$DelayMs = 750
    )

    for ($i = 0; $i -lt $Retries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Ok "$Name healthy: $Url"
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds $DelayMs
        }
    }

    Write-WarnText "$Name health check failed: $Url"
    return $false
}

function Is-PortListening {
    param([int]$Port)

    $listeners = Get-ListeningPids -Port $Port
    return ($listeners.Count -gt 0)
}

function Get-ListeningPids {
    param([int]$Port)

    try {
        $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop
        if (-not $connections) {
            return @()
        }

        return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
    } catch {
        return @()
    }
}

function Stop-PortOwners {
    param([int]$Port)

    $owners = Get-ListeningPids -Port $Port
    foreach ($ownerPid in $owners) {
        try {
            if (Test-ProcessAlive -ProcessId ([int]$ownerPid)) {
                Write-WarnText "Stopping process on port $Port (PID $ownerPid)"
                Stop-Process -Id ([int]$ownerPid) -Force
            }
        } catch {
            Write-WarnText "Failed to stop PID $ownerPid on port $Port"
        }
    }
}

function Get-PythonCommand {
    param([string]$ServiceDir)

    $venvCandidates = @(
        (Join-Path $ServiceDir '.venv\Scripts\python.exe'),
        (Join-Path $ServiceDir '.venv-homography\Scripts\python.exe'),
        (Join-Path $ServiceDir '.venv-yolo\Scripts\python.exe')
    )

    foreach ($candidate in $venvCandidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return $python.Source
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return "$($py.Source) -3"
    }

    throw "Python was not found for service directory: $ServiceDir"
}

function Start-PythonService {
    param(
        [string]$Name,
        [string]$ServiceDir,
        [string]$HealthUrl,
        [int]$HealthRetries = 40,
        [int]$HealthDelayMs = 1000
    )

    if (-not (Test-Path $ServiceDir)) {
        throw "$Name directory not found: $ServiceDir"
    }

    $uri = [System.Uri]$HealthUrl
    $port = $uri.Port
    $listenersBeforeStart = Get-ListeningPids -Port $port

    if ($listenersBeforeStart.Count -gt 0) {
        if (Wait-Health -Name $Name -Url $HealthUrl -Retries 2 -DelayMs 250) {
            Write-WarnText "$Name already running on port $port. Reusing existing service."
            return @{
                pid = [int]$listenersBeforeStart[0]
                dir = $ServiceDir
                health = $HealthUrl
                healthy = $true
            }
        }

        if ($ForcePortCleanup) {
            Stop-PortOwners -Port $port
            Start-Sleep -Milliseconds 300
            $listenersBeforeStart = Get-ListeningPids -Port $port
            if ($listenersBeforeStart.Count -gt 0) {
                $pidListAfterCleanup = ($listenersBeforeStart -join ', ')
                throw "$Name port $port still occupied after force cleanup (PID: $pidListAfterCleanup)."
            }
        } else {
            $pidList = ($listenersBeforeStart -join ', ')
            throw "$Name port conflict on $port (PID: $pidList). Stop conflicting process and retry."
        }
    }

    $pythonCommand = Get-PythonCommand -ServiceDir $ServiceDir
    $exe = $pythonCommand
    $args = @('server.py')

    if ($pythonCommand.Contains(' -3')) {
        $exe = $pythonCommand.Split(' ')[0]
        $args = @('-3', 'server.py')
    }

    Write-Info "Starting $Name..."
    $process = Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory $ServiceDir -PassThru -WindowStyle Minimized
    Start-Sleep -Milliseconds 400

    $healthy = Wait-Health -Name $Name -Url $HealthUrl -Retries $HealthRetries -DelayMs $HealthDelayMs

    if (-not $healthy) {
        Write-WarnText "$Name process started but did not become healthy. Check logs or dependencies."
    }

    return @{
        pid = $process.Id
        dir = $ServiceDir
        health = $HealthUrl
        healthy = $healthy
    }
}

function Stop-PythonService {
    param(
        [string]$Name,
        $ServiceInfo
    )

    if (-not $ServiceInfo) {
        return
    }

    $servicePid = [int]($ServiceInfo.pid)
    if ($servicePid -le 0) {
        return
    }

    if (Test-ProcessAlive -ProcessId $servicePid) {
        Write-Info "Stopping $Name (PID $servicePid)..."
        Stop-Process -Id $servicePid -Force
        Write-Ok "$Name stopped"
    } else {
        Write-WarnText "$Name PID $servicePid is not running"
    }
}

function Start-XamppIfAvailable {
    $apacheBat = 'C:\xampp\apache_start.bat'
    $mysqlBat = 'C:\xampp\mysql_start.bat'

    # If API is already healthy, avoid unnecessary service restarts and extra popups.
    if (Wait-Health -Name 'PHP API' -Url 'http://localhost/biotech-api/health' -Retries 1 -DelayMs 1) {
        Write-WarnText 'PHP API already healthy. Skipping XAMPP start.'
        return
    }

    $apacheRunning = Is-PortListening -Port 80
    $mysqlRunning = Is-PortListening -Port 3306

    if ($apacheRunning) {
        Write-WarnText 'Apache already listening on port 80. Skipping Apache start.'
    } elseif (Test-Path $apacheBat) {
        Write-Info 'Starting XAMPP Apache...'
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$apacheBat`"" -WindowStyle Hidden
    } else {
        Write-WarnText 'Apache start script not found at C:\xampp\apache_start.bat'
    }

    if ($mysqlRunning) {
        Write-WarnText 'MySQL already listening on port 3306. Skipping MySQL start.'
    } elseif (Test-Path $mysqlBat) {
        Write-Info 'Starting XAMPP MySQL...'
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$mysqlBat`"" -WindowStyle Hidden
    } else {
        Write-WarnText 'MySQL start script not found at C:\xampp\mysql_start.bat'
    }

    $null = Wait-Health -Name 'PHP API' -Url 'http://localhost/biotech-api/health' -Retries 25 -DelayMs 800
}

function Stop-XamppIfAvailable {
    $apacheStopBat = 'C:\xampp\apache_stop.bat'
    $mysqlStopBat = 'C:\xampp\mysql_stop.bat'

    if (Test-Path $apacheStopBat) {
        Write-Info 'Stopping XAMPP Apache...'
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$apacheStopBat`"" -WindowStyle Hidden
    }

    if (Test-Path $mysqlStopBat) {
        Write-Info 'Stopping XAMPP MySQL...'
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$mysqlStopBat`"" -WindowStyle Hidden
    }
}

function Show-Status {
    $state = Load-State
    $stateProperties = @($state.PSObject.Properties)
    if ($stateProperties.Count -eq 0) {
        Write-WarnText 'No backend state found. Services may be stopped.'
    }

    $homographyPid = if ($state.homography) { [int]$state.homography.pid } else { 0 }
    $yoloPid = if ($state.yolo) { [int]$state.yolo.pid } else { 0 }

    if ($homographyPid -gt 0) {
        if (Test-ProcessAlive -ProcessId $homographyPid) {
            Write-Ok "Homography running (PID $homographyPid)"
        } else {
            Write-WarnText "Homography not running (expected PID $homographyPid)"
        }
    } else {
        Write-WarnText 'Homography not tracked'
    }

    if ($yoloPid -gt 0) {
        if (Test-ProcessAlive -ProcessId $yoloPid) {
            Write-Ok "YOLO running (PID $yoloPid)"
        } else {
            Write-WarnText "YOLO not running (expected PID $yoloPid)"
        }
    } else {
        Write-WarnText 'YOLO not tracked'
    }

    $apiHealthy = Wait-Health -Name 'PHP API' -Url 'http://localhost/biotech-api/health' -Retries 1 -DelayMs 1
    $hHealthy = Wait-Health -Name 'Homography' -Url 'http://localhost:8000/health' -Retries 1 -DelayMs 1
    $yHealthy = Wait-Health -Name 'YOLO' -Url 'http://localhost:9000/health' -Retries 1 -DelayMs 1

    if (-not ($apiHealthy -and $hHealthy -and $yHealthy)) {
        exit 1
    }
}

if ($Action -eq 'restart') {
    if ($SkipXampp) {
        & $PSCommandPath stop -SkipXampp
        & $PSCommandPath start -SkipXampp
    } else {
        & $PSCommandPath stop
        & $PSCommandPath start
    }
    exit $LASTEXITCODE
}

if ($Action -eq 'stop') {
    $state = Load-State
    Stop-PythonService -Name 'Homography' -ServiceInfo $state.homography
    Stop-PythonService -Name 'YOLO' -ServiceInfo $state.yolo
    if (-not $SkipXampp) {
        Stop-XamppIfAvailable
    } else {
        Write-WarnText 'SkipXampp enabled. Not stopping Apache/MySQL.'
    }
    Remove-State
    Write-Ok 'Backend stop command completed'
    exit 0
}

if ($Action -eq 'status') {
    Show-Status
    exit $LASTEXITCODE
}

# Start
$existingState = Load-State
$existingHomographyHealthy = Wait-Health -Name 'Homography' -Url 'http://localhost:8000/health' -Retries 1 -DelayMs 1
$existingYoloHealthy = Wait-Health -Name 'YOLO' -Url 'http://localhost:9000/health' -Retries 1 -DelayMs 1

if ($existingState.homography -and (Test-ProcessAlive -ProcessId ([int]$existingState.homography.pid)) -and
    $existingState.yolo -and (Test-ProcessAlive -ProcessId ([int]$existingState.yolo.pid)) -and
    $existingHomographyHealthy -and $existingYoloHealthy) {
    Write-WarnText 'Backend services already running. Use status or restart.'
    Show-Status
    exit 0
}

if (-not $SkipXampp) {
    Start-XamppIfAvailable
} else {
    Write-WarnText 'SkipXampp enabled. Not starting Apache/MySQL.'
}

$homography = Start-PythonService -Name 'Homography' -ServiceDir $homographyDir -HealthUrl 'http://localhost:8000/health' -HealthRetries 30 -HealthDelayMs 800
$yolo = Start-PythonService -Name 'YOLO' -ServiceDir $yoloDir -HealthUrl 'http://localhost:9000/health' -HealthRetries 150 -HealthDelayMs 1000

$state = @{
    startedAt = (Get-Date).ToString('s')
    homography = $homography
    yolo = $yolo
}
Save-State -State $state

Write-Ok 'All backend start commands finished'
Write-Info 'Run status with: npm.cmd run backend:status'
