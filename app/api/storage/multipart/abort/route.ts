import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { markFileDeleted } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const AbortMultipartSchema = z.object({
  bucket: z.string().min(1),
  objectKey: z.string().min(1),
  uploadId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = AbortMultipartSchema.parse(body);

    await storageService.abortMultipartUpload(data.bucket, data.objectKey, data.uploadId);
    markFileDeleted(data.bucket, data.objectKey);

    return successResponse({
      aborted: true,
      bucket: data.bucket,
      objectKey: data.objectKey,
      uploadId: data.uploadId,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
