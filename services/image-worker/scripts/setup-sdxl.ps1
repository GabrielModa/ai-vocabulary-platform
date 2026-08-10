$ErrorActionPreference = "Stop"

$ServiceRoot = Split-Path -Parent $PSScriptRoot
$EnvironmentRoot = Join-Path $ServiceRoot ".venv-sdxl"
$Python = Join-Path $EnvironmentRoot "Scripts\python.exe"
$Requirements = Join-Path $ServiceRoot "requirements-sdxl.txt"

if (-not (Test-Path $Python)) {
  Write-Host "[sdxl] Creating isolated benchmark environment..."
  & python -m venv $EnvironmentRoot
}

Write-Host "[sdxl] Updating pip..."
& $Python -m pip install --upgrade pip

Write-Host "[sdxl] Installing optional SDXL/OpenVINO dependencies..."
& $Python -m pip install --upgrade-strategy eager -r $Requirements

Write-Host "[sdxl] Dependency check..."
& $Python -c "from optimum.intel import OVStableDiffusionXLPipeline; import openvino, diffusers, psutil; print('SDXL/OpenVINO dependencies ready')"

Write-Host ""
Write-Host "Start with one CPU image:"
Write-Host ".\.venv-sdxl\Scripts\python.exe scripts\benchmark_sdxl.py --limit 1 --device CPU"
Write-Host ""
Write-Host "Then try Intel GPU:"
Write-Host ".\.venv-sdxl\Scripts\python.exe scripts\benchmark_sdxl.py --limit 1 --device GPU"
