#!/bin/bash

# Wrapper to invoke the canonical performance regression check
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

exec "$REPO_ROOT/scripts/build/performance-regression.sh" "$@"
