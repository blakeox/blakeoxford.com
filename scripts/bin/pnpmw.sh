#!/bin/sh
set -eu

if command -v corepack >/dev/null 2>&1; then
  exec corepack pnpm "$@"
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm "$@"
fi

echo "pnpm wrapper: neither 'corepack' nor 'pnpm' is available on PATH." >&2
exit 1
