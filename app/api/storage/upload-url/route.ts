import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { storageService } from "@/storage/storage.service";
import { generateSafeObjectKey } from "@/storage/sanitizer";
import { saveFileRecord } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";
import { FileSizeExceededError, InvalidMimeTypeError } from "@/storage/storage.errors";

export const dynamic = "force-dynamic";

const PresignedUploadSchema = z.object({
  bucket: z.string().min(1, "Bucket is required"),
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.number().int().positive("File size must be a positive integer"),
  prefix: z.string().optional(),
  userId: z.string().optional().default("anonymous"),
  customMetadata: z.record(z.any()).optional(),
  expiresInSeconds: z.number().int().positive().optional(),
});

// Allowed MIME prefixes for safety check (allows arbitrary safe binaries, rejects dangerous executable scripts if needed)
const DISALLOWED_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-sh",
  "application/x-csh",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PresignedUploadSchema.parse(body);

    if (DISALLOWED_MIME_TYPES.includes(data.mimeType.toLowerCase())) {
      throw new InvalidMimeTypeError(data.mimeType);
    }

    // Check file size against 5GB limit (or single-part limit)
    const maxAllowed = 5 * 1024 * 1024 * 1024;
    if (data.fileSize > maxAllowed) {
      throw new FileSizeExceededError(data.fileSize, maxAllowed);
    }

    // Generate safe collision-resistant object key
    const objectKey = generateSafeObjectKey({
      originalFileName: data.fileName,
      prefix: data.prefix,
      userId: data.userId !== "anonymous" ? data.userId : undefined,
      includeDatePrefix: true,
    });

    // Generate presigned PUT URL
    const presigned = await storageService.createUploadPresignedUrl({
      bucket: data.bucket,
      objectKey,
      contentType: data.mimeType,
      expiresInSeconds: data.expiresInSeconds,
      metadata: {
        "original-filename": encodeURIComponent(data.fileName),
        "uploaded-by": data.userId,
      },
    });

    // Record pending metadata record in DB
    const fileId = crypto.randomUUID();
    const record = saveFileRecord({
      id: fileId,
      userId: data.userId,
      bucket: data.bucket,
      objectKey,
      originalFileName: data.fileName,
      mimeType: data.mimeType,
      size: data.fileSize,
      status: "pending",
      customMetadata: data.customMetadata,
    });

    return successResponse({
      fileId: record.id,
      uploadUrl: presigned.url,
      objectKey: presigned.objectKey,
      bucket: presigned.bucket,
      expiresAt: presigned.expiresAt,
      expiresInSeconds: presigned.expiresInSeconds,
      headers: presigned.headers,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
