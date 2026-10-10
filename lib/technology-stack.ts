export interface LibraryInfo {
  id: string;
  name: string;
  category: "core" | "cloud" | "database" | "ui" | "validation" | "tooling" | "infrastructure";
  version: string;
  license: string;
  description: string;
  whyChosen: string;
  architecturalRole: string;
  website: string;
  repository?: string;
  highlights: string[];
}

export interface TechnologyCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const TECHNOLOGY_CATEGORIES: TechnologyCategory[] = [
  {
    id: "core",
    title: "Core Framework & Runtime",
    description: "Next.js 14 App Router, React 18, and modern Node.js v20 runtime engine",
    iconName: "Cpu",
  },
  {
    id: "cloud",
    title: "Cloud & Storage SDKs",
    description: "Modular AWS SDK v3 and SigV4 cryptographic presigning primitives",
    iconName: "Cloud",
  },
  {
    id: "database",
    title: "Database & Audit Ledger",
    description: "Ultra-fast embedded SQLite with Write-Ahead Logging (WAL) for persistent auditability",
    iconName: "Database",
  },
  {
    id: "ui",
    title: "UI & Industrial Ergonomics",
    description: "Tailwind CSS, Lucide icons, and conflict-free utility class merging",
    iconName: "Palette",
  },
  {
    id: "validation",
    title: "Validation & Security",
    description: "Compile-time & runtime schema parsing, S3 key sanitization, and input guards",
    iconName: "ShieldCheck",
  },
  {
    id: "tooling",
    title: "Testing & Developer Tooling",
    description: "Vitest runner, tsx runtime executor, and strict TypeScript compilation",
    iconName: "Terminal",
  },
  {
    id: "infrastructure",
    title: "Container & Storage Engine",
    description: "MinIO S3-compliant distributed object server and Docker Compose orchestration",
    iconName: "Server",
  },
];

