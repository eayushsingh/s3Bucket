import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const PartUrlsSchema = z.object({
  bucket: z.string().min(1),
  objectKey: z.string().min(1),
  uploadId: z.string().min(1),
  partCount: z.number().int().min(1).max(10000),
  expiresInSeconds: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = PartUrlsSchema.parse(body);

    const partUrls = await storageService.createPresignedPartUrls(
      data.bucket,
      data.objectKey,
      data.uploadId,
      data.partCount,
      data.expiresInSeconds
    );

    return successResponse({
      uploadId: data.uploadId,
      parts: partUrls,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
