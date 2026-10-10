"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Server,
  ArrowLeft,
  Layers,
  Cpu,
  Info,
  Search,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { LIBRARIES_REGISTRY, searchLibraries, getLibrariesByCategory } from "@/lib/technology-stack";
import { LibraryCard } from "@/components/about/LibraryCard";
import { CategoryFilter } from "@/components/about/CategoryFilter";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { SystemRuntimeSpecs } from "@/components/about/SystemRuntimeSpecs";
import { SdkComparisonSection } from "@/components/about/SdkComparisonSection";
import { ZeroRamExplainer } from "@/components/about/ZeroRamExplainer";
import { SqliteAuditExplainer } from "@/components/about/SqliteAuditExplainer";
import { ZodValidationExplainer } from "@/components/about/ZodValidationExplainer";
import { exportDependencies, ExportFormat } from "@/lib/sbom-exporter";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"libraries" | "architecture" | "runtime" | "project">(
    "libraries"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lib of LIBRARIES_REGISTRY) {
      counts[lib.category] = (counts[lib.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredLibraries = useMemo(() => {
    let result = LIBRARIES_REGISTRY;
    if (selectedCategory !== "all") {
      result = getLibrariesByCategory(selectedCategory);
    }
    if (searchQuery.trim()) {
      const searched = searchLibraries(searchQuery);
      const searchIds = new Set(searched.map((l) => l.id));
      result = result.filter((l) => searchIds.has(l.id));
    }
    return result;
  }, [selectedCategory, searchQuery]);

  const handleCopySbom = async (format: ExportFormat) => {
    try {
      const text = exportDependencies(format);
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch (e) {
      console.error("Failed to copy SBOM to clipboard", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-sky-400 transition"
            title="Return to Main Storage Console"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight font-mono">
                System Overview & Technology Stack
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800 uppercase">
                v1.1.0-PROD
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Comprehensive architectural dossier, dependency catalog, and Zero-RAM specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            href="/"
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>Open S3 Console</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-xl">
        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/40 px-4 sm:px-6 font-mono text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("libraries")}
            className={`py-3.5 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "libraries"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Libraries & Dependencies ({LIBRARIES_REGISTRY.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`py-3.5 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "architecture"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Architecture & Zero-RAM</span>
          </button>

          <button
            onClick={() => setActiveTab("runtime")}
            className={`py-3.5 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "runtime"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Host Runtime & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab("project")}
            className={`py-3.5 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "project"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Project & Author</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* TAB 1: LIBRARIES */}
          {activeTab === "libraries" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  categoryCounts={categoryCounts}
                  totalCount={LIBRARIES_REGISTRY.length}
                />

                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search libraries or tags..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* SBOM Ribbon */}
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Export Software Bill of Materials (SBOM):</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopySbom("json")}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1 text-[10px]"
                  >
                    {copiedFormat === "json" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-400" />
                    )}
                    <span>{copiedFormat === "json" ? "Copied JSON" : "Copy JSON"}</span>
                  </button>

                  <button
                    onClick={() => handleCopySbom("markdown")}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1 text-[10px]"
                  >
                    {copiedFormat === "markdown" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-400" />
                    )}
                    <span>{copiedFormat === "markdown" ? "Copied Markdown" : "Copy Markdown"}</span>
                  </button>

                  <button
                    onClick={() => handleCopySbom("cyclonedx")}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1 text-[10px]"
                  >
                    {copiedFormat === "cyclonedx" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-400" />
                    )}
                    <span>{copiedFormat === "cyclonedx" ? "Copied CycloneDX" : "CycloneDX 1.5"}</span>
                  </button>
                </div>
              </div>

              {/* Grid of Libraries */}
              {filteredLibraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLibraries.map((lib) => (
                    <LibraryCard key={lib.id} library={lib} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-lg bg-zinc-950">
                  <p>No libraries matched "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-2 text-sky-400 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === "architecture" && (
            <div className="space-y-4">
              <ArchitectureDiagram />
              <ZeroRamExplainer />
              <SdkComparisonSection />
              <SqliteAuditExplainer />
              <ZodValidationExplainer />
            </div>
          )}

          {/* TAB 3: RUNTIME SPECS */}
          {activeTab === "runtime" && <SystemRuntimeSpecs />}

          {/* TAB 4: PROJECT & AUTHOR */}
          {activeTab === "project" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-zinc-100">
                    Industrial Cloud Storage Console
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                    License: MIT
                  </span>
                </div>
                <p className="text-zinc-400 font-sans leading-relaxed">
                  Engineered as a production-grade AWS S3 and MinIO administrative interface. Built with
                  Next.js 14, AWS SDK v3, better-sqlite3 audit tracking, zero-RAM presigned upload pipelines,
                  and Tailwind CSS industrial ergonomics.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Author: </span>
                    <span className="text-sky-400">Ayush Singh</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Contact: </span>
                    <a href="mailto:ayushhsinghhe01@gmail.com" className="text-zinc-300 hover:text-sky-400">
                      ayushhsinghhe01@gmail.com
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500">Repository: </span>
                    <a
                      href="https://github.com/eayushsingh/s3Bucket"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-300 hover:text-sky-400 inline-flex items-center gap-1"
                    >
                      <span>eayushsingh/s3Bucket</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500">Target Protocol: </span>
                    <span className="text-emerald-400">Amazon S3 REST / MinIO API</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                <h4 className="font-bold text-zinc-200 mb-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Architectural Capabilities</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Zero-RAM proxying via SigV4 presigned URLs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Multipart Chunk upload engine for multi-GB files</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Write-Ahead Logged SQLite operational audit ledger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Multi-language code generator (cURL, Python, Node, Go)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Binary hex dump & syntax-highlighted code inspector</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Full keyboard ergonomics with ⌘K Command Palette</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
