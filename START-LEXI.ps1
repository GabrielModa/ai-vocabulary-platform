[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$workerUrl = "http://127.0.0.1:8765"
$siteUrl = "http://localhost:3000"
$runtime = $null
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

function Wait-Http([string]$Url, [int]$TimeoutSeconds, [System.Diagnostics.Process]$Process = $null) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if ($Process -and $Process.HasExited) { return $false }
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
  Assert-Command "pnpm.cmd"
  Assert-Command "ollama"
  $nodeMajor = [int]((& node --version).TrimStart("v").Split(".")[0])
  $pnpmVersion = & pnpm.cmd --version
  $pnpmMajor = [int]($pnpmVersion.Split(".")[0])
  if ($nodeMajor -lt 22) { throw "Node.js 22 ou superior e obrigatorio; encontrado: $(& node --version)" }
  if ($pnpmMajor -lt 11) { throw "pnpm 11 ou superior e obrigatorio; encontrado: $pnpmVersion" }
  if (-not (Test-Path -LiteralPath (Join-Path $root "node_modules") -PathType Container)) { throw "Dependencias Node ausentes. Execute pnpm install." }
  if (-not (Test-Http "http://127.0.0.1:11434/api/tags" 3)) { throw "Ollama nao esta respondendo em 127.0.0.1:11434." }
  if (Test-Port 3000) {
    throw "A porta 3000 ja esta ocupada. Encerre a execucao anterior antes de usar o launcher."
  }

  Write-Host "Iniciando runtime local completo (banco, migracoes, Ollama, imagens e web)..."
  $pnpm = (Get-Command "pnpm.cmd").Source
  $runtime = Start-LocalProcess $env:ComSpec "/d /s /c `"`"$pnpm`" dev:local`"" $root
  if (-not (Wait-Http $siteUrl 180 $runtime)) {
    if ($runtime.HasExited) { throw "Runtime local encerrou com codigo $($runtime.ExitCode)." }
    throw "Site nao respondeu dentro do prazo. Consulte os logs exibidos pelo runtime."
  }

  if (Test-Http "$workerUrl/health" 5) {
    $health = Invoke-RestMethod -Uri "$workerUrl/health" -TimeoutSec 5
    Write-Host "Worker: $($health.status); dispositivo: $($health.device); modelo pronto: $($health.modelReady)"
  } else {
    Write-Warning "Worker de imagens indisponivel. O treino continuara sem pistas visuais."
  }
  if (-not $NoBrowser) { Start-Process $siteUrl }

  Write-Host "Lexi pronta em $siteUrl. Pressione Ctrl+C para encerrar."
  while (-not $runtime.HasExited) {
    Start-Sleep -Seconds 1
  }
  throw "O runtime local encerrou inesperadamente com codigo $($runtime.ExitCode)."
} catch {
  Write-Error $_
  $exitCode = 1
} finally {
  if ($runtime -and -not $runtime.HasExited) { Stop-Process -Id $runtime.Id }
}
exit $exitCode
