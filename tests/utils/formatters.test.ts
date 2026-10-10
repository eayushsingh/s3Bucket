import { describe, it, expect } from "vitest";

describe("Industrial S3 Console Utility Formatters", () => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileCategory = (key: string) => {
    const ext = key.includes(".") ? key.split(".").pop()?.toLowerCase() || "" : "";
    if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "images";
    if (["json", "yaml", "csv", "txt", "md"].includes(ext)) return "documents";
    if (["zip", "tar", "gz"].includes(ext)) return "archives";
    return "binaries";
  };

  it("formats 0 bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes and megabytes with precision", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(15728640)).toBe("15 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("categorizes file extensions accurately", () => {
    expect(getFileCategory("avatar.png")).toBe("images");
    expect(getFileCategory("data.json")).toBe("documents");
    expect(getFileCategory("backup.tar.gz")).toBe("archives");
    expect(getFileCategory("blob.unknown")).toBe("binaries");
  });
});
