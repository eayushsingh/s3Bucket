import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");
    const maxBytesStr = searchParams.get("maxBytes");
    const maxBytes = maxBytesStr ? parseInt(maxBytesStr, 10) : 524288;

    if (!bucket || !key) {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Both 'bucket' and 'key' parameters are required"),
        { status: 400 }
      );
    }

    const content = await storageService.getObjectContent(bucket, key, maxBytes);
    return NextResponse.json(formatSuccessResponse(content));
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("CONTENT_FETCH_FAILED", error.message || "Failed to retrieve object content"),
      { status: error.statusCode || 500 }
    );
  }
}
