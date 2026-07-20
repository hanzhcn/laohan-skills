#!/bin/bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/references/upstream-sources.json"

if ! command -v gh >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  echo "UNVERIFIED: check-upstreams.sh requires gh and jq" >&2
  exit 2
fi
if [[ ! -f "$MANIFEST" ]] || ! jq -e '.schema_version == 1 and (.sources | type == "array" and length > 0)' "$MANIFEST" >/dev/null; then
  echo "UNVERIFIED: invalid upstream manifest: $MANIFEST" >&2
  exit 2
fi

updated=0
unverified=0
while IFS=$'\t' read -r id repo path recorded; do
  response="$(gh api --method GET "repos/$repo/commits" -f path="$path" -f per_page=1 2>/dev/null)" || {
    echo "UNVERIFIED id=$id repo=$repo path=$path"
    unverified=1
    continue
  }
  latest="$(jq -r '.[0].sha // empty' <<<"$response")"
  if [[ -z "$latest" ]]; then
    echo "UNVERIFIED id=$id repo=$repo path=$path"
    unverified=1
  elif [[ "$latest" == "$recorded" ]]; then
    echo "CURRENT id=$id commit=$latest"
  else
    echo "UPDATED id=$id recorded=$recorded latest=$latest url=https://github.com/$repo/compare/$recorded...$latest"
    updated=1
  fi
done < <(jq -r '.sources[] | [.id, .repo, .path, .commit] | @tsv' "$MANIFEST")

if [[ "$unverified" -ne 0 ]]; then
  exit 2
fi
if [[ "$updated" -ne 0 ]]; then
  exit 1
fi
echo "PASS upstream sources current verified_at=$(jq -r '.verified_at' "$MANIFEST")"
