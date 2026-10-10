import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const metrics = await storageService.getBucketMetrics(bucket);
    return NextResponse.json(formatSuccessResponse(metrics));
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("METRICS_CALCULATION_FAILED", error.message || "Failed to calculate storage metrics"),
      { status: error.statusCode || 500 }
    );
  }
}
