import fs from "fs";
import { execSync } from "child_process";

const CANDIDATE_PATHS = [
  "/opt/homebrew/bin/minio",
  "/usr/local/bin/minio",
  "/usr/bin/minio",
  "/bin/minio",
  `${process.env.HOME}/.local/bin/minio`,
  `${process.env.HOME}/bin/minio`,
];

/**
 * Searches system PATH and standard Unix/Mac installation directories for the minio binary.
 */
export function findNativeMinIOBinary(): string | null {
  // Check candidate paths first
  for (const candidate of CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        // Not executable
      }
    }
  }

  // Fallback to which/where command
  try {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "where minio" : "which minio";
    const output = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], timeout: 1500 })
      .toString()
      .trim();

    if (output && fs.existsSync(output.split("\n")[0])) {
      return output.split("\n")[0].trim();
    }
  } catch {
    // Binary not on PATH
  }

  return null;
}
