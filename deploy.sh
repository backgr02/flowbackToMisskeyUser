#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

PACKAGE_NAME="my_deployment_package.zip"
FUNCTION_NAME="flowbackToMisskeyUser"

trap 'echo "An error occurred. Exiting..."; exit 1;' ERR

./zip.sh "$PACKAGE_NAME"

aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file "fileb://$PACKAGE_NAME"

rm -f "$PACKAGE_NAME"
