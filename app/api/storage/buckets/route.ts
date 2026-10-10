import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const CreateBucketSchema = z.object({
  bucketName: z
    .string()
    .min(3, "Bucket name must be at least 3 characters")
    .max(63, "Bucket name cannot exceed 63 characters")
    .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/, "Invalid S3 bucket name format"),
});

export async function GET() {
  try {
    const buckets = await storageService.listBuckets();
    return successResponse({ buckets });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucketName } = CreateBucketSchema.parse(body);

    const result = await storageService.createBucket(bucketName);
    return successResponse(result, result.created ? 201 : 200);
  } catch (err) {
    return errorResponse(err);
  }
}
