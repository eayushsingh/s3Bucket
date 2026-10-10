# 📋 Changelog

All notable changes to the **S3-MinIO Storage System** (`s3-minio-storage-system`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-11

### 🚀 Added
- **Interactive About System & Technology Stack Console**:
  - Full-featured multi-tab inspection modal (`AboutModal.tsx`) accessible via navigation header, `A` / `a` hotkey, and `⌘K` Command Palette.
  - Dedicated standalone route `/about` (`app/about/page.tsx`) for direct bookmarking, link sharing, and external audit review.
  - Comprehensive technology inventory data registry (`lib/technology-stack.ts`) covering all 14 core runtime, cloud SDK, database, validation, UI, and tooling packages.
- **Deep-Dive Architectural Explainers**:
  - **Zero-RAM Streaming Explainer** (`ZeroRamExplainer.tsx`): Detailed memory benchmarking contrasting naive buffering anti-patterns against direct SigV4 browser-to-MinIO streaming.
  - **AWS SDK v3 vs Legacy v2 Comparison** (`SdkComparisonSection.tsx`): Technical analysis covering bundle footprints (~2MB vs ~70MB), per-command tree-shaking, and first-class TypeScript typing.
  - **SQLite WAL Audit Ledger Deep Dive** (`SqliteAuditExplainer.tsx`): Rationale for selecting synchronous `better-sqlite3`, Write-Ahead Logging (WAL) concurrency, and table schema inspection.
  - **Zod Defensive Validation Showcase** (`ZodValidationExplainer.tsx`): DNS RFC-1123 bucket naming validation, object key path traversal defense (`../` stripping), and null-byte elimination.
- **System Introspection & SBOM Engine**:
  - Live API endpoint `GET /api/system/stack`: Exposes host Node.js version, platform, architecture, heap memory usage, S3 connection status, and package metadata.
  - Software Bill of Materials (SBOM) exporter (`lib/sbom-exporter.ts`): One-click generation of JSON, Markdown, and CycloneDX 1.5 standard compliance exports.
- **Documentation**:
  - Dedicated `ARCHITECTURE.md`: High-level system blueprint, subsystem breakdown, sequence protocols, and security boundaries.
  - Dedicated `DEPENDENCIES.md`: Complete Software Bill of Materials, licensing breakdown (MIT, Apache-2.0, ISC, AGPL-3.0), and maintainer credits.
  - Updated `README.md`: New Technology Stack & Architectural Rationale chapter.
- **Automated Testing Suite**:
  - `tests/lib/technology-stack.test.ts`: Validates metadata completeness, uniqueness, and search utilities.
  - `tests/api/system-stack.test.ts`: End-to-end route handler testing for system stack endpoint.
  - `tests/utils/sbom-export.test.ts`: Verifies JSON, Markdown, and CycloneDX SBOM output validity.
  - `tests/components/about-stack.test.ts`: Validates 1-to-1 mapping between package.json dependencies and registry items.
  - `tests/api/health.test.ts`: Verifies application version and storage engine response headers.

### 🔄 Changed
- Enhanced `HealthBadge.tsx` tooltip with engine specifics (`AWS SDK v3 / SigV4`) and live status indicators.
- Upgraded `KeyboardShortcutsModal.tsx` and global keyboard listener with `a` shortcut for About modal.
- Upgraded `CommandPalette.tsx` with instant commands to view the Technology Stack and Architecture Blueprint.
- Enriched `GET /api/health/storage` with `X-Application-Version: 1.2.0`, `X-Storage-Engine: AWS-SDK-v3/MinIO`, and `X-Audit-Ledger: SQLite-WAL` headers.

---

## [1.1.0] - 2026-10-10

### 🚀 Added
- Industrial Systems Console layout with high data density and monospace precision.
- Zero-RAM SigV4 Presigned URL upload and download generator.
- Resilient Multipart Chunk upload engine for multi-gigabyte payloads.
- Live SQLite-backed operational audit log drawer in WAL mode.
- Bucket governance panel for Object Versioning, Lifecycle rules, CORS, and IAM policies.
- Built-in binary hex dump viewer (`xxd` style) and syntax-highlighted code inspector.
- Multi-language SDK code snippet generator for cURL, AWS CLI, Python boto3, Node.js, and Go.
