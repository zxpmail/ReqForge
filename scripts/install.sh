#!/usr/bin/env bash
# Thin wrapper — core logic lives in scripts/install.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec npx ts-node scripts/install.ts "$@"
