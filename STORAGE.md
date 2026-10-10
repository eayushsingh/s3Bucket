# S3-Compatible Object Storage Infrastructure (MinIO Native)

A complete, production-grade, AWS-independent object storage architecture powered by **MinIO** and standard S3 SDK protocols.

---

## 1. Why MinIO?

- **100% S3 API Compatibility**: Implements standard Amazon S3 v4 signature protocols. You can switch between MinIO, AWS S3, Cloudflare R2, Wasabi, or Ceph simply by updating environment variables.
- **Zero AWS Account or Cloud Lock-in**: Run locally on Docker, on bare-metal servers, or in private Kubernetes clusters without AWS billing or egress charges.
- **Ultra-High Performance**: Written in Go with SIMD acceleration, capable of saturating 100GbE network interfaces.
- **Enterprise Features**: Supports multipart chunking, object immutability (WORM), SSE-S3 encryption, bucket versioning, and Prometheus metrics out of the box.

---

## 2. Architecture & Data Flow

```
                                    +-----------------------------------------+
                                    |                MinIO S3                 |
                                    |           (Binary Storage Engine)       |
                                    |      Port 9000 (API) / 9001 (Console)   |
                                    +-----------------------------------------+
                                          ^                            |
                    (3) Direct PUT Upload |                            | (4) Direct GET Download
                      with Presigned URL  |                            |   with Presigned URL
                                          |                            v
+------------------------------------------------------------------------------------+
|                                    Client Browser                                  |
|                 (React / Next.js / TypeScript Modern Storage Console)               |
+------------------------------------------------------------------------------------+
       |                                                                       ^
       | (1) Request Presigned URL                                             | (5) Render files,
       |     with file metadata                                                |     preview & stats
       v                                                                       |
+------------------------------------------------------------------------------------+
|                               Backend Next.js API                                  |
|   - Storage Service Abstraction Layer (S3Client v3)                                |
|   - Authentication & Permissions Gate                                              |
|   - Path Traversal & MIME Validation                                               |
+------------------------------------------------------------------------------------+
       |                                                       |
       | (2) Sign S3 Request                                  | (4) Persist / Query metadata
       v                                                       v
+-----------------------------+               +--------------------------------------+
| MinIO HMAC-SHA256 Signer    |               | Persistent SQLite / Postgres DB      |
| (Uses private secret key)   |               | (Metadata: id, userId, etag, size)  |
+-----------------------------+               +--------------------------------------+
```

### Key Principles
1. **Decoupled Binary vs Metadata**: MinIO stores the actual binary payloads. The application database stores file ownership, original filenames, mime types, and audit trails.
2. **Zero Server Buffering**: File payloads never pass through the Node.js backend. The browser uploads and downloads directly to/from MinIO using short-lived cryptographic presigned URLs. This eliminates server memory exhaustion and CPU bottlenecks.

---

## 3. Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ and npm

### 1. Launch MinIO Storage Engine
```bash
docker compose up -d
```

Verify containers are running:
```bash
docker compose ps
```
- **MinIO S3 API Endpoint**: `http://localhost:9000`
- **MinIO Web Console**: `http://localhost:9001` (User: `minioadmin`, Password: `minioadmin_secure_password_123`)

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Initialize Storage Buckets & Run Application
```bash
# Idempotently verify and create default buckets
npm run init:storage

# Run Next.js Full-Stack App
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Storage Console.

---

## 4. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `STORAGE_ENDPOINT` | MinIO internal endpoint for S3 SDK | `http://127.0.0.1:9000` |
| `STORAGE_REGION` | S3 Region | `us-east-1` |
| `STORAGE_ACCESS_KEY` | Root/IAM Access Key | `minioadmin` |
| `STORAGE_SECRET_KEY` | Root/IAM Secret Key | `minioadmin_secure_password_123` |
| `STORAGE_USE_SSL` | Enable TLS (`https://`) | `false` (Local) / `true` (Prod) |
| `STORAGE_FORCE_PATH_STYLE` | Path-style routing (`http://host/bucket`) | `true` |
| `NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT` | Browser-accessible endpoint for Presigned URLs | `http://127.0.0.1:9000` |
| `STORAGE_DEFAULT_BUCKETS` | Comma-separated list of buckets to auto-create | `app-uploads,app-images,app-documents,app-public,app-private,app-backups` |
| `STORAGE_PRESIGNED_UPLOAD_EXPIRY` | Upload URL TTL in seconds | `900` (15 min) |
| `STORAGE_PRESIGNED_DOWNLOAD_EXPIRY` | Download URL TTL in seconds | `3600` (1 hr) |
| `STORAGE_MAX_FILE_SIZE_BYTES` | Maximum allowed file size | `5368709120` (5 GB) |
| `DATABASE_PATH` | Path to SQLite metadata database | `./data/metadata.sqlite` |

---

## 5. Storage Buckets Organization

| Bucket Name | Purpose | Access Policy |
| :--- | :--- | :--- |
| `app-uploads` | General user file uploads & temporary processing | Private (Presigned URLs only) |
| `app-images` | User profile photos, banners, processed thumbnails | Private (Presigned URLs only) |
| `app-documents` | Invoices, legal contracts, reports, confidential PDFs | Private (Presigned URLs only) |
| `app-public` | Public website assets, logos, public downloads | Public Read (`mc anonymous set download`) |
| `app-private` | Internal application archives & sensitive keys | Private (Restricted admin access) |
| `app-backups` | Database snapshots & disaster recovery tarballs | Private (Automated retention policies) |

