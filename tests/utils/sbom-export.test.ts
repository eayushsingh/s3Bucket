import { describe, it, expect } from "vitest";
import {
  generateLibrariesJson,
  generateLibrariesMarkdown,
  generateCycloneDxSbom,
  exportDependencies,
} from "../../lib/sbom-exporter";
import { LIBRARIES_REGISTRY } from "../../lib/technology-stack";

describe("SBOM Exporter Utilities", () => {
  it("should generate valid JSON containing all registered components", () => {
    const jsonStr = generateLibrariesJson();
    expect(jsonStr).toBeTruthy();

    const parsed = JSON.parse(jsonStr);
    expect(parsed.bomFormat).toBe("s3Bucket-inventory");
    expect(parsed.componentCount).toBe(LIBRARIES_REGISTRY.length);
    expect(parsed.components.length).toBe(LIBRARIES_REGISTRY.length);
  });

  it("should generate valid markdown table with headers and library entries", () => {
    const md = generateLibrariesMarkdown();
    expect(md).toContain("# Software Bill of Materials (SBOM)");
    expect(md).toContain("| Package Name | Version | Category | License | Architectural Role |");
    expect(md).toContain("Next.js");
    expect(md).toContain("@aws-sdk/client-s3");
    expect(md).toContain("better-sqlite3");
  });

  it("should generate valid CycloneDX 1.5 specification compliant SBOM", () => {
    const cycloneStr = generateCycloneDxSbom();
    const parsed = JSON.parse(cycloneStr);

    expect(parsed.bomFormat).toBe("CycloneDX");
    expect(parsed.specVersion).toBe("1.5");
    expect(parsed.metadata.component.name).toBe("s3-minio-storage-system");
    expect(parsed.components.length).toBe(LIBRARIES_REGISTRY.length);

    for (const comp of parsed.components) {
      expect(comp.type).toBe("library");
      expect(comp.name).toBeTruthy();
      expect(comp.version).toBeTruthy();
      expect(comp.licenses[0].license.id).toBeTruthy();
      expect(comp.externalReferences.length).toBeGreaterThan(0);
    }
  });

  it("should format correctly via generic exportDependencies dispatcher", () => {
    const json = exportDependencies("json");
    expect(() => JSON.parse(json)).not.toThrow();

    const md = exportDependencies("markdown");
    expect(md.startsWith("#")).toBe(true);

    const cyclonedx = exportDependencies("cyclonedx");
    expect(() => JSON.parse(cyclonedx)).not.toThrow();
  });
});
