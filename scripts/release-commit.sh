#!/usr/bin/env bash
# Publishes one release of the plugin to the public repo's default branch.
#
#   scripts/release-commit.sh <version> <remote-url>
#
# Run at the root of the mirrored tree (this directory's parent is the repo root there), after
# `npm run build`. It makes a commit whose tree is HEAD's tracked files plus the built bundle and
# the third-party notices (both git-ignored, so they are added explicitly), with the remote's
# current `main` as parent, and pushes it as `main` together with the tag v<version> in one atomic
# push. `main` therefore only ever fast-forwards and never exists without a bundle.
#
# It refuses — pushing nothing — when the version disagrees with the manifests, when the bundle is
# missing, or when that version is already published.
set -euo pipefail

die() { echo "release-commit: $*" >&2; exit 1; }

[ $# -eq 2 ] || die "usage: release-commit.sh <version> <remote-url>"
VERSION="$1"
REMOTE="$2"
OUTPUTS=(plugin/dist/index.js plugin/dist/preview-worker.mjs plugin/THIRD-PARTY-NOTICES.txt)
# -c credential.helper= : never let a helper store a token that is part of the remote URL.
GIT=(git -c credential.helper=)

cd "$(git rev-parse --show-toplevel)"

version_of() { node -p "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).version" "$1"; }
PLUGIN_VERSION="$(version_of plugin/.claude-plugin/plugin.json)"
PACKAGE_VERSION="$(version_of package.json)"
if [ "$VERSION" != "$PLUGIN_VERSION" ] || [ "$VERSION" != "$PACKAGE_VERSION" ]; then
  die "version mismatch (tag $VERSION, plugin.json $PLUGIN_VERSION, package.json $PACKAGE_VERSION)"
fi

for f in "${OUTPUTS[@]}"; do
  [ -s "$f" ] || die "bundle missing — run npm run build ($f)"
done

if [ -n "$("${GIT[@]}" ls-remote --tags "$REMOTE" "refs/tags/v$VERSION")" ]; then
  die "v$VERSION is already published — bump the version"
fi

SOURCE="$(git rev-parse HEAD)"

# A throwaway index: the checkout's own index and working tree stay exactly as they are.
INDEX="$(mktemp)"
trap 'rm -f "$INDEX"' EXIT
export GIT_INDEX_FILE="$INDEX"
git read-tree HEAD
git add -f -- "${OUTPUTS[@]}"
TREE="$(git write-tree)"
unset GIT_INDEX_FILE

PARENT=()
if [ -n "$("${GIT[@]}" ls-remote --heads "$REMOTE" refs/heads/main)" ]; then
  "${GIT[@]}" fetch --quiet --no-tags "$REMOTE" refs/heads/main
  PARENT=(-p "$(git rev-parse FETCH_HEAD)")
fi

WHO='github-actions[bot]'
MAIL='41898282+github-actions[bot]@users.noreply.github.com'
COMMIT="$(GIT_AUTHOR_NAME="$WHO" GIT_AUTHOR_EMAIL="$MAIL" GIT_COMMITTER_NAME="$WHO" GIT_COMMITTER_EMAIL="$MAIL" \
  git commit-tree "$TREE" ${PARENT[@]+"${PARENT[@]}"} -m "Release v$VERSION" -m "Source: $SOURCE (branch source)")"

"${GIT[@]}" push --quiet --atomic "$REMOTE" "$COMMIT:refs/heads/main" "$COMMIT:refs/tags/v$VERSION"
echo "release-commit: published v$VERSION as $COMMIT"
