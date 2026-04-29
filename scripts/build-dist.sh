#!/usr/bin/env bash
set -euo pipefail

# Assemble runtime-served files into dist/ for the perf gate.
# Mirrors what S3 actually serves (excluding source-only artifacts).
rm -rf dist
mkdir -p dist

cp index.html theme.css dist/
cp -r assets fonts js lib dist/
mkdir -p dist/app-assets
cp app-assets/icon_128.png app-assets/manifest.json dist/app-assets/ 2>/dev/null || true

echo "dist/ contents:"
find dist -type f | sort
