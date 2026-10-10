import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { generateSafeObjectKey } from "@/storage/sanitizer";
import { saveFileRecord } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MultipartInitiateSchema = z.object({
  bucket: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  prefix: z.string().optional(),
  userId: z.string().optional().default("anonymous"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = MultipartInitiateSchema.parse(body);

    const objectKey = generateSafeObjectKey({
      originalFileName: data.fileName,
      prefix: data.prefix,
      userId: data.userId !== "anonymous" ? data.userId : undefined,
      includeDatePrefix: true,
    });

    const initiateResult = await storageService.initiateMultipartUpload(
      data.bucket,
      objectKey,
      data.mimeType,
      {
        "original-filename": encodeURIComponent(data.fileName),
        "uploaded-by": data.userId,
      }
    );

    const fileId = crypto.randomUUID();
    saveFileRecord({
      id: fileId,
      userId: data.userId,
      bucket: data.bucket,
      objectKey,
      originalFileName: data.fileName,
      mimeType: data.mimeType,
      size: data.fileSize,
      status: "pending",
    });

    return successResponse({
      fileId,
      uploadId: initiateResult.uploadId,
      objectKey: initiateResult.objectKey,
      bucket: initiateResult.bucket,
      partSize: initiateResult.partSize,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
