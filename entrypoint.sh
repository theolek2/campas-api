#!/bin/bash
set -e
mkdir -p /data/uploads
chmod 777 /data/uploads
exec su -s /bin/bash appuser -c "exec uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1"
