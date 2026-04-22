#!/usr/bin/env bash
# Downloads MelonLoader reference DLLs into ./lib/ so the project can build locally.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p lib
tmp="$(mktemp -d)"
curl -sL -o "$tmp/ml.zip" https://github.com/LavaGang/MelonLoader/releases/download/v0.6.6/MelonLoader.x64.zip
unzip -q "$tmp/ml.zip" -d "$tmp/ml"
cp "$tmp/ml/MelonLoader/net6/MelonLoader.dll" lib/
cp "$tmp/ml/MelonLoader/net6/0Harmony.dll" lib/
cp "$tmp/ml/MelonLoader/net6/Il2CppInterop.Runtime.dll" lib/
rm -rf "$tmp"

echo "Refs in ./lib:"
ls -la lib/
