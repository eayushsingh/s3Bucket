"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Server,
  Terminal,
  Activity,
  Keyboard,
  SlidersHorizontal,
  BarChart3,
  Search,
  Info,
} from "lucide-react";
import { HealthBadge } from "@/components/HealthBadge";
import { BucketManager } from "@/components/BucketManager";
import { FileExplorer } from "@/components/FileExplorer";
import { FileUploadModal } from "@/components/FileUploadModal";
import { MultipartUploadModal } from "@/components/MultipartUploadModal";
import { PresignedUrlModal } from "@/components/PresignedUrlModal";
import { ObjectDetailDrawer } from "@/components/ObjectDetailDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { AuditLogDrawer } from "@/components/AuditLogDrawer";
import { DiagnosticsModal } from "@/components/DiagnosticsModal";
import { BucketPropertiesModal } from "@/components/BucketPropertiesModal";
import { BucketMetricsModal } from "@/components/BucketMetricsModal";
import { AboutModal } from "@/components/AboutModal";
import { AwsConsoleLayout } from "@/components/aws/AwsConsoleLayout";
import { ToastProvider, useToast } from "@/components/ToastContext";
import { BucketInfo } from "@/storage/storage.types";

function StorageDashboardContent() {
  const { success, error: toastError } = useToast();
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [loadingObjects, setLoadingObjects] = useState(false);

  // Modals & Drawers
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialFiles, setUploadInitialFiles] = useState<File[]>([]);
  const [isMultipartOpen, setIsMultipartOpen] = useState(false);
  const [presignedTargetKey, setPresignedTargetKey] = useState<string | null>(null);
  const [detailTargetKey, setDetailTargetKey] = useState<string | null>(null);

  // Fetch Buckets
  const fetchBuckets = useCallback(async () => {
    try {
      setLoadingBuckets(true);
      const res = await fetch("/api/storage/buckets");
      const data = await res.json();
      if (data.success && data.data?.buckets) {
        setBuckets(data.data.buckets);
        if (!selectedBucket && data.data.buckets.length > 0) {
          setSelectedBucket(data.data.buckets[0].name);
        }
      }
    } catch (err: any) {
      toastError("Failed to fetch buckets", err.message);
    } finally {
      setLoadingBuckets(false);
    }
  }, [selectedBucket, toastError]);

  // Fetch Objects in Selected Bucket
  const fetchObjects = useCallback(async () => {
    if (!selectedBucket) return;
    try {
      setLoadingObjects(true);
      const query = new URLSearchParams({
        bucket: selectedBucket,
        prefix: currentPrefix,
        delimiter: "/",
      });

      const res = await fetch(`/api/storage/objects?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setObjects(data.data.objects || []);
        setPrefixes(data.data.prefixes || []);
      }
    } catch (err: any) {
      toastError("Failed to fetch objects", err.message);
    } finally {
      setLoadingObjects(false);
    }
  }, [selectedBucket, currentPrefix, toastError]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs or textareas
      if (
        ["input", "textarea"].includes((e.target as HTMLElement).tagName.toLowerCase())
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setIsAuditLogOpen((prev) => !prev);
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setIsDiagnosticsOpen((prev) => !prev);
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (selectedBucket) setIsPropertiesOpen((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        fetchObjects();
        success("Refreshed", `Synchronized objects in ${selectedBucket}`);
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        if (selectedBucket) setIsUploadOpen(true);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (selectedBucket) setIsMultipartOpen(true);
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setIsAboutOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBucket, fetchObjects, success]);

  const handleDeleteObjects = async (keys: string[]) => {
    if (!selectedBucket) return;
    try {
      const res = await fetch("/api/storage/objects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: selectedBucket,
          objectKeys: keys,
        }),
      });

      const data = await res.json();
      if (data.success) {
        success("Objects Deleted", `Purged ${keys.length} items from ${selectedBucket}`);
        fetchObjects();
      } else {
        toastError("Delete Failed", data.error?.message || "Failed to delete objects");
      }
    } catch (err: any) {
      toastError("Delete Error", err.message);
    }
  };

  const totalSize = objects.reduce((sum, o) => sum + (o.size || 0), 0);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4">
      {/* Top Industrial Navbar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-sky-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight font-mono">
                AWS S3 / MinIO Storage Console
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                v1.2.0-PROD
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              High-throughput object storage subsystem • SigV4 engine • Zero RAM proxying
            </p>
          </div>
        </div>

        {/* Global Control Bar */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition"
            title="Open Command Palette (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline text-[11px]">Command Palette</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setIsAuditLogOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition"
            title="Live Operational Audit Stream (L)"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Audit</span>
          </button>

          <button
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition"
            title="About System & Libraries (A)"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline text-[11px]">About</span>
          </button>

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded transition"
            title="Keyboard Shortcuts Reference (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          <HealthBadge onOpenDiagnostics={() => setIsDiagnosticsOpen(true)} />
        </div>
      </header>

      {/* High-Density KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
            <span>Active Namespaces</span>
            <Database className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-lg font-bold text-zinc-100 mt-1">{buckets.length}</p>
          <p className="text-[10px] text-zinc-500">Isolated S3 buckets</p>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
            <span>Indexed Objects</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-zinc-100 mt-1">{objects.length}</p>
          <p className="text-[10px] text-zinc-500 truncate">in s3://{selectedBucket || "--"}</p>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
            <span>Prefix View Bytes</span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-zinc-100 mt-1">{formatBytes(totalSize)}</p>
          <p className="text-[10px] text-zinc-500">Binary payload stored</p>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
            <span>Presigned Protocol</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-zinc-100 mt-1">Zero-RAM-Proxy</p>
          <p className="text-[10px] text-zinc-500">Direct streaming auth</p>
        </div>
      </div>

      {/* Main Workspace Console */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[550px]">
        {/* Bucket Navigation Sidebar */}
        <BucketManager
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelectBucket={(b) => {
            setSelectedBucket(b);
            setCurrentPrefix("");
          }}
          onBucketCreated={fetchBuckets}
          onBucketDeleted={() => {
            fetchBuckets();
            setSelectedBucket(null);
          }}
          onOpenProperties={(b) => {
            setSelectedBucket(b);
            setIsPropertiesOpen(true);
          }}
          onOpenMetrics={(b) => {
            setSelectedBucket(b);
            setIsMetricsOpen(true);
          }}
        />

        {/* Object Table Explorer */}
        {selectedBucket ? (
          <FileExplorer
            bucket={selectedBucket}
            objects={objects}
            prefixes={prefixes}
            currentPrefix={currentPrefix}
            onNavigatePrefix={(prefix) => setCurrentPrefix(prefix)}
            onOpenUpload={(droppedFiles?: File[]) => {
              if (droppedFiles && droppedFiles.length > 0) {
                setUploadInitialFiles(droppedFiles);
              } else {
                setUploadInitialFiles([]);
              }
              setIsUploadOpen(true);
            }}
            onOpenMultipart={() => setIsMultipartOpen(true)}
            onInspectObject={(key) => setDetailTargetKey(key)}
            onOpenPresignedModal={(key) => setPresignedTargetKey(key)}
            onDeleteObjects={handleDeleteObjects}
            onRefresh={fetchObjects}
            loading={loadingObjects}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 rounded-lg p-8 border border-zinc-800 text-zinc-500 font-mono text-xs">
            <Database className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-300">No Bucket Selected</p>
            <p className="text-zinc-500 mt-1">
              Select or create an S3 bucket namespace on the left to explore objects.
            </p>
          </div>
        )}
      </div>

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        buckets={buckets}
        selectedBucket={selectedBucket}
        onSelectBucket={(b) => setSelectedBucket(b)}
        objects={objects}
        onSelectObject={(key) => setDetailTargetKey(key)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenMultipart={() => setIsMultipartOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenProperties={() => setIsPropertiesOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AuditLogDrawer
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        activeBucket={selectedBucket}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {selectedBucket && (
        <BucketPropertiesModal
          bucket={selectedBucket}
          isOpen={isPropertiesOpen}
          onClose={() => setIsPropertiesOpen(false)}
          onUpdate={fetchBuckets}
        />
      )}

      {selectedBucket && (
        <BucketMetricsModal
          bucket={selectedBucket}
          isOpen={isMetricsOpen}
          onClose={() => setIsMetricsOpen(false)}
        />
      )}

      {selectedBucket && isUploadOpen && (
        <FileUploadModal
          bucket={selectedBucket}
          currentPrefix={currentPrefix}
          isOpen={isUploadOpen}
          initialFiles={uploadInitialFiles}
          onClose={() => {
            setIsUploadOpen(false);
            setUploadInitialFiles([]);
          }}
          onUploadComplete={() => {
            setIsUploadOpen(false);
            setUploadInitialFiles([]);
            fetchObjects();
          }}
        />
      )}

      {selectedBucket && isMultipartOpen && (
        <MultipartUploadModal
          bucket={selectedBucket}
          currentPrefix={currentPrefix}
          isOpen={isMultipartOpen}
          onClose={() => setIsMultipartOpen(false)}
          onUploadComplete={() => {
            setIsMultipartOpen(false);
            fetchObjects();
          }}
        />
      )}

      {selectedBucket && presignedTargetKey && (
        <PresignedUrlModal
          bucket={selectedBucket}
          objectKey={presignedTargetKey}
          isOpen={!!presignedTargetKey}
          onClose={() => setPresignedTargetKey(null)}
        />
      )}

      {selectedBucket && (
        <ObjectDetailDrawer
          bucket={selectedBucket}
          objectKey={detailTargetKey}
          onClose={() => setDetailTargetKey(null)}
          onOpenPresignedModal={(key) => {
            setDetailTargetKey(null);
            setPresignedTargetKey(key);
          }}
        />
      )}
    </div>
  );
}

export default function StorageDashboard() {
  return (
    <ToastProvider>
      <StorageDashboardContent />
    </ToastProvider>
  );
}
