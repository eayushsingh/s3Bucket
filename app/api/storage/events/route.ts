import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/storage/audit.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket") || undefined;
    const operation = searchParams.get("operation") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;
    const since = searchParams.get("since") || undefined;

    const events = auditService.getEvents({ bucket, operation, limit, since });

    return NextResponse.json(
      formatSuccessResponse({
        events,
        count: events.length,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("AUDIT_FETCH_FAILED", error.message || "Failed to retrieve audit events"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, bucket, objectKey, statusCode, latencyMs, details } = body;

    if (!operation) {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "operation name is required"),
        { status: 400 }
      );
    }

    const event = auditService.record({
      operation,
      bucket,
      objectKey,
      statusCode: statusCode ?? 200,
      latencyMs: latencyMs ?? 0,
      details,
    });

    return NextResponse.json(formatSuccessResponse(event), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("AUDIT_RECORD_FAILED", error.message || "Failed to record audit event"),
      { status: 500 }
    );
  }
}
