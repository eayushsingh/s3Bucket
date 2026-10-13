/**
 * Next.js Server Lifecycle Instrumentation Hook.
 * Automatically runs at server startup to guarantee the MinIO S3 storage daemon
 * is healthy and running before any incoming user HTTP requests arrive.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureMinIOEngineRunning } = await import("./storage/minio-supervisor");
      const result = await ensureMinIOEngineRunning();
      console.log(`[Lifecycle Engine] MinIO Storage Server Status: ${result.mode} (${result.message})`);
    } catch (err: any) {
      console.warn(`[Lifecycle Engine] Background MinIO initialization warning: ${err.message}`);
    }
  }
}
