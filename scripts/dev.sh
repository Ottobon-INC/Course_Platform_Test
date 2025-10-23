#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

trap 'kill 0' EXIT

npm --prefix "$ROOT_DIR/backend" run dev &
BACKEND_PID=$!

npm --prefix "$ROOT_DIR/frontend" run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID