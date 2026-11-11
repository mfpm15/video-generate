#!/bin/sh
# usage: sh system/tools/sync-lib.sh <film-or-lab-dir>
# The render server only serves the film folder, so the shared code/fonts are COPIED in at build time.
# _lib/ and fonts/ inside a film are generated: never edit them there, edit system/lib and system/fonts.
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd); T=${1:?dir}
rm -rf "$T/_lib"; mkdir -p "$T/_lib" "$T/fonts"
cp "$ROOT"/system/lib/*.js "$T/_lib/"; cp "$ROOT"/system/brand.json "$T/_lib/brand.json"
cp "$ROOT"/system/fonts/* "$T/fonts/"
