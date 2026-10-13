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
