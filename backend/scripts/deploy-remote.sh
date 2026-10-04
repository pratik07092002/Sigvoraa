#!/usr/bin/env bash
# Runs ON the EC2 instance via SSM (not SSH) — GitHub Actions builds the
# binary inside an amazon-linux-2023 container for glibc parity with this
# host, this script just installs it and restarts the systemd unit.
#
# Usage: deploy-remote.sh <artifacts-bucket> <sha>
set -euo pipefail

BUCKET="${1:?Usage: deploy-remote.sh <artifacts-bucket> <sha>}"
SHA="${2:?Usage: deploy-remote.sh <artifacts-bucket> <sha>}"

APP_DIR=/opt/apps/sentinelmesh-backend

echo "Downloading backend binary for $SHA..."
aws s3 cp "s3://${BUCKET}/${SHA}/sentinelmesh-backend" "${APP_DIR}/sentinelmesh-backend.new"
chmod +x "${APP_DIR}/sentinelmesh-backend.new"
mv "${APP_DIR}/sentinelmesh-backend.new" "${APP_DIR}/sentinelmesh-backend"

echo "Restarting backend..."
sudo systemctl restart sentinelmesh-backend
sleep 2
sudo systemctl is-active sentinelmesh-backend

echo "Deploy complete."
