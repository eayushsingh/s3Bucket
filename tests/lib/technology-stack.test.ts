import { describe, it, expect } from "vitest";
import {
  LIBRARIES_REGISTRY,
  TECHNOLOGY_CATEGORIES,
  getLibrariesByCategory,
  searchLibraries,
} from "../../lib/technology-stack";

describe("Technology Stack Registry", () => {
  it("should contain all essential production libraries", () => {
    expect(LIBRARIES_REGISTRY.length).toBeGreaterThanOrEqual(12);

    const ids = LIBRARIES_REGISTRY.map((lib) => lib.id);
    expect(ids).toContain("nextjs");
    expect(ids).toContain("react");
    expect(ids).toContain("aws-sdk-client-s3");
    expect(ids).toContain("aws-sdk-presigner");
    expect(ids).toContain("better-sqlite3");
    expect(ids).toContain("zod");
    expect(ids).toContain("tailwindcss");
    expect(ids).toContain("vitest");
    expect(ids).toContain("minio");
  });

  it("should have unique IDs across all libraries", () => {
    const ids = LIBRARIES_REGISTRY.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should guarantee every library has required documentation fields", () => {
    for (const lib of LIBRARIES_REGISTRY) {
      expect(lib.id).toBeTruthy();
      expect(lib.name).toBeTruthy();
      expect(lib.version).toBeTruthy();
      expect(lib.license).toBeTruthy();
      expect(lib.description.length).toBeGreaterThan(10);
      expect(lib.whyChosen.length).toBeGreaterThan(15);
      expect(lib.architecturalRole.length).toBeGreaterThan(15);
      expect(lib.website.startsWith("http")).toBe(true);
      expect(lib.highlights.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("should filter libraries by category accurately", () => {
    const cloudLibs = getLibrariesByCategory("cloud");
    expect(cloudLibs.length).toBeGreaterThan(0);
    expect(cloudLibs.every((l) => l.category === "cloud")).toBe(true);

    const allLibs = getLibrariesByCategory("all");
    expect(allLibs.length).toBe(LIBRARIES_REGISTRY.length);
  });

  it("should search libraries by keyword, why-chosen explanation, and highlights", () => {
    const s3Results = searchLibraries("s3");
    expect(s3Results.length).toBeGreaterThan(0);

    const sqliteResults = searchLibraries("WAL");
    expect(sqliteResults.some((l) => l.id === "better-sqlite3")).toBe(true);

    const nonExistent = searchLibraries("xyzNonExistentKey123");
    expect(nonExistent.length).toBe(0);
  });

  it("should have valid category metadata for each defined category", () => {
    for (const cat of TECHNOLOGY_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.title).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(cat.iconName).toBeTruthy();
    }
  });
});
