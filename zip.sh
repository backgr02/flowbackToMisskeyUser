#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

# shellcheck source=/dev/null
source .venv/bin/activate

pip install -r requirements.txt -t .
rm -f "${1}"
zip -r "${1}" ./*
