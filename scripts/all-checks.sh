echo "=== LINT ==="; npx eslint . 2>&1 | tail -8
echo "=== FORMAT ==="; npx prettier --check . 2>&1 | tail -5
echo "=== BUILD ==="; npx next build 2>&1 | tail -5; echo "build exit: $?"
echo "=== UNIT ==="; npx vitest run 2>&1 | tail -5
