#!/bin/zsh
# Build the site and publish web/dist to the gh-pages branch (GitHub Pages "deploy from branch").
set -e
cd "${0:A:h}"
npm run build
TMP=$(mktemp -d)
cp -R dist/. "$TMP"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="gta6-monitor-bot" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f https://github.com/DavidAslanyan/gta6-impact-monitor.git gh-pages
rm -rf "$TMP"
echo "deployed"
