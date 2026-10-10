# 📦 Software Bill of Materials (SBOM) & Dependencies

This document provides a formal inventory of all third-party software components, libraries, runtimes, and build tools utilized in the **AWS S3 / MinIO Storage System** (`s3-minio-storage-system`).

---

## 1. Production Runtime Dependencies

The following dependencies are compiled into the production application bundle or required at server runtime:

| Package | Version Range | License | Maintainer / Vendor | Primary Purpose |
|---|---|---|---|---|
| **next** | `^14.2.24` | MIT | Vercel Inc. | Full-stack framework, App Router, SSR, route handlers |
| **react** | `^18.3.1` | MIT | Meta Open Source | Component lifecycle and virtual DOM diffing engine |
| **react-dom** | `^18.3.1` | MIT | Meta Open Source | DOM rendering bindings for React |
| **@aws-sdk/client-s3** | `^3.758.0` | Apache-2.0 | Amazon Web Services | Modular AWS SDK v3 client for S3 REST API commands |
| **@aws-sdk/s3-request-presigner** | `^3.758.0` | Apache-2.0 | Amazon Web Services | SigV4 cryptographic signature generation for direct PUT/GET |
| **better-sqlite3** | `^11.8.1` | MIT | Joshua Wise / WiseLibs | Synchronous C-binding SQLite engine in WAL mode for audit trail |
| **zod** | `^3.24.2` | MIT | Colin McDonnell | Declarative schema validation and static TypeScript inference |
| **lucide-react** | `^0.475.0` | ISC | Lucide Project | Lightweight SVG icon system for UI controls and telemetry |
| **tailwind-merge** | `^3.0.1` | MIT | Dany Castillo | Conflict-free merging of utility classes without CSS specificity collisions |
| **clsx** | `^2.1.1` | MIT | Luke Edwards | Conditional className string generator |

---

## 2. Developer & Build Tooling Dependencies

The following packages are utilized during compilation, testing, type-checking, and developer script execution:

| Package | Version Range | License | Primary Purpose |
|---|---|---|---|
| **typescript** | `^5.7.3` | Apache-2.0 | Static type analysis and strict compile-time checks |
| **vitest** | `^3.0.5` | MIT | High-speed Vite-native unit and integration test runner |
| **tsx** | `^4.19.3` | MIT | esbuild-powered zero-config TypeScript execution engine |
| **tailwindcss** | `^3.4.17` | MIT | Utility-first CSS generation compiler |
| **postcss** | `^8.5.2` | MIT | CSS transformation and Tailwind plugin runner |
| **autoprefixer** | `^10.4.20` | MIT | Vendor prefix injector for cross-browser CSS compliance |
| **@types/node** | `^20.17.19` | MIT | TypeScript type declarations for Node.js runtime |
| **@types/react** | `^18.3.18` | MIT | TypeScript type declarations for React |
| **@types/react-dom** | `^18.3.5` | MIT | TypeScript type declarations for ReactDOM |
| **@types/better-sqlite3** | `^7.6.12` | MIT | TypeScript type definitions for better-sqlite3 |

---

## 3. Storage Engine & Infrastructure Containers

| Component | Target Version | License | Deployment Pattern |
|---|---|---|---|
| **MinIO** | `RELEASE.2024-05-10+` | AGPL-3.0 | Docker container (`quay.io/minio/minio`) or external cluster |
| **Docker Compose** | `v2.x Specification` | Apache-2.0 | Local multi-service orchestrator |

---

## 4. License Compliance Breakdown

| License Type | Count | Permissive / Copyleft | Commercial Use Permitted? |
|---|---|---|---|
| **MIT** | 12 | Permissive | ✅ Yes |
| **Apache-2.0** | 3 | Permissive | ✅ Yes |
| **ISC** | 1 | Permissive | ✅ Yes |
| **AGPL-3.0** | 1 (External container) | Network Copyleft | ✅ Yes (As isolated service container via network boundary) |

All frontend and API application dependencies are licensed under standard permissive open-source licenses (MIT, Apache-2.0, ISC). MinIO is executed across a network boundary via Docker container, preserving strict license isolation.

---

## 5. Security & Vulnerability Auditing

To scan dependencies for known Common Vulnerabilities and Exposures (CVEs):

```bash
# Run npm security audit
npm audit

# Run CycloneDX SBOM generator via in-app console or API
curl http://localhost:3000/api/system/stack | jq .data.libraries
```
