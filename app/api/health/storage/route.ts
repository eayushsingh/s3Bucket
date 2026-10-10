import { NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await storageService.checkHealth();
  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(
    {
      success: health.status === "healthy",
      data: {
        ...health,
        version: "1.2.0",
        architecture: "Zero-RAM-Proxy",
        stackEndpoint: "/api/system/stack",
      },
    },
    {
      status: statusCode,
      headers: {
        "X-Application-Version": "1.2.0",
        "X-Storage-Engine": "AWS-SDK-v3/MinIO",
        "X-Audit-Ledger": "SQLite-WAL",
        "Cache-Control": "no-store",
      },
    }
  );
}
