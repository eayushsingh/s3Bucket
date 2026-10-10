import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { saveFileRecord, getFileRecordByKey } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ConfirmUploadSchema = z.object({
  bucket: z.string().min(1),
  objectKey: z.string().min(1),
  fileId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucket, objectKey, fileId } = ConfirmUploadSchema.parse(body);

    // Verify object actually exists in MinIO/S3
    const metadata = await storageService.getObjectMetadata(bucket, objectKey);

    // Retrieve existing or create new record
    const existing = getFileRecordByKey(bucket, objectKey);

    const record = saveFileRecord({
      id: fileId || existing?.id || crypto.randomUUID(),
      userId: existing?.userId || "anonymous",
      bucket,
      objectKey,
      originalFileName: existing?.originalFileName || objectKey.split("/").pop() || "unknown",
      mimeType: metadata.contentType || existing?.mimeType || "application/octet-stream",
      size: metadata.size,
      etag: metadata.etag,
      status: "uploaded",
      customMetadata: existing?.customMetadata,
    });

    return successResponse({
      record,
      verified: true,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
