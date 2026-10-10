import { NextResponse } from "next/server";
import { formatSuccessResponse } from "@/lib/api-response";
import { LIBRARIES_REGISTRY, TECHNOLOGY_CATEGORIES } from "@/lib/technology-stack";
import { storageConfig } from "@/storage/storage.config";

export const dynamic = "force-dynamic";

export async function GET() {
  const memory = process.memoryUsage();

  const runtimeSpecs = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssBytes: memory.rss,
      rssFormatted: `${(memory.rss / (1024 * 1024)).toFixed(2)} MB`,
      heapUsedBytes: memory.heapUsed,
      heapUsedFormatted: `${(memory.heapUsed / (1024 * 1024)).toFixed(2)} MB`,
      heapTotalBytes: memory.heapTotal,
      heapTotalFormatted: `${(memory.heapTotal / (1024 * 1024)).toFixed(2)} MB`,
    },
    storageBackend: {
      provider: "MinIO / S3 Compliant",
      endpoint: storageConfig.endpoint,
      region: storageConfig.region,
      forcePathStyle: storageConfig.forcePathStyle,
      presignedPutExpiry: `${storageConfig.presignedPutExpirySeconds}s`,
      presignedGetExpiry: `${storageConfig.presignedGetExpirySeconds}s`,
    },
    auditLedger: {
      engine: "better-sqlite3",
      mode: "Write-Ahead Logging (WAL)",
      dbPath: "./minio_data/audit.db",
    },
  };

  const responsePayload = {
    application: {
      name: "AWS S3 / MinIO Storage Console",
      version: "1.2.0",
      license: "MIT",
      architecture: "Next.js 14 App Router + Zero-RAM Direct Streaming Proxy",
    },
    categories: TECHNOLOGY_CATEGORIES,
    libraries: LIBRARIES_REGISTRY,
    summary: {
      totalLibraries: LIBRARIES_REGISTRY.length,
      categoriesCount: TECHNOLOGY_CATEGORIES.length,
    },
    runtime: runtimeSpecs,
  };

  return NextResponse.json(formatSuccessResponse(responsePayload), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
