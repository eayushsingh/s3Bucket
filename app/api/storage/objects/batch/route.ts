import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/storage/storage.service";
import { formatSuccessResponse, formatErrorResponse } from "@/lib/api-response";
import { S3StorageClass } from "@/storage/storage.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bucket, keys, targetStorageClass, destBucket, destPrefix } = body;

    if (!bucket || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        formatErrorResponse("INVALID_ARGUMENT", "Bucket and an array of keys are required"),
        { status: 400 }
      );
    }

    if (action === "transition_storage_class") {
      if (!targetStorageClass) {
        return NextResponse.json(
          formatErrorResponse("INVALID_ARGUMENT", "targetStorageClass is required"),
          { status: 400 }
        );
      }

      const results = [];
      for (const key of keys) {
        try {
          await storageService.updateObjectStorageClass(bucket, key, targetStorageClass as S3StorageClass);
          results.push({ key, success: true });
        } catch (err: any) {
          results.push({ key, success: false, error: err.message });
        }
      }

      return NextResponse.json(
        formatSuccessResponse({
          action: "transition_storage_class",
          processed: results.length,
          results,
        })
      );
    }

    if (action === "copy") {
      const targetBucket = destBucket || bucket;
      const results = [];

      for (const key of keys) {
        const destKey = destPrefix ? `${destPrefix.replace(/\/$/, "")}/${key.split("/").pop()}` : `copy_${key}`;
        try {
          await storageService.copyObject(bucket, key, targetBucket, destKey);
          results.push({ sourceKey: key, destKey, success: true });
        } catch (err: any) {
          results.push({ sourceKey: key, success: false, error: err.message });
        }
      }

      return NextResponse.json(
        formatSuccessResponse({
          action: "copy",
          processed: results.length,
          results,
        })
      );
    }

    if (action === "delete") {
      await storageService.deleteObjects(bucket, keys);
      return NextResponse.json(
        formatSuccessResponse({
          action: "delete",
          deletedCount: keys.length,
          keys,
        })
      );
    }

    return NextResponse.json(
      formatErrorResponse("INVALID_ACTION", `Unsupported batch action: ${action}`),
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse("BATCH_OPERATION_FAILED", error.message || "Failed to process batch operation"),
      { status: 500 }
    );
  }
}
