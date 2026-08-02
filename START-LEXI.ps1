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

try {
  Assert-Command "node"
  Assert-Command "pnpm.cmd"
  Assert-Command "ollama"
  if (-not (Test-Path -LiteralPath $python -PathType Leaf)) { throw "Venv do worker nao encontrada: $python" }
  $nodeMajor = [int]((& node --version).TrimStart("v").Split(".")[0])
  $pnpmMajor = [int]((& pnpm.cmd --version).Split(".")[0])
  $pythonMinor = & $python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
  if ($nodeMajor -lt 22) { throw "Node.js 22 ou superior e obrigatorio; encontrado: $(& node --version)" }
  if ($pnpmMajor -lt 11) { throw "pnpm 11 ou superior e obrigatorio; encontrado: $(& pnpm.cmd --version)" }
  if ([version]$pythonMinor -lt [version]"3.12") { throw "Python 3.12 ou superior e obrigatorio; encontrado: $pythonMinor" }
  if (-not (Test-Path -LiteralPath $modelIndex -PathType Leaf)) { throw "Modelo OpenVINO nao encontrado: $modelIndex" }
  if (-not (Test-Path -LiteralPath (Join-Path $root "node_modules") -PathType Container)) { throw "Dependencias Node ausentes. Execute pnpm install." }
  if (-not (Test-Http "http://127.0.0.1:11434/api/tags" 3)) { throw "Ollama nao esta respondendo em 127.0.0.1:11434." }
  if (Test-Port 8765) { throw "A porta 8765 ja esta em uso. Encerre o processo existente." }
  if (Test-Port 3000) { throw "A porta 3000 ja esta em uso. Encerre o processo existente." }

  Write-Host "Iniciando worker de imagens (a compilacao inicial pode levar cerca de 90 segundos)..."
  $worker = Start-Process -FilePath $python -ArgumentList "-m", "image_worker.server" -WorkingDirectory $workerRoot -PassThru -NoNewWindow
  if (-not (Wait-Http "$workerUrl/health" 150)) { throw "Worker nao respondeu dentro do prazo." }
  $health = Invoke-RestMethod -Uri "$workerUrl/health" -TimeoutSec 5
  Write-Host "Worker: $($health.status); dispositivo: $($health.device); modelo pronto: $($health.modelReady)"

  Write-Host "Iniciando site..."
  $web = Start-Process -FilePath "pnpm.cmd" -ArgumentList "--filter", "@vocabulary/web", "dev" -WorkingDirectory $root -PassThru -NoNewWindow
  if (-not (Wait-Http $siteUrl 90)) { throw "Site nao respondeu dentro do prazo." }
  if (-not $NoBrowser) { Start-Process $siteUrl }

  Write-Host "Lexi pronta em $siteUrl. Pressione Ctrl+C para encerrar."
  while (-not $worker.HasExited -and -not $web.HasExited) {
    Start-Sleep -Seconds 1
  }
  $workerState = if ($worker.HasExited) { "encerrado ($($worker.ExitCode))" } else { "ativo" }
  $webState = if ($web.HasExited) { "encerrado ($($web.ExitCode))" } else { "ativo" }
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
