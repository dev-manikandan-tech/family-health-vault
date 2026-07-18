#!/usr/bin/env bash
set -euo pipefail

echo "Running security audit..."

cd "$(dirname "$0")/../services/api"

echo "Checking for known vulnerable dependencies..."
npm audit --audit-level moderate || true

echo "Checking for secrets in repository..."
if command -v trufflehog >/dev/null 2>&1; then
  trufflehog filesystem . --only-verified || true
else
  echo "trufflehog not installed; skipping secret scan"
fi

echo "Running ESLint security rules..."
npm run lint

echo "Security audit complete."
