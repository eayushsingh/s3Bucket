import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { saveFileRecord, getFileRecordByKey } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const CompleteMultipartSchema = z.object({
  bucket: z.string().min(1),
  objectKey: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().min(1),
        ETag: z.string().min(1),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CompleteMultipartSchema.parse(body);

    const result = await storageService.completeMultipartUpload(
      data.bucket,
      data.objectKey,
      data.uploadId,
      data.parts
    );

    // Get actual metadata and mark uploaded in DB
    const metadata = await storageService.getObjectMetadata(data.bucket, data.objectKey);
    const existing = getFileRecordByKey(data.bucket, data.objectKey);

    const record = saveFileRecord({
      id: existing?.id || crypto.randomUUID(),
      userId: existing?.userId || "anonymous",
      bucket: data.bucket,
      objectKey: data.objectKey,
      originalFileName: existing?.originalFileName || data.objectKey.split("/").pop() || "unknown",
      mimeType: metadata.contentType || existing?.mimeType || "application/octet-stream",
      size: metadata.size,
      etag: result.etag || metadata.etag,
      status: "uploaded",
    });

    return successResponse({
      record,
      result,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
