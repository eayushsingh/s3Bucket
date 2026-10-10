import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";
import { BucketLifecycleRule } from "@/storage/storage.types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const rules = await storageService.getBucketLifecycle(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        rules,
        count: rules.length,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("LIFECYCLE_FETCH_FAILED", error.message || "Failed to retrieve lifecycle rules"),
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
    const rules: BucketLifecycleRule[] = body.rules;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Body must include an array of rules"),
        { status: 400 }
      );
    }

    await storageService.putBucketLifecycle(bucket, rules);

    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        rules,
        applied: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("LIFECYCLE_UPDATE_FAILED", error.message || "Failed to update lifecycle configuration"),
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
    await storageService.deleteBucketLifecycle(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        deleted: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("LIFECYCLE_DELETE_FAILED", error.message || "Failed to delete lifecycle configuration"),
      { status: error.statusCode || 500 }
    );
  }
}
