# Enterprise S3 Object Storage Operational Manual & Systems Runbook

```
  +-------------------------------------------------------------------------+
  |                   S3 / MinIO Storage Engine Architecture                |
  +-------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
  [ Client Browser / CLI ]                                  [ Next.js API Layer ]
  - Direct Presigned PUT/GET                                 - SigV4 Presigner
  - Zero RAM Server Bottleneck                              - SQLite Metadata Index
  - Resilient Multipart Chunking                            - Audit Stream Ledger
         |                                                         |
         +----------------------------+----------------------------+
                                      |
                                      v
                        [ MinIO S3 Compatible Daemon ]
                        - Port 9000: S3 API Subsystem
                        - Port 9001: Console Web GUI
                        - Local NVMe / Block Volume Storage
```

---

## 1. Executive Summary & Design Principles

This platform provides an industrial-grade, AWS-independent S3-compatible cloud object storage management platform. 

### Core Design Philosophy:
1. **Utilitarian Systems Aesthetics**: Designed like high-reliability telemetry control consoles (Datadog, AWS CloudWatch, Linear, Grafana). Zero superficial pastel gradients, zero bloated cartoon cards, zero intrusive animations.
2. **Zero-Proxy Architecture**: Large files and binary payloads bypass the application backend server entirely. Clients negotiate cryptographically signed AWS SigV4 presigned URLs from Next.js, and stream bytes directly into the S3 storage engine.
3. **Resilient Chunked Multipart Pipeline**: Files larger than 10MB are split into discrete 10MB parts with individual checksum ETags and assembled atomically by the S3 engine.
4. **Full Governance & Observability**: Real-time operational audit log ledger, cluster round-trip latency probe, bucket lifecycle rules, bucket CORS configuration, and IAM access policies.

---

## 2. Storage Consistency & Concurrency Model

- **Read-After-Write Consistency**: Both MinIO and AWS S3 guarantee strong read-after-write consistency for `PUT` and `DELETE` requests of objects across all buckets.
- **Concurrent Writes**: S3 resolves simultaneous `PUT` requests to the exact same key using last-write-wins timestamp ordering.
- **Atomic Multipart Assembly**: When finalizing a multipart upload (`CompleteMultipartUpload`), the combined object becomes atomically visible. Failed or aborted multipart sessions consume zero storage namespace once `AbortMultipartUpload` executes.

---

## 3. Storage Tiering & Lifecycle Policies

| Storage Class | Use Case | Latency | Minimum Duration |
| :--- | :--- | :--- | :--- |
| **STANDARD** | Active datasets, web assets, hot telemetry | Milliseconds | None |
| **INTELLIGENT_TIERING** | Unpredictable or fluctuating access patterns | Milliseconds | None |
| **STANDARD_IA** | Long-lived, infrequently accessed backups | Milliseconds | 30 days |
| **GLACIER** | Archive records, compliance data, audits | Minutes / Hours | 90 days |
| **DEEP_ARCHIVE** | Cold multi-year compliance records | Hours (12-48h) | 180 days |

---

## 4. Operational CLI Commands & Diagnostics

### MinIO Client (`mc`) Quick Reference:
```bash
# Configure local alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
mc ls local

# Inspect bucket metadata and disk usage
mc du local/app-uploads

# Mirror / backup bucket to disk
mc mirror local/app-uploads /mnt/backups/s3-mirror/

# Set public download policy
mc anonymous set download local/app-uploads/public
```

### Direct `curl` Presigned Upload Example:
```bash
# Upload a binary payload directly to presigned PUT URL
curl -X PUT "http://localhost:9000/app-uploads/dump.tar.gz?X-Amz-Signature=..." \
  -H "Content-Type: application/gzip" \
  --data-binary "@/tmp/dump.tar.gz"
```

---

## 5. Security Posture & Hardening

1. **Least Privilege IAM**: Generate granular credentials for applications using MinIO Identity policies rather than root keys.
2. **Presigned Expiration Strictness**: Presigned upload URLs default to 15-60 minutes maximum window to eliminate replay vulnerabilities.
3. **Key Sanitization**: All object keys are checked against path traversal exploits (`../`, null bytes, control sequences).
4. **TLS / SSL Termination**: For production deployments, place an Nginx, Caddy, or AWS ALB reverse proxy with Let's Encrypt TLS in front of port 9000.

---

## 6. Disaster Recovery & Backup Strategy

1. **Volume Snapshots**: MinIO stores raw blocks under `/data`. Daily NVMe/EBS snapshot backups provide zero-downtime point-in-time recovery.
2. **Replication**: Configure continuous asynchronous cluster-to-cluster replication using `mc replicate add local/app-uploads remote/app-uploads`.
