import { storageService } from "../storage/storage.service";
import { loadStorageConfig } from "../storage/storage.config";

async function main() {
  console.log("==================================================");
  console.log("Initializing S3 / MinIO Storage Infrastructure...");
  console.log("==================================================");

  const config = loadStorageConfig();
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Region:   ${config.region}`);
  console.log(`Target Buckets: ${config.defaultBuckets.join(", ")}`);

  try {
    const health = await storageService.checkHealth();
    if (health.status !== "healthy") {
      console.warn("Storage health probe returned non-healthy status:", health);
    } else {
      console.log(`Connection successful (latency: ${health.latencyMs}ms)`);
    }

    for (const bucket of config.defaultBuckets) {
      const exists = await storageService.bucketExists(bucket);
      if (exists) {
        console.log(`[EXISTS]  Bucket: ${bucket}`);
      } else {
        const res = await storageService.createBucket(bucket);
        console.log(`[CREATED] Bucket: ${res.name}`);
      }
    }

    console.log("==================================================");
    console.log("Storage layer initialized successfully!");
    console.log("==================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("Initialization failed:", err.message);
    process.exit(1);
  }
}

main();
