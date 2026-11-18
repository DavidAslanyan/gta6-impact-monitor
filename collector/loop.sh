#!/usr/bin/env bash
# Runs the collector every 5 minutes (aligned to the clock) for LOOP_MINUTES, committing each round to the
# data branch checked out at ./data. Used by GitHub Actions so collection does not depend on cron timing.
set -u
END=$(( $(date +%s) + ${LOOP_MINUTES:-345} * 60 ))
cd "$(dirname "$0")/.."
while [ "$(date +%s)" -lt "$END" ]; do
  # Pick up collector fixes pushed to main without waiting for the next run (this script runs from memory).
  git pull -q --ff-only origin main 2>/dev/null || true
  node collector/snapshot.mjs || true
  node collector/history.mjs || true
  node collector/bundle.mjs || true
  (
    cd data
    git add -A
    if ! git diff --cached --quiet; then
      git commit -qm "data: $(date -u +%Y-%m-%dT%H:%MZ)"
      for i in 1 2 3; do git pull -q --rebase -X theirs origin data && git push -q origin data && break; sleep 5; done
    fi
  ) || true
  NOW=$(date +%s)
  NEXT=$(( (NOW / 300 + 1) * 300 ))
  [ "$NEXT" -ge "$END" ] && break
  sleep $(( NEXT - NOW ))
done
