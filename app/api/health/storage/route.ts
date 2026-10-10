import { NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await storageService.checkHealth();
  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(
    {
      success: health.status === "healthy",
      data: health,
    },
    { status: statusCode }
  );
}
