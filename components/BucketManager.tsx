"use client";

import React, { useState } from "react";
import {
  Database,
  Plus,
  Trash2,
  FolderOpen,
  Search,
  SlidersHorizontal,
  BarChart3,
  X,
  AlertTriangle,
  Server,
} from "lucide-react";
import { BucketInfo } from "@/storage/storage.types";
import { useToast } from "./ToastContext";

interface BucketManagerProps {
  buckets: BucketInfo[];
  selectedBucket: string | null;
  onSelectBucket: (bucketName: string) => void;
  onBucketCreated: () => void;
  onBucketDeleted: () => void;
  onOpenProperties?: (bucketName: string) => void;
  onOpenMetrics?: (bucketName: string) => void;
}

export function BucketManager({
  buckets,
  selectedBucket,
  onSelectBucket,
  onBucketCreated,
  onBucketDeleted,
  onOpenProperties,
  onOpenMetrics,
}: BucketManagerProps) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredBuckets = buckets.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBucketName.trim().toLowerCase();
    setCreating(true);

    try {
      const res = await fetch("/api/storage/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: cleanName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // If connection refused, prompt user that self-healing is active
        const msg = data.error?.message || "Failed to create bucket";
        if (msg.includes("ECONNREFUSED") || msg.includes("Failed to connect")) {
          throw new Error(
            "MinIO storage daemon was reconnecting. Background self-healing is recovering the service. Please try again in a moment."
          );
        }
        throw new Error(msg);
      }

      success("Bucket Created", `Namespace s3://${cleanName} is active`);
      setNewBucketName("");
      setIsCreateOpen(false);
      onBucketCreated();
    } catch (err: any) {
      toastError("Creation Failed", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const url = `/api/storage/buckets/${deleteTarget}${forceDelete ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete bucket");
      }

      success("Bucket Deleted", `s3://${deleteTarget} purged`);
      setDeleteTarget(null);
      setForceDelete(false);
      onBucketDeleted();
    } catch (err: any) {
      toastError("Delete Error", err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full md:w-80 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden shrink-0 min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
            S3 Namespaces ({buckets.length})
          </h3>
          <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60" title="Self-Healing MinIO Engine Active">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-mono transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/20">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search namespaces..."
            className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Bucket List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 p-2 space-y-1">
        {filteredBuckets.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            No matching S3 buckets found.
          </div>
        ) : (
          filteredBuckets.map((b) => {
            const isSelected = selectedBucket === b.name;
            return (
              <div
                key={b.name}
                className={`group flex items-center justify-between p-2.5 rounded transition font-mono ${
                  isSelected
                    ? "bg-zinc-900 border border-zinc-700/80 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectBucket(b.name)}
                >
                  <FolderOpen
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? "text-sky-400" : "text-zinc-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {b.isDefault ? "Default namespace" : "Custom namespace"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {onOpenProperties && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProperties(b.name);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                      title="Bucket Configuration & Policies"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onOpenMetrics && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMetrics(b.name);
                      }}
                      className="p-1 text-zinc-500 hover:text-emerald-400 rounded"
                      title="Storage Analytics"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(b.name);
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                    title="Delete Bucket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-100 font-mono">
                Create S3 Bucket Namespace
              </h4>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                  Bucket Name (DNS-1123 compliant)
                </label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="e.g. telemetry-archive-prod"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  3-63 characters, lowercase letters, numbers, and hyphens.
                </span>
                <div className="mt-2.5 p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  <span>Autonomous recovery active: connection auto-heals without downtime.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 text-zinc-400 rounded hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Bucket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-semibold font-mono">
                Confirm Bucket Purge
              </h4>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              Are you sure you want to permanently delete bucket{" "}
              <strong className="text-zinc-200 font-mono">s3://{deleteTarget}</strong>?
            </p>

            <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
              />
              <span>Force delete non-empty bucket (recursively purge all objects)</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 bg-zinc-900 text-zinc-400 rounded hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium disabled:opacity-50"
              >
                {deleting ? "Purging..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
