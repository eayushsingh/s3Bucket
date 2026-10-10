import { LIBRARIES_REGISTRY, LibraryInfo } from "./technology-stack";

export type ExportFormat = "json" | "markdown" | "cyclonedx";

export function generateLibrariesJson(): string {
  return JSON.stringify(
    {
      bomFormat: "s3Bucket-inventory",
      specVersion: "1.0",
      generatedAt: new Date().toISOString(),
      componentCount: LIBRARIES_REGISTRY.length,
      components: LIBRARIES_REGISTRY,
    },
    null,
    2
  );
}

export function generateLibrariesMarkdown(): string {
  let md = "# Software Bill of Materials (SBOM) - AWS S3 / MinIO Console\n\n";
  md += `*Generated: ${new Date().toISOString()}*\n\n`;
  md += "| Package Name | Version | Category | License | Architectural Role |\n";
  md += "|---|---|---|---|---|\n";

  for (const lib of LIBRARIES_REGISTRY) {
    md += `| [${lib.name}](${lib.website}) | \`${lib.version}\` | ${lib.category} | ${lib.license} | ${lib.architecturalRole.replace(/\|/g, "\\|")} |\n`;
  }

  return md;
}

export function generateCycloneDxSbom(): string {
  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:s3bucket-bom-${Date.now()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "Antigravity Engineering",
          name: "s3Bucket Console Introspection",
          version: "1.1.0",
        },
      ],
      component: {
        type: "application",
        name: "s3-minio-storage-system",
        version: "1.1.0",
        licenses: [{ license: { id: "MIT" } }],
      },
    },
    components: LIBRARIES_REGISTRY.map((lib) => ({
      type: "library",
      name: lib.name,
      version: lib.version.replace(/^\^|~/, ""),
      description: lib.description,
      licenses: [{ license: { id: lib.license } }],
      externalReferences: [
        {
          type: "website",
          url: lib.website,
        },
        ...(lib.repository
          ? [
              {
                type: "vcs",
                url: lib.repository,
              },
            ]
          : []),
      ],
    })),
  };

  return JSON.stringify(bom, null, 2);
}

export function exportDependencies(format: ExportFormat): string {
  switch (format) {
    case "json":
      return generateLibrariesJson();
    case "markdown":
      return generateLibrariesMarkdown();
    case "cyclonedx":
      return generateCycloneDxSbom();
  }
}
