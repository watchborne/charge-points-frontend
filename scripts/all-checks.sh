#!/usr/bin/env bash
#
# Runs the same checks CI does, in one go, and **exits non-zero if any of them
# failed**.
#
# Every step runs even when an earlier one fails: the CI workflow runs them as
# independent parallel jobs, so one local pass showing every failure is the
# point. The summary at the end names the ones that failed.
#
# Each step's status comes from the command itself, never from the `tail` that
# trims its output. Piping straight into `tail` reports the *pipe's* exit status
# — always 0 — which is what used to make every step print a green tick no
# matter what it found.
#
# Usage: npm run all-checks   (or: bash scripts/all-checks.sh)
#
set -uo pipefail

# Always run from the repository root, whatever the caller's cwd.
cd "$(dirname "$0")/.."

# Names of the failed steps, accumulated as a string rather than an array:
# `${#arr[@]}` on an empty array is an "unbound variable" error under `set -u`
# in the bash 3.2 that ships with macOS.
failed=""

# run <NAME> <lines-to-keep-on-success> <command...>
run() {
  local name="$1" keep="$2"
  shift 2

  echo "=== ${name} ==="

  local output
  output="$("$@" 2>&1)"
  local status=$?

  if [ "$status" -eq 0 ]; then
    printf '%s\n' "$output" | tail -n "$keep"
    echo "${name} ✅"
    return 0
  fi

  # The whole output on failure, not a tail of it: what a check objects to is
  # rarely in its last few lines (a Prettier list, a vitest diff, the first of
  # fifty tsc errors).
  printf '%s\n' "$output"
  echo "${name} ❌ (exit ${status})"
  failed="${failed}${failed:+, }${name}"
}

run LINT 8 npx eslint .
run FORMAT 5 npx prettier --check .
run TYPECHECK 5 npx tsc --noEmit
run BUILD 5 next build --webpack
run UNIT 5 npx vitest run

if [ -n "$failed" ]; then
  printf '\n=== FAILED: %s ===\n' "$failed"
  exit 1
fi

printf '\n=== All checks passed ✅ ===\n'