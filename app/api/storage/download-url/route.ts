import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { getFileRecordByKey } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ObjectNotFoundError } from "@/storage/storage.errors";

export const dynamic = "force-dynamic";

const PresignedDownloadSchema = z.object({
  bucket: z.string().min(1, "Bucket is required"),
  objectKey: z.string().min(1, "Object key is required"),
  expiresInSeconds: z.number().int().positive().optional(),
  asAttachment: z.boolean().optional().default(false),
  customFileName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PresignedDownloadSchema.parse(body);

    // Verify object exists in storage
    const exists = await storageService.objectExists(data.bucket, data.objectKey);
    if (!exists) {
      throw new ObjectNotFoundError(data.bucket, data.objectKey);
    }

    // Retrieve database metadata for original filename and MIME type
    const record = getFileRecordByKey(data.bucket, data.objectKey);
    const fileName = data.customFileName || record?.originalFileName || data.objectKey.split("/").pop() || "download";

    const responseDisposition = data.asAttachment
      ? `attachment; filename="${encodeURIComponent(fileName)}"`
      : `inline; filename="${encodeURIComponent(fileName)}"`;

    const presigned = await storageService.createDownloadPresignedUrl({
      bucket: data.bucket,
      objectKey: data.objectKey,
      expiresInSeconds: data.expiresInSeconds,
      responseDisposition,
      responseContentType: record?.mimeType,
    });

    return successResponse({
      downloadUrl: presigned.url,
      objectKey: presigned.objectKey,
      bucket: presigned.bucket,
      expiresAt: presigned.expiresAt,
      expiresInSeconds: presigned.expiresInSeconds,
      fileName,
      mimeType: record?.mimeType,
      size: record?.size,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
