"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Database,
  File,
  Upload,
  Activity,
  Layers,
  Terminal,
  Server,
  X,
  CornerDownLeft,
} from "lucide-react";
import { BucketInfo } from "@/storage/storage.types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  buckets: BucketInfo[];
  selectedBucket: string | null;
  onSelectBucket: (b: string) => void;
  objects: any[];
  onSelectObject?: (key: string) => void;
  onOpenUpload: () => void;
  onOpenMultipart: () => void;
  onOpenDiagnostics: () => void;
  onOpenAuditLog: () => void;
  onOpenProperties: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  buckets,
  selectedBucket,
  onSelectBucket,
  objects,
  onSelectObject,
  onOpenUpload,
  onOpenMultipart,
  onOpenDiagnostics,
  onOpenAuditLog,
  onOpenProperties,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global hotkey: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open command palette handled by parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build items list
  const filteredBuckets = buckets
    .filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
    .map((b) => ({
      type: "bucket" as const,
      id: `bucket-${b.name}`,
      title: b.name,
      subtitle: `S3 Bucket Namespace`,
      icon: Database,
      action: () => {
        onSelectBucket(b.name);
        onClose();
      },
    }));

  const filteredObjects = objects
    .filter((o) => (o.key || "").toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)
    .map((o) => ({
      type: "object" as const,
      id: `object-${o.key}`,
      title: o.key,
      subtitle: `${(o.size / 1024).toFixed(1)} KB in ${selectedBucket}`,
      icon: File,
      action: () => {
        if (onSelectObject) onSelectObject(o.key);
        onClose();
      },
    }));

  const systemActions = [
    {
      type: "action" as const,
      id: "act-upload",
      title: "Upload Single File",
      subtitle: "Zero-proxy presigned S3 PUT upload",
      icon: Upload,
      action: () => {
        onOpenUpload();
        onClose();
      },
    },
    {
      type: "action" as const,
      id: "act-multipart",
      title: "Resilient Multipart Upload",
      subtitle: "Chunked S3 multipart pipeline for large files",
      icon: Layers,
      action: () => {
        onOpenMultipart();
        onClose();
      },
    },
    {
      type: "action" as const,
      id: "act-audit",
      title: "View S3 Operational Audit Trail",
      subtitle: "Live telemetry ledger of S3 API operations",
      icon: Terminal,
      action: () => {
        onOpenAuditLog();
        onClose();
      },
    },
    {
      type: "action" as const,
      id: "act-diag",
      title: "Run System Diagnostics & Health Probe",
      subtitle: "End-to-end ping latency and cluster sockets",
      icon: Activity,
      action: () => {
        onOpenDiagnostics();
        onClose();
      },
    },
    {
      type: "action" as const,
      id: "act-prop",
      title: "Bucket Configuration & Policies",
      subtitle: "Versioning, Lifecycle rules, CORS and IAM Policy",
      icon: Server,
      action: () => {
        onOpenProperties();
        onClose();
      },
    },
  ].filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...systemActions, ...filteredBuckets, ...filteredObjects];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, bucket name, or object key..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-zinc-900">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">
              No matching commands, buckets, or objects found for "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition ${
                    isSelected ? "bg-zinc-900 text-zinc-100 border border-zinc-700/60" : "text-zinc-400 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded ${
                        isSelected ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate font-mono">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-900 bg-zinc-950/90 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <span>S3 Console Orchestrator</span>
        </div>
      </div>
    </div>
  );
}
