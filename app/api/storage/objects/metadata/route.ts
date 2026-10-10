import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { getFileRecordByKey } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const MetadataQuerySchema = z.object({
  bucket: z.string().min(1),
  objectKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucket, objectKey } = MetadataQuerySchema.parse(body);

    const exists = await storageService.objectExists(bucket, objectKey);
    if (!exists) {
      return successResponse({ exists: false, bucket, objectKey });
    }

    const s3Metadata = await storageService.getObjectMetadata(bucket, objectKey);
    const dbRecord = getFileRecordByKey(bucket, objectKey);

    return successResponse({
      exists: true,
      bucket,
      objectKey,
      s3: s3Metadata,
      db: dbRecord,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
