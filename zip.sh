#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

rm -f "${1}"
git archive HEAD "--output=${1}"
