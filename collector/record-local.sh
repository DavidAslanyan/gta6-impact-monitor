#!/bin/zsh
# Local stand-in for the GitHub Actions collector: every 5 minutes take Snapshots, refresh history,
# rebuild the website bundle and push ./data to the `data` branch. Stop it once Actions is running.
cd "${0:A:h}/.."
export GITHUB_TOKEN=$(gh auth token)
while true; do
  # Hand over to GitHub Actions: once the cron has pushed to the data branch, stop this local writer
  # so there is only ever one writer.
  ( cd data && git fetch -q origin data ) && if (cd data && git log origin/data -20 --format='%an %s' | grep -q '^gta6-monitor-bot data:.*Z$'); then
    echo "GitHub Actions collector is live — stopping the local recorder." >> .local/recorder.log; exit 0
  fi
  {
    node collector/snapshot.mjs
    node collector/history.mjs
    node collector/bundle.mjs
    ( cd data && git add -A && git commit -qm "data: $(date -u +%Y-%m-%dT%H:%MZ) (local)" && git push -q origin data ) || true
  } >> .local/recorder.log 2>&1
  sleep 240
done
