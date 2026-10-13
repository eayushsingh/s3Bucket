# 🪣 S3-MinIO Storage System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![MinIO](https://img.shields.io/badge/MinIO-S3_Compatible-c72c48.svg?logo=minio&logoColor=white)](https://min.io/)
[![AWS SDK v3](https://img.shields.io/badge/AWS_SDK-v3-orange.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/sdk-for-javascript/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-729B1B.svg?logo=vitest&logoColor=white)](https://vitest.dev/)

**A production-ready, cloud-agnostic Object Storage platform featuring direct presigned upload/download protocols, S3 multipart chunking, bucket management, SQLite metadata tracking, and path-traversal security.**

[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[Key Features](#-key-features) •
[API Reference](#-api-reference) •
[Configuration](#-configuration) •
[Testing](#-testing)

</div>

---

## ⚡ Highlights

- 🚀 **100% S3 Compatible**: Drop-in compatible with AWS S3, MinIO, Cloudflare R2, Wasabi, Ceph, and DigitalOcean Spaces.
- ⚡ **Zero Server Memory Buffering**: Direct-to-storage browser uploads via cryptographic Presigned URLs (HMAC-SHA256).
- 📦 **Multipart Chunked Uploads**: High-throughput uploads for large files (GBs+) with concurrent chunking, retry resilience, and progress tracking.
- 🎛️ **Industrial Systems Console**: Engineered for high-density operations (no AI-slop pastel gradients or toy cards). Monospace precision, high data density, and keyboard-first ergonomics.
- ⌨️ **Command Palette & Hotkeys**: Instant navigation with `⌘K` / `Ctrl+K`, `/` search filter, `r` refresh, and single-key shortcuts.
- 📜 **Live Operational Audit Stream**: Real-time telemetry ledger streaming all S3 API interactions with status codes and millisecond latency.
- 🛡️ **Bucket Governance**: Full management for Object Versioning, S3 Lifecycle rules (Glacier transitions), CORS configuration, and IAM Policies.
- 🔬 **Binary Hex Dump & Code Inspector**: Built-in `xxd`-style hexadecimal inspection for binaries and syntax-highlighted code/JSON viewer.
- 💻 **SDK Code Generator**: One-click snippets for cURL, AWS CLI, Python (boto3), Node.js (AWS SDK v3), and Go (v2).
- 🔒 **Security Hardened**: Strict path traversal prevention, double-slash normalization, bucket isolation, and MIME sanitization.

---

## 🏗️ Architecture

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

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >= 18.x (Node 20+ recommended)
- **Docker & Docker Compose**: For local MinIO server
- **npm** or **pnpm** / **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/eayushsingh/s3Bucket.git
cd s3Bucket
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Start Storage Engine and Development Server
```bash
# Automatically launches autonomous MinIO supervisor & starts Next.js dev server
npm run dev
```

> **Zero-Configuration Self-Healing Guarantee**:
> If MinIO is not already running, the built-in storage supervisor automatically detects your native MinIO binary or Docker daemon, launches the background engine, and connects seamlessly. If neither is available, it transparently falls back to the embedded filesystem engine without throwing `ECONNREFUSED`!

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Next.js Storage Console**: [http://localhost:3000](http://localhost:3000)
- **MinIO S3 API Endpoint**: `http://localhost:9000`
- **MinIO Admin Web Console**: `http://localhost:9001`
  - *Username*: `minioadmin`
  - *Password*: `minioadmin_secure_password_123`

### Diagnostics & Management
```bash
npm run storage:health      # Run full diagnostic on port 9000, docker, and daemon
npm run storage:start       # Manually trigger supervisor daemon launch
npm run storage:watchdog    # Run background self-healing watchdog loop
```

---

## 📦 Directory Structure

```
├── app/
│   ├── api/
│   │   ├── health/storage/          # Health check & connectivity ping
│   │   └── storage/
│   │       ├── buckets/             # Bucket management (CRUD)
│   │       ├── objects/             # Object listings & metadata
│   │       ├── upload-url/          # Single-part presigned PUT URL generator
│   │       ├── download-url/        # Presigned GET URL generator
│   │       ├── confirm-upload/      # DB metadata sync hook
│   │       └── multipart/           # S3 Multipart upload routes (init/part/complete/abort)
│   ├── layout.tsx                   # Root layout with dark theme
│   ├── page.tsx                     # Main Storage Console dashboard
│   └── globals.css                  # Design system tokens & animations
├── components/
│   ├── BucketManager.tsx            # Bucket selector and creation drawer
│   ├── FileExplorer.tsx             # File table, search, filters & actions
│   ├── FileUploadModal.tsx          # Direct presigned upload dialog
│   ├── MultipartUploadModal.tsx     # Chunked multipart upload manager
│   ├── PresignedUrlModal.tsx        # Temporary shareable URL generator
│   ├── ObjectDetailDrawer.tsx       # Object inspector & metadata view
│   └── HealthBadge.tsx              # Real-time storage engine status
├── db/
│   └── metadata.ts                  # SQLite persistent object metadata store
├── docker/
│   └── minio/init.sh                # Container bootstrap & policy script
├── lib/
│   └── api-response.ts              # Unified HTTP response helper
├── storage/
│   ├── minio.client.ts              # S3Client singleton with connection pooling
│   ├── sanitizer.ts                 # Key validation & path traversal defense
│   ├── storage.config.ts            # Environment schema & validation
│   ├── storage.errors.ts            # Custom typed storage exception hierarchy
│   ├── storage.service.ts           # Core S3 SDK storage abstraction
│   └── storage.types.ts             # Domain interfaces & TypeScript types
├── scripts/
│   ├── init-storage.ts              # Bucket auto-creation CLI script
│   └── start-minio.ts               # Local Docker health-check runner
├── tests/
│   └── storage/                     # Comprehensive Vitest test suite
└── docker-compose.yml               # Production-ready MinIO container stack
```

---

## 🔌 API Reference

### Health & Status
- `GET /api/health/storage` — Returns storage engine health, latency, and bucket count.

### Bucket Management
- `GET /api/storage/buckets` — List all buckets in the storage engine.
- `POST /api/storage/buckets` — Create a new bucket.
- `DELETE /api/storage/buckets/:name` — Delete an empty bucket.

### Presigned Single-Part Uploads & Downloads
- `POST /api/storage/upload-url` — Generate short-lived presigned PUT URL.
  ```json
  {
    "bucket": "public-assets",
    "key": "documents/report.pdf",
    "contentType": "application/pdf",
    "expiresIn": 3600
  }
  ```
- `POST /api/storage/download-url` — Generate short-lived presigned GET URL.
- `POST /api/storage/confirm-upload` — Verify object existence in S3 and save metadata into SQLite.

### S3 Multipart Uploads (Large Files)
- `POST /api/storage/multipart/initiate` — Start a multipart upload session and receive `uploadId`.
- `POST /api/storage/multipart/presigned-part-urls` — Generate batch presigned URLs for part numbers.
- `POST /api/storage/multipart/complete` — Assemble parts into final S3 object.
- `POST /api/storage/multipart/abort` — Abort upload session and clean up orphaned parts.

---

## ⚙️ Configuration (.env)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `STORAGE_ENDPOINT` | MinIO internal endpoint for S3 SDK | `http://127.0.0.1:9000` |
| `STORAGE_PUBLIC_ENDPOINT` | External endpoint returned in presigned URLs | `http://localhost:9000` |
| `STORAGE_REGION` | S3 Region | `us-east-1` |
| `STORAGE_ACCESS_KEY` | Root/IAM Access Key | `minioadmin` |
| `STORAGE_SECRET_KEY` | Root/IAM Secret Key | `minioadmin_secure_password_123` |
| `STORAGE_USE_SSL` | Enable HTTPS | `false` |
| `STORAGE_DEFAULT_BUCKET` | Default active bucket | `public-assets` |
| `STORAGE_PRESIGNED_EXPIRY` | Default URL expiration (seconds) | `3600` |
| `DATABASE_PATH` | Path to SQLite metadata database file | `./data/metadata.sqlite` |

---

## 📚 Technology Stack & Library Rationale (About the Engine)

Every dependency in `s3Bucket` was carefully selected to satisfy high-throughput cloud storage constraints, zero-RAM proxying, strict type safety, and real-time operational visibility:

| Package | Version | Architectural Role | Why Selected |
|---|---|---|---|
| **Next.js** | `^14.2.24` | Full-stack application engine & route handlers | Provides zero-RAM proxying via streaming route handlers, production-grade bundling, and server execution without needing detached API instances. |
| **React & React-DOM** | `^18.3.1` | Reactive UI and concurrent rendering | Powers concurrent UI updates, real-time file exploration, upload queues, and modal dialogs with optimal re-render cycles. |
| **@aws-sdk/client-s3** | `^3.758.0` | Modular S3 protocol engine | Modular AWS SDK v3 client (~2MB) replaces legacy monolithic SDK v2 (~70MB). Supports tree-shaking, native TypeScript typings, and multipart uploads. |
| **@aws-sdk/s3-request-presigner** | `^3.758.0` | SigV4 cryptographic signature generator | Generates time-limited HMAC-SHA256 presigned URLs, offloading multi-GB file transfers directly from browser to MinIO without touching Node.js server RAM. |
| **better-sqlite3** | `^11.8.1` | Synchronous WAL operational audit ledger | C-backed synchronous SQLite binding avoiding promise churn. Operates in Write-Ahead Logging (WAL) mode for microsecond audit logging without external databases. |
| **zod** | `^3.24.2` | Runtime validation & defensive security | Eliminates duplicate typings by deriving TypeScript types directly from runtime schemas. Enforces S3 bucket DNS RFC-1123 rules and path traversal defense. |
| **lucide-react** | `^0.475.0` | Industrial icon system | Lightweight, tree-shakeable SVG glyphs providing clear visual indicators for storage classes, cluster status, and navigation. |
| **Tailwind CSS** | `^3.4.17` | Utility styling & industrial tokens | JIT-compiled zero-runtime CSS with custom high-density dark mode palette (zinc/sky/emerald) tailored for system consoles. |
| **clsx & tailwind-merge** | `^2.1.1` / `^3.0.1` | Safe utility class composition | Prevents CSS specificity collisions when dynamically composing component styling variants. |
| **Vitest** | `^3.0.5` | Vite-native unit test runner | Native ESM and TypeScript test runner executing 48+ test specs in sub-second durations. |
| **tsx** | `^4.19.3` | TypeScript CLI script execution | Instant script executor powered by esbuild for storage bootstrap and seed routines (`scripts/start-minio.ts`). |
| **TypeScript** | `^5.7.3` | End-to-end static type verification | Enforces strict compile-time type safety across AWS SDK v3 commands, route handlers, and UI props. |
| **MinIO** | `RELEASE.2024-05-10+` | S3 API-compatible object storage server | Industry standard high-performance distributed object server with 100% S3 compatibility, local disk persistence, and admin console. |
| **Docker Compose** | `v2.x Compose Spec` | Container orchestration | Declarative multi-container configuration guaranteeing reproducible environments across macOS, Linux, and Windows. |

### Architectural Guarantees
1. **Zero-RAM Web Proxying**: Large uploads stream directly between browser and MinIO via SigV4 URLs. The web server never holds multipart binaries in memory.
2. **Modular AWS SDK v3**: Only the necessary S3 client commands are bundled, keeping server bundle sizes under 3MB.
3. **Synchronous WAL Auditability**: Every bucket or object action is synchronously journaled in `better-sqlite3` before HTTP response completion.
4. **Interactive In-App About Console**: Access the live interactive technology stack and architecture blueprint in the application by pressing `A` or navigating to `/about`.

---

## 🧪 Testing

Run unit and integration tests using Vitest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🔒 Security Best Practices

1. **Path Traversal Defense**: All object keys are sanitized through `storage/sanitizer.ts`, stripping leading slashes, `..` patterns, and control characters.
2. **Short-Lived Credentials**: Presigned URLs expire automatically (default 1 hour), mitigating link hijacking.
3. **MIME Whitelisting**: Strict MIME type enforcement on direct uploads.
4. **Secret Isolation**: Root credentials remain exclusively on the server backend and are never sent to the browser.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

## 🎛️ AWS S3 Management Console UI

The console replicates the official **Amazon S3 Management Console** using AWS Cloudscape Dark design tokens, global header navigation, and all 6 core bucket administration tabs: Objects, Properties, Permissions, Metrics, Management, and Access Points.
