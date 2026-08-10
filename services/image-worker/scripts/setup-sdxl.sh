#!/usr/bin/env bash
set -euo pipefail
SERVICE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT_ROOT="$SERVICE_ROOT/.venv-sdxl"
PYTHON="$ENVIRONMENT_ROOT/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  echo "[sdxl] Creating isolated benchmark environment..."
  "${PYTHON_BIN:-python3}" -m venv "$ENVIRONMENT_ROOT"
fi
"$PYTHON" -m pip install --upgrade pip
"$PYTHON" -m pip install --upgrade-strategy eager -r "$SERVICE_ROOT/requirements-sdxl.txt"
"$PYTHON" -c "from optimum.intel import OVStableDiffusionXLPipeline; import openvino, diffusers, psutil; print('SDXL/OpenVINO dependencies ready')"
