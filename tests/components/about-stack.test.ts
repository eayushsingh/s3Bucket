import { describe, it, expect } from "vitest";
import {
  LIBRARIES_REGISTRY,
  TECHNOLOGY_CATEGORIES,
  getLibrariesByCategory,
  searchLibraries,
} from "../../lib/technology-stack";
import { exportDependencies } from "../../lib/sbom-exporter";
import packageJson from "../../package.json";

describe("About System & Technology Stack Integrity Suite", () => {
  it("should match all production dependencies from package.json in the library registry", () => {
    const directProdDeps = Object.keys(packageJson.dependencies);
    const registryIds = LIBRARIES_REGISTRY.map((l) => l.id);
    const registryNames = LIBRARIES_REGISTRY.map((l) => l.name);

    // Verify key production dependencies are tracked
    for (const dep of directProdDeps) {
      const isTracked =
        registryNames.some((name) => name.toLowerCase().includes(dep.toLowerCase())) ||
        registryIds.some((id) => id.toLowerCase().includes(dep.toLowerCase()));
      expect(isTracked).toBe(true);
    }
  });

  it("should categorize all libraries into valid declared categories", () => {
    const validCategoryIds = new Set(TECHNOLOGY_CATEGORIES.map((c) => c.id));
    for (const lib of LIBRARIES_REGISTRY) {
      expect(validCategoryIds.has(lib.category)).toBe(true);
    }
  });

  it("should support granular searching across descriptions, rationales, and tags", () => {
    const presignSearch = searchLibraries("presign");
    expect(presignSearch.length).toBeGreaterThan(0);
    expect(presignSearch.some((l) => l.id === "aws-sdk-presigner")).toBe(true);

    const zeroRamSearch = searchLibraries("zero-ram");
    expect(zeroRamSearch.length).toBeGreaterThan(0);

    const cBindingSearch = searchLibraries("C-binding");
    expect(cBindingSearch.some((l) => l.id === "better-sqlite3")).toBe(true);
  });

  it("should produce consistent SBOM exports in JSON, Markdown and CycloneDX", () => {
    const jsonSbom = exportDependencies("json");
    const jsonParsed = JSON.parse(jsonSbom);
    expect(jsonParsed.components.length).toBe(LIBRARIES_REGISTRY.length);

    const mdSbom = exportDependencies("markdown");
    expect(mdSbom).toContain("| Package Name | Version | Category | License | Architectural Role |");
    expect(mdSbom).toContain("MinIO Storage Engine");

    const cycloneSbom = exportDependencies("cyclonedx");
    const cycloneParsed = JSON.parse(cycloneSbom);
    expect(cycloneParsed.bomFormat).toBe("CycloneDX");
    expect(cycloneParsed.specVersion).toBe("1.5");
    expect(cycloneParsed.components.length).toBe(LIBRARIES_REGISTRY.length);
  });
});
