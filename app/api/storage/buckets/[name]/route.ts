import { NextRequest } from "next/server";
import { storageService } from "@/storage/storage.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucketName = params.name;
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    await storageService.deleteBucket(bucketName, force);
    return successResponse({ deleted: true, bucketName });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const bucketName = params.name;
    const exists = await storageService.bucketExists(bucketName);
    if (!exists) {
      return errorResponse({ statusCode: 404, message: `Bucket '${bucketName}' not found.` });
    }

    const objects = await storageService.listObjects(bucketName, { maxKeys: 1000 });
    const totalSize = objects.objects.reduce((sum, o) => sum + o.size, 0);

    return successResponse({
      name: bucketName,
      exists: true,
      totalObjects: objects.objects.length,
      totalSizeBytes: totalSize,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
