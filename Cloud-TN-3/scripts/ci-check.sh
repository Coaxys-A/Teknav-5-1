#!/usr/bin/env bash
set -euo pipefail

echo "Running lint/build for frontend"
npm run lint
npm run build

echo "Running backend build + prisma checks"
cd "$(dirname "$0")/../backend"
npm run build
npx prisma validate
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --exit-code

echo "CI checks completed"
