#!/bin/sh
# Source after setting ROOT. Supports WSL/POSIX and native Git Bash venvs.
LIB=${LIB:-${LEMO_OPUSCAR_HOME:-$HOME/lemo-opuscar}}
export LIB PYTHONUTF8=1 PYTHONIOENCODING=utf-8
if [ -n "$VIDEO_PYTHON" ]; then
  PY=$VIDEO_PYTHON
elif [ -x "$LIB/.venv/bin/python" ]; then
  PY="$LIB/.venv/bin/python"
elif [ -f "$LIB/.venv/Scripts/python.exe" ]; then
  PY="$LIB/.venv/Scripts/python.exe"
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  PY=python
fi
export PY
