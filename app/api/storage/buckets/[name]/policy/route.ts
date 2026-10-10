import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucket = params.name;
    const policy = await storageService.getBucketPolicy(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        policy,
        hasPolicy: policy.length > 0,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("POLICY_FETCH_FAILED", error.message || "Failed to retrieve bucket policy"),
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
    const { policy } = body;

    if (!policy || typeof policy !== "string") {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Body must include policy string"),
        { status: 400 }
      );
    }

    try {
      JSON.parse(policy);
    } catch {
      return NextResponse.json(
        formatErrorResponse("INVALID_JSON", "Policy must be valid JSON syntax"),
        { status: 400 }
      );
    }

    await storageService.putBucketPolicy(bucket, policy);

    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        policy,
        updated: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("POLICY_UPDATE_FAILED", error.message || "Failed to update bucket policy"),
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
    await storageService.deleteBucketPolicy(bucket);
    return NextResponse.json(
      formatSuccessResponse({
        bucket,
        deleted: true,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("POLICY_DELETE_FAILED", error.message || "Failed to delete bucket policy"),
      { status: error.statusCode || 500 }
    );
  }
}
