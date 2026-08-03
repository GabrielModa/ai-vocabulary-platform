[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$workerRoot = Join-Path $root "services\image-worker"
$python = Join-Path $workerRoot ".venv\Scripts\python.exe"
$modelIndex = Join-Path $workerRoot "models\lcm-dreamshaper-int8\model_index.json"
$workerUrl = "http://127.0.0.1:8765"
$siteUrl = "http://localhost:3000"
$worker = $null
$web = $null
$exitCode = 0

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Dependencia obrigatoria nao encontrada: $Name"
  }
}

function Test-Http([string]$Url, [int]$TimeoutSeconds = 2) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSeconds
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch { return $false }
}

function Test-Port([int]$Port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    return $result.AsyncWaitHandle.WaitOne(500) -and $client.Connected
  } finally { $client.Dispose() }
}

function Wait-Http([string]$Url, [int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Http $Url) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Start-LocalProcess([string]$FilePath, [string]$Arguments, [string]$WorkingDirectory) {
  # Start-Process converts the inherited environment to a case-insensitive
  # dictionary. Some terminals expose both Path and PATH, which makes that
  # conversion fail on Windows before the child process is created.
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $FilePath
  $startInfo.Arguments = $Arguments
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  return [System.Diagnostics.Process]::Start($startInfo)
}

try {
  Assert-Command "node"
  Assert-Command "corepack.cmd"
  Assert-Command "ollama"
  if (-not (Test-Path -LiteralPath $python -PathType Leaf)) { throw "Venv do worker nao encontrada: $python" }
  $nodeMajor = [int]((& node --version).TrimStart("v").Split(".")[0])
  $pnpmVersion = & corepack.cmd pnpm --version
  $pnpmMajor = [int]($pnpmVersion.Split(".")[0])
  $pythonMinor = & $python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
  if ($nodeMajor -lt 22) { throw "Node.js 22 ou superior e obrigatorio; encontrado: $(& node --version)" }
  if ($pnpmMajor -lt 11) { throw "pnpm 11 ou superior e obrigatorio; encontrado: $pnpmVersion" }
  if ([version]$pythonMinor -lt [version]"3.12") { throw "Python 3.12 ou superior e obrigatorio; encontrado: $pythonMinor" }
  if (-not (Test-Path -LiteralPath $modelIndex -PathType Leaf)) { throw "Modelo OpenVINO nao encontrado: $modelIndex" }
  if (-not (Test-Path -LiteralPath (Join-Path $root "node_modules") -PathType Container)) { throw "Dependencias Node ausentes. Execute pnpm install." }
  if (-not (Test-Http "http://127.0.0.1:11434/api/tags" 3)) { throw "Ollama nao esta respondendo em 127.0.0.1:11434." }
  if (Test-Port 8765) {
    if (-not (Test-Http "$workerUrl/health" 5)) {
      throw "A porta 8765 esta ocupada por um processo que nao e um worker saudavel."
    }
    Write-Host "Reutilizando worker existente."
  } else {
    Write-Host "Iniciando worker de imagens (a compilacao inicial pode levar cerca de 90 segundos)..."
    $worker = Start-LocalProcess $python "-m image_worker.server" $workerRoot
    if (-not (Wait-Http "$workerUrl/health" 150)) { throw "Worker nao respondeu dentro do prazo." }
  }
  $health = Invoke-RestMethod -Uri "$workerUrl/health" -TimeoutSec 5
  Write-Host "Worker: $($health.status); dispositivo: $($health.device); modelo pronto: $($health.modelReady)"

  if (Test-Port 3000) {
    if (-not (Test-Http $siteUrl 5)) {
      throw "A porta 3000 esta ocupada por um processo que nao e o site Lexi."
    }
    Write-Host "Reutilizando site existente."
  } else {
    Write-Host "Iniciando site..."
    $corepack = (Get-Command "corepack.cmd").Source
    $web = Start-LocalProcess $env:ComSpec "/d /s /c `"`"$corepack`" pnpm --filter @vocabulary/web dev`"" $root
    if (-not (Wait-Http $siteUrl 90)) { throw "Site nao respondeu dentro do prazo." }
  }
  if (-not $NoBrowser) { Start-Process $siteUrl }

  Write-Host "Lexi pronta em $siteUrl. Pressione Ctrl+C para encerrar."
  while (($null -eq $worker -or -not $worker.HasExited) -and ($null -eq $web -or -not $web.HasExited)) {
    Start-Sleep -Seconds 1
  }
  $workerState = if ($null -eq $worker) { "externo" } elseif ($worker.HasExited) { "encerrado ($($worker.ExitCode))" } else { "ativo" }
  $webState = if ($null -eq $web) { "externo" } elseif ($web.HasExited) { "encerrado ($($web.ExitCode))" } else { "ativo" }
  throw "Um processo local encerrou inesperadamente. Worker: $workerState; Web: $webState"
} catch {
  Write-Error $_
  $exitCode = 1
} finally {
  foreach ($process in @($worker, $web)) {
    if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id }
  }
}
exit $exitCode