export const LIBRARIES_REGISTRY: LibraryInfo[] = [
  {
    id: "nextjs",
    name: "Next.js",
    category: "core",
    version: "^14.2.24",
    license: "MIT",
    description: "React-based full-stack web framework with App Router, server route handlers, and streaming.",
    whyChosen: "Provides zero-RAM proxying via route handlers, robust API endpoints, optimal client-server bundling, and production-grade HTTP ergonomics without requiring separate backend servers.",
    architecturalRole: "Serves the frontend console UI, routes S3 REST API commands, manages lifecycle hooks, and orchestrates presigned ticket generation.",
    website: "https://nextjs.org",
    repository: "https://github.com/vercel/next.js",
    highlights: ["App Router architecture", "Route Handlers", "Zero-overhead client bundling", "Fast Refresh"],
  },
  {
    id: "react",
    name: "React & React-DOM",
    category: "core",
    version: "^18.3.1",
    license: "MIT",
    description: "Declarative UI library for component-driven interactive interfaces and concurrent rendering.",
    whyChosen: "Standard of modern web UI with hooks-driven state, concurrent rendering primitives, and rich ecosystem support.",
    architecturalRole: "Powers reactive state for real-time file exploration, multipart upload monitoring, command palette, and modal dialogs.",
    website: "https://react.dev",
    repository: "https://github.com/facebook/react",
    highlights: ["Concurrent mode", "Custom hooks architecture", "Optimized re-renders", "Virtual DOM diffing"],
  },
  {
    id: "aws-sdk-client-s3",
    name: "@aws-sdk/client-s3",
    category: "cloud",
    version: "^3.758.0",
    license: "Apache-2.0",
    description: "Modular AWS SDK v3 client for Amazon Simple Storage Service (S3) and MinIO API operations.",
    whyChosen: "SDK v3 is modular, tree-shakeable, and significantly lighter than monolithic SDK v2. Provides native TypeScript typings and support for multi-part uploads, tags, and lifecycle policies.",
    architecturalRole: "Executes bucket creation/deletion, object listing, multipart upload initialization/completion, metadata tagging, and bucket policy enforcement.",
    website: "https://aws.amazon.com/sdk-for-javascript/",
    repository: "https://github.com/aws/aws-sdk-js-v3",
    highlights: ["Modular architecture", "First-class TypeScript typings", "Multipart upload coordination", "Dual S3/MinIO compatibility"],
  },
  {
    id: "aws-sdk-presigner",
    name: "@aws-sdk/s3-request-presigner",
    category: "cloud",
    version: "^3.758.0",
    license: "Apache-2.0",
    description: "Cryptographic SigV4 presigned URL generator for secure time-limited direct client S3 operations.",
    whyChosen: "Enables direct browser-to-MinIO uploads/downloads. Eliminates RAM proxying in the web server and prevents server memory exhaustion during multi-gigabyte file transfers.",
    architecturalRole: "Generates time-limited signed PUT and GET URLs using HMAC-SHA256 signatures, offloading binary payloads directly to object storage.",
    website: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/",
    repository: "https://github.com/aws/aws-sdk-js-v3",
    highlights: ["HMAC-SHA256 SigV4 auth", "Zero-RAM proxying", "Configurable TTL expiration", "Direct streaming uploads"],
  },
  {
    id: "better-sqlite3",
    name: "better-sqlite3",
    category: "database",
    version: "^11.8.1",
    license: "MIT",
    description: "The fastest, fully synchronous Node.js C-binding library for SQLite3.",
    whyChosen: "Operates with near-zero latency, synchronous execution avoiding promise churn, embedded without needing external database daemons, and supports Write-Ahead Logging (WAL) for high concurrency.",
    architecturalRole: "Records immutable, structured operational audit logs for every S3 bucket/object action (CREATE, UPLOAD, DELETE, PRESIGN) with microsecond response times.",
    website: "https://github.com/WiseLibs/better-sqlite3",
    repository: "https://github.com/WiseLibs/better-sqlite3",
    highlights: ["Zero promise overhead", "WAL mode enabled", "ACID transactional safety", "Embedded operational ledger"],
  },
  {
    id: "zod",
    name: "zod",
    category: "validation",
    version: "^3.24.2",
    license: "MIT",
    description: "TypeScript-first schema declaration and data validation library with static type inference.",
    whyChosen: "Eliminates duplicate type declarations by inferring TypeScript types directly from runtime validation schemas. Guarantees safe boundaries against malicious inputs.",
    architecturalRole: "Validates incoming API payloads, query strings, S3 bucket names (DNS compliance), object keys, and multipart upload part limits.",
    website: "https://zod.dev",
    repository: "https://github.com/colinhacks/zod",
    highlights: ["Static type inference", "DNS-compliant bucket validation", "Path traversal sanitization", "Comprehensive error reporting"],
  },
  {
    id: "lucide-react",
    name: "lucide-react",
    category: "ui",
    version: "^0.475.0",
    license: "ISC",
    description: "Beautiful, consistent, customizable SVG icon library designed for modern interfaces.",
    whyChosen: "Community-driven fork of Feather icons with 1000+ icons, tree-shakeable SVG components, clean pixel grid, and minimal bundle footprint.",
    architecturalRole: "Renders industrial system badges, action icons, storage hierarchy glyphs, telemetry status indicators, and keyboard shortcut glyphs.",
    website: "https://lucide.dev",
    repository: "https://github.com/lucide-icons/lucide",
    highlights: ["Crisp 24x24 pixel grid", "Tree-shakeable SVG exports", "Consistent stroke design", "Industrial console aesthetics"],
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    category: "ui",
    version: "^3.4.17",
    license: "MIT",
    description: "Utility-first CSS framework with just-in-time compilation and custom design token integration.",
    whyChosen: "Allows ultra-fast UI crafting with consistent spacing, dark mode color palettes (zinc/emerald/sky), responsive modifiers, and dead-code elimination.",
    architecturalRole: "Defines the high-density industrial dark design system, typography tokens, status glows, and layout grid.",
    website: "https://tailwindcss.com",
    repository: "https://github.com/tailwindlabs/tailwindcss",
    highlights: ["JIT compiler", "Dark-mode-first tokens", "Zero runtime CSS overhead", "Industrial zinc palette"],
  },
  {
    id: "clsx-tailwind-merge",
    name: "clsx & tailwind-merge",
    category: "ui",
    version: "clsx ^2.1.1 / tailwind-merge ^3.0.1",
    license: "MIT",
    description: "Utility functions for constructing conditional class strings and resolving Tailwind class collisions.",
    whyChosen: "Prevents CSS specificity bugs when overriding Tailwind classes across reusable components.",
    architecturalRole: "Underpins UI component styling modifiers, active state toggles, and dynamic status badge color variations.",
    website: "https://github.com/dcastilho/tailwind-merge",
    repository: "https://github.com/dcastilho/tailwind-merge",
    highlights: ["Deterministic class merging", "Zero specificity collisions", "Tiny bundle footprint", "Dynamic conditional classes"],
  },
  {
    id: "vitest",
    name: "vitest",
    category: "tooling",
    version: "^3.0.5",
    license: "MIT",
    description: "Vite-native unit and integration test runner with instant hot-module-reloading and ESM support.",
    whyChosen: "Massively faster than Jest, native ESM support, compatible with Vite transform pipeline, and built-in TypeScript support with zero configuration hassle.",
    architecturalRole: "Runs unit and integration tests across storage services, error mapping, key sanitization, lifecycle policies, and audit logging.",
    website: "https://vitest.dev",
    repository: "https://github.com/vitest-dev/vitest",
    highlights: ["Vite-native engine", "Sub-second test execution", "Native TypeScript & ESM", "Built-in watch mode"],
  },
  {
    id: "tsx",
    name: "tsx",
    category: "tooling",
    version: "^4.19.3",
    license: "MIT",
    description: "TypeScript Execute (tsx) powered by esbuild for blazing fast Node.js script execution.",
    whyChosen: "Executes TypeScript scripts directly without manual compilation steps (`tsc`), leveraging esbuild for microsecond startup times.",
    architecturalRole: "Powers startup automation scripts (`scripts/start-minio.ts`, `scripts/init-storage.ts`) and developer CLI tools.",
    website: "https://tsx.is",
    repository: "https://github.com/privatenumber/tsx",
    highlights: ["Powered by esbuild", "Zero-config TypeScript", "Instant execution", "ESM & CJS compatibility"],
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "tooling",
    version: "^5.7.3",
    license: "Apache-2.0",
    description: "Typed superset of JavaScript providing static type verification and developer ergonomics.",
    whyChosen: "Ensures type safety across the entire S3 contract, prevents runtime null reference errors, and provides autocompletion for complex AWS SDK command inputs/outputs.",
    architecturalRole: "Enforces strict type safety across all frontend components, backend route handlers, storage clients, and error wrappers.",
    website: "https://www.typescriptlang.org",
    repository: "https://github.com/microsoft/TypeScript",
    highlights: ["Strict null checks", "AWS SDK v3 type alignment", "End-to-end interface contracts", "Refactoring confidence"],
  },
  {
    id: "minio",
    name: "MinIO Storage Engine",
    category: "infrastructure",
    version: "RELEASE.2024-05-10+",
    license: "AGPL-3.0",
    description: "High-performance, Kubernetes-friendly, AWS S3 API-compatible distributed object storage server.",
    whyChosen: "Industry-standard self-hosted S3 alternative with 100% S3 API compatibility, high throughput, lightweight resource usage, and built-in web management console.",
    architecturalRole: "Acts as the physical object storage backend for binary objects, multipart uploads, versioning, bucket policies, and presigned streaming.",
    website: "https://min.io",
    repository: "https://github.com/minio/minio",
    highlights: ["S3 API compatible", "Direct local file persistence", "Lightweight RAM footprint", "Embedded Web Console"],
  },
  {
    id: "docker-compose",
    name: "Docker & Docker Compose",
    category: "infrastructure",
    version: "v2.x Compose Specification",
    license: "Apache-2.0",
    description: "Multi-container application specification and runtime isolation environment.",
    whyChosen: "Guarantees reproducible development and production environments across macOS, Linux, and Windows with health checks and persistent volume mounting.",
    architecturalRole: "Orchestrates the MinIO container, maps persistent data storage directories, configures root credentials, and enforces network isolation.",
    website: "https://www.docker.com",
    repository: "https://github.com/docker/compose",
    highlights: ["Declarative service definition", "Isolated volume mounts", "Built-in health probes", "One-command bootstrapping"],
  },
];

export function getLibrariesByCategory(category: string): LibraryInfo[] {
  if (category === "all") return LIBRARIES_REGISTRY;
  return LIBRARIES_REGISTRY.filter((lib) => lib.category === category);
}

export function searchLibraries(query: string): LibraryInfo[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return LIBRARIES_REGISTRY;
  return LIBRARIES_REGISTRY.filter(
    (lib) =>
      lib.name.toLowerCase().includes(normalized) ||
      lib.description.toLowerCase().includes(normalized) ||
      lib.whyChosen.toLowerCase().includes(normalized) ||
      lib.highlights.some((h) => h.toLowerCase().includes(normalized))
  );
}