---

## 6. REST API Endpoints

### Storage Health Check
- `GET /api/health/storage`
  - Returns MinIO connectivity, live latency in milliseconds, and accessible bucket list.

### Bucket Management
- `GET /api/storage/buckets` - List all buckets with system/custom flags.
- `POST /api/storage/buckets` - Create a new bucket `{ bucketName: "assets-2026" }`.
- `DELETE /api/storage/buckets/:name?force=true` - Delete bucket (optional recursive force).
- `GET /api/storage/buckets/:name` - Get bucket statistics and total storage usage.

### Presigned URL Direct Operations
- `POST /api/storage/upload-url`
  - Body: `{ bucket, fileName, mimeType, fileSize, prefix, userId }`
  - Returns: `{ uploadUrl, objectKey, fileId, expiresAt }`
- `POST /api/storage/download-url`
  - Body: `{ bucket, objectKey, expiresInSeconds, asAttachment, customFileName }`
  - Returns: `{ downloadUrl, expiresAt }`
- `POST /api/storage/confirm-upload`
  - Body: `{ bucket, objectKey, fileId }`
  - Verifies object existence in MinIO and finalizes metadata status to `uploaded`.

### Large File Multipart Uploads (>5MB to 5GB)
- `POST /api/storage/multipart/initiate` - Starts multipart session and returns `uploadId`.
- `POST /api/storage/multipart/presigned-part-urls` - Returns presigned upload URLs for part 1..N.
- `POST /api/storage/multipart/complete` - Assembles uploaded parts with ETags.
- `POST /api/storage/multipart/abort` - Cancels upload and purges temporary chunks.

### Object Queries & Deletions
- `GET /api/storage/objects?bucket=app-uploads&prefix=docs/` - Lists objects with virtual folder prefix support.
- `POST /api/storage/objects/metadata` - Fetches combined MinIO S3 metadata + Database record.
- `DELETE /api/storage/objects` - Deletes one or multiple object keys.

---

## 7. Security & Hardening

1. **Credentials Isolation**: MinIO secret keys are strictly maintained on the server. The client browser never receives storage credentials.
2. **Directory Traversal Mitigation**: All object keys are sanitized through `validateObjectKey()` to reject `../`, null bytes `\0`, and dangerous control characters.
3. **Safe Object Key Generation**: Files are stored with collision-resistant UUIDs and timestamp folders (`[prefix]/user_[id]/YYYY/MM/DD/[uuid]-[filename]`), preventing overwriting attacks.
4. **Time-Limited Presigned URLs**: All presigned upload and download URLs are cryptographically signed with HMAC-SHA256 and expire after configured seconds.
5. **MIME & Payload Size Verification**: Rejects dangerous script MIME types and enforces file size boundaries prior to signing upload requests.

---

## 8. Production Deployment & DevOps

### Production Reverse Proxy (Nginx with HTTPS)
MinIO should sit behind an SSL-terminating reverse proxy with `client_max_body_size` configured for large uploads:

```nginx
# /etc/nginx/sites-available/s3.yourdomain.com
server {
    listen 80;
    server_name s3.yourdomain.com console.s3.yourdomain.com;
    return 301 https://$host$request_uri;
}

# S3 API Endpoint
server {
    listen 443 ssl http2;
    server_name s3.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/s3.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s3.yourdomain.com/privkey.pem;

    # Allow large file uploads
    client_max_body_size 5000M;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        proxy_pass http://127.0.0.1:9000;
    }
}
```

### Production Backup and Restore
MinIO includes the `mc mirror` utility for real-time continuous replication or scheduled snapshots:

```bash
# Set alias for production server
mc alias set prod https://s3.yourdomain.com $PROD_ACCESS_KEY $PROD_SECRET_KEY

# Mirror entire storage to backup server / external disk
mc mirror --watch --remove prod/ /mnt/secure_backup/minio_data/

# Automated Daily Backup Cronjob
0 2 * * * mc mirror prod/app-documents /backups/documents-$(date +\%F)
```

### Restoring from Backup
```bash
# Restore a specific bucket from disk
mc mirror /backups/documents-2026-10-08/ prod/app-documents/
```

### Health & Prometheus Monitoring
- MinIO exposes live health at `/minio/health/live` and cluster readiness at `/minio/health/ready`.
- Prometheus metrics are available at `/minio/v2/metrics/cluster`.
- Application storage health is monitorable via `GET /api/health/storage`.

---

## 9. Migration to AWS S3 / Cloudflare R2

To switch this application to AWS S3, Cloudflare R2, or Wasabi, modify only the environment variables:

```env
# Example: Switching to Cloudflare R2
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=<R2_ACCESS_KEY_ID>
STORAGE_SECRET_KEY=<R2_SECRET_ACCESS_KEY>
STORAGE_FORCE_PATH_STYLE=false
STORAGE_USE_SSL=true
```

No application or backend code modifications are needed!
