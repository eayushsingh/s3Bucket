import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const status = await storageService.getBucketVersioning(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        status,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("VERSIONING_FETCH_FAILED", error.message || "Failed to get versioning state"),
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const body = await request.json();
    const { status } = body;

    if (status !== "Enabled" && status !== "Suspended") {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Status must be 'Enabled' or 'Suspended'"),
        { status: 400 }
      );
    }

    await storageService.setBucketVersioning(bucket, status);

    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        status,
        updated: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("VERSIONING_UPDATE_FAILED", error.message || "Failed to update versioning state"),
      { status: error.statusCode || 500 }
    );
  }
}
