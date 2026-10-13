import http from "http";
import net from "net";
import { StorageProbeResult } from "./minio-supervisor.types";

/**
 * Checks if a TCP port is currently accepting socket connections.
 */
export async function isTcpPortOpen(port: number, host = "127.0.0.1", timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Sends a lightweight HTTP request to the MinIO /minio/health/live endpoint.
 */
export async function probeMinIOHealthEndpoint(
  endpoint = "http://127.0.0.1:9000",
  timeoutMs = 1500
): Promise<StorageProbeResult> {
  const start = Date.now();
  const url = `${endpoint.replace(/\/$/, "")}/minio/health/live`;

  return new Promise((resolve) => {
    try {
      const req = http.get(url, (res) => {
        const latencyMs = Date.now() - start;
        // MinIO returns 200 on live probe, or 400/403 when reachable
        const reachable =
          res.statusCode === 200 ||
          res.statusCode === 400 ||
          res.statusCode === 403;
        resolve({
          reachable,
          statusCode: res.statusCode,
          latencyMs,
        });
      });

      req.on("error", (err) => {
        resolve({
          reachable: false,
          error: err.message,
          latencyMs: Date.now() - start,
        });
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve({
          reachable: false,
          error: "Request timed out",
          latencyMs: Date.now() - start,
        });
      });
    } catch (e: any) {
      resolve({
        reachable: false,
        error: e.message,
        latencyMs: Date.now() - start,
      });
    }
  });
}

