import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";
import { BucketCorsRule } from "@/storage/storage.types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const rules = await storageService.getBucketCors(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        rules,
        count: rules.length,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("CORS_FETCH_FAILED", error.message || "Failed to retrieve CORS configuration"),
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
    const rules: BucketCorsRule[] = body.rules;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Body must include an array of rules"),
        { status: 400 }
      );
    }

    await storageService.putBucketCors(bucket, rules);

    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        rules,
        applied: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("CORS_UPDATE_FAILED", error.message || "Failed to update CORS configuration"),
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    await storageService.deleteBucketCors(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        deleted: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("CORS_DELETE_FAILED", error.message || "Failed to delete CORS configuration"),
      { status: error.statusCode || 500 }
    );
  }
}
