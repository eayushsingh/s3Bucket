#!/bin/sh
set -e

echo "Waiting for MinIO server to be ready..."
until /usr/bin/mc alias set myminio http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"; do
  echo "MinIO is unavailable - sleeping 1s"
  sleep 1
done

echo "MinIO alias configured successfully."

# List of default buckets to create
BUCKETS="${STORAGE_DEFAULT_BUCKETS:-app-uploads,app-images,app-documents,app-public,app-private,app-backups}"

IFS=','
for BUCKET in $BUCKETS; do
  BUCKET=$(echo "$BUCKET" | tr -d ' ')
  if [ -n "$BUCKET" ]; then
    echo "Ensuring bucket exists: $BUCKET"
    /usr/bin/mc mb --ignore-existing "myminio/$BUCKET"
  fi
done

# Set public download policy on app-public bucket if present
if /usr/bin/mc ls myminio/app-public > /dev/null 2>&1; then
  echo "Setting public download policy on 'app-public'..."
  /usr/bin/mc anonymous set download myminio/app-public || true
fi

echo "Storage initialization completed successfully!"
exit 0
