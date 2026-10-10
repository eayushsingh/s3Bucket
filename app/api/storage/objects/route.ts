import { NextRequest } from "next/server";
import { z } from "zod";
import { storageService } from "@/storage/storage.service";
import { getFileRecordByKey, markFileDeleted, listFileRecords } from "@/db/metadata";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get("bucket");
    const prefix = url.searchParams.get("prefix") || "";
    const delimiter = url.searchParams.get("delimiter") || "";
    const maxKeys = parseInt(url.searchParams.get("maxKeys") || "1000", 10);
    const continuationToken = url.searchParams.get("continuationToken") || undefined;

    if (!bucket) {
      return errorResponse({ statusCode: 400, message: "Query parameter 'bucket' is required." });
    }

    const result = await storageService.listObjects(bucket, {
      prefix,
      delimiter,
      maxKeys,
      continuationToken,
    });

    // Enrich object list with DB records
    const enrichedObjects = result.objects.map((obj) => {
      const record = getFileRecordByKey(bucket, obj.key);
      return {
        ...obj,
        id: record?.id,
        userId: record?.userId,
        originalFileName: record?.originalFileName || obj.key.split("/").pop() || "",
        mimeType: record?.mimeType,
        status: record?.status || "uploaded",
        createdAt: record?.createdAt || obj.lastModified?.toISOString(),
      };
    });

    return successResponse({
      bucket,
      prefix,
      objects: enrichedObjects,
      prefixes: result.prefixes, // Virtual folders
      isTruncated: result.isTruncated,
      nextContinuationToken: result.nextContinuationToken,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const DeleteObjectsSchema = z.object({
  bucket: z.string().min(1),
  objectKeys: z.array(z.string()).min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucket, objectKeys } = DeleteObjectsSchema.parse(body);

    const result = await storageService.deleteObjects(bucket, objectKeys);

    for (const key of result.deleted) {
      markFileDeleted(bucket, key);
    }

    return successResponse({
      bucket,
      deletedKeys: result.deleted,
      errors: result.errors,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const CreateFolderSchema = z.object({
  bucket: z.string().min(1),
  folderPath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucket, folderPath } = CreateFolderSchema.parse(body);

    const normalizedPath = folderPath.trim().replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    await storageService.uploadObject(
      bucket,
      normalizedPath,
      Buffer.from(""),
      "application/x-directory"
    );

    return successResponse({
      bucket,
      folderPath: normalizedPath,
      created: true,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

