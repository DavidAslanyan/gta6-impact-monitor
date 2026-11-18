#!/bin/zsh
# Local recorder: takes a snapshot every 5 minutes until stopped (used before the GitHub Actions job takes over).
cd "${0:A:h}/.."
while true; do
  node collector/snapshot.mjs >> .local/recorder.log 2>&1
  sleep 300
done
