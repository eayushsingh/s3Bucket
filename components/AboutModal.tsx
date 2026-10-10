import React, { useState, useMemo } from "react";
import {
  X,
  Layers,
  Cpu,
  Info,
  Server,
  Search,
  BookOpen,
  Github,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
} from "lucide-react";
import { LIBRARIES_REGISTRY, searchLibraries, getLibrariesByCategory } from "@/lib/technology-stack";
import { LibraryCard } from "./about/LibraryCard";
import { CategoryFilter } from "./about/CategoryFilter";
import { ArchitectureDiagram } from "./about/ArchitectureDiagram";
import { SystemRuntimeSpecs } from "./about/SystemRuntimeSpecs";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "libraries" | "architecture" | "runtime" | "project";
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "libraries",
}) => {
  const [activeTab, setActiveTab] = useState<"libraries" | "architecture" | "runtime" | "project">(
    defaultTab
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lib of LIBRARIES_REGISTRY) {
      counts[lib.category] = (counts[lib.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered libraries based on category and search query
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sky-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="about-modal-title" className="text-base font-bold text-zinc-100 font-mono tracking-tight">
                  About AWS S3 / MinIO Storage Console
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800 uppercase">
                  v1.1.0-PROD
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Technical overview, library catalog, architectural guarantees, and system inspection.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/40 px-4 sm:px-5 font-mono text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("libraries")}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
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
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
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
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
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
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "project"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Project & Author</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/70">
          {/* TAB 1: LIBRARIES */}
          {activeTab === "libraries" && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  categoryCounts={categoryCounts}
                  totalCount={LIBRARIES_REGISTRY.length}
                />

                <div className="relative min-w-[220px]">
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
          {activeTab === "architecture" && <ArchitectureDiagram />}

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

              {/* Core Features Summary */}
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

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-500">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Engineered for AWS S3 & MinIO Object Storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
