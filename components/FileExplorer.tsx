"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  File,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Code2,
  Trash2,
  Download,
  Link2,
  Info,
  Search,
  ChevronRight,
  Upload,
  Layers,
  RefreshCw,
  Copy,
  Check,
  ArrowUpDown,
  FolderPlus,
  X,
} from "lucide-react";
import { useToast } from "./ToastContext";
import { S3StorageClass } from "@/storage/storage.types";

interface FileExplorerProps {
  bucket: string;
  objects: any[];
  prefixes: string[];
  currentPrefix: string;
  onNavigatePrefix: (prefix: string) => void;
  onOpenUpload: () => void;
  onOpenMultipart: () => void;
  onInspectObject: (key: string) => void;
  onOpenPresignedModal: (key: string) => void;
  onDeleteObjects: (keys: string[]) => void;
  onRefresh: () => void;
  loading: boolean;
}

type SortField = "name" | "size" | "lastModified" | "storageClass";

export function FileExplorer({
  bucket,
  objects,
  prefixes,
  currentPrefix,
  onNavigatePrefix,
  onOpenUpload,
  onOpenMultipart,
  onInspectObject,
  onOpenPresignedModal,
  onDeleteObjects,
  onRefresh,
  loading,
}: FileExplorerProps) {
  const { success, error: toastError } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedUri, setCopiedUri] = useState(false);
  const [batchStorageClass, setBatchStorageClass] = useState<S3StorageClass>("GLACIER");

  // New Folder modal state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Breadcrumbs
  const prefixSegments = currentPrefix ? currentPrefix.split("/").filter(Boolean) : [];

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      onNavigatePrefix("");
    } else {
      const newPrefix = prefixSegments.slice(0, index + 1).join("/") + "/";
      onNavigatePrefix(newPrefix);
    }
  };

  const copyS3Uri = () => {
    const uri = `s3://${bucket}/${currentPrefix}`;
    navigator.clipboard.writeText(uri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
    success("Copied S3 URI", uri);
  };

  // Direct download handler
  const handleDownloadObject = async (key: string) => {
    try {
      const res = await fetch("/api/storage/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, objectKey: key, asAttachment: true }),
      });
      const data = await res.json();
      if (data.success && data.data?.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.data.downloadUrl;
        a.download = key.split("/").pop() || "download";
        a.click();
        success("Download Initiated", key);
      } else {
        throw new Error(data.error?.message || "Failed to generate download signature");
      }
    } catch (err: any) {
      toastError("Download Failed", err.message);
    }
  };

  // Create folder handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const folderKey = `${currentPrefix}${newFolderName.trim().replace(/\/+$/, "")}/`;
      const res = await fetch("/api/storage/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, folderPath: folderKey }),
      });
      const data = await res.json();
      if (data.success) {
        success("Virtual Folder Created", folderKey);
        setNewFolderName("");
        setIsNewFolderOpen(false);
        onRefresh();
      } else {
        throw new Error(data.error?.message || "Failed to create folder");
      }
    } catch (err: any) {
      toastError("Folder Creation Failed", err.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Filter & Sort
  const filteredObjects = useMemo(() => {
    let list = objects.filter((o) =>
      (o.key || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      let valA: any = a.key;
      let valB: any = b.key;

      if (sortField === "size") {
        valA = a.size || 0;
        valB = b.size || 0;
      } else if (sortField === "lastModified") {
        valA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        valB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      } else if (sortField === "storageClass") {
        valA = a.storageClass || "STANDARD";
        valB = b.storageClass || "STANDARD";
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [objects, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Selection
  const allKeys = filteredObjects.map((o) => o.key);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allKeys);
    }
  };

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Batch Transition Storage Class
  const handleBatchTransition = async () => {
    if (selectedKeys.length === 0) return;
    try {
      const res = await fetch("/api/storage/objects/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transition_storage_class",
          bucket,
          keys: selectedKeys,
          targetStorageClass: batchStorageClass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success(
          "Storage Class Transitioned",
          `Migrated ${selectedKeys.length} objects to ${batchStorageClass}`
        );
        setSelectedKeys([]);
        onRefresh();
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toastError("Transition Failed", err.message);
    }
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Determine icon
  const getFileIcon = (key: string) => {
    const ext = key.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (["mp4", "webm", "mov", "avi"].includes(ext || ""))
      return <Film className="w-4 h-4 text-purple-400" />;
    if (["mp3", "wav", "ogg"].includes(ext || ""))
      return <Music className="w-4 h-4 text-amber-400" />;
    if (["zip", "tar", "gz", "7z"].includes(ext || ""))
      return <Archive className="w-4 h-4 text-rose-400" />;
    if (["ts", "js", "json", "py", "html", "css", "md"].includes(ext || ""))
      return <Code2 className="w-4 h-4 text-sky-400" />;
    return <File className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onOpenUpload();
      }}
      className={`flex-1 flex flex-col bg-zinc-950 border rounded-lg shadow-xl overflow-hidden min-h-[500px] relative transition-colors ${
        isDragging ? "border-sky-500 bg-sky-950/10" : "border-zinc-800"
      }`}
    >
      {/* Top Breadcrumb & Path Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/40 gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-zinc-400 hover:text-zinc-100 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
          >
            s3://{bucket}
          </button>
          {prefixSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-1.5 py-0.5 rounded transition ${
                  idx === prefixSegments.length - 1
                    ? "text-zinc-100 font-semibold bg-zinc-800/80"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {seg}
              </button>
            </React.Fragment>
          ))}
          <button
            onClick={copyS3Uri}
            className="p-1 text-zinc-500 hover:text-zinc-300 ml-1 transition"
            title="Copy S3 URI"
          >
            {copiedUri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium border border-zinc-800 transition"
            title="Create virtual directory prefix"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium border border-zinc-700/80 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            onClick={onOpenMultipart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium border border-zinc-700/80 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Multipart
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded bg-zinc-900 transition"
            title="Refresh objects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Batch Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/20 gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter keys or extensions (/)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>

        {/* Batch Operations Bar */}
        {selectedKeys.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono animate-in fade-in duration-150">
            <span className="text-zinc-400 text-[11px]">
              {selectedKeys.length} selected
            </span>
            <select
              value={batchStorageClass}
              onChange={(e) => setBatchStorageClass(e.target.value as S3StorageClass)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-[11px] focus:outline-none"
            >
              <option value="STANDARD">STANDARD</option>
              <option value="INTELLIGENT_TIERING">INTELLIGENT_TIERING</option>
              <option value="GLACIER">GLACIER</option>
              <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
            </select>
            <button
              onClick={handleBatchTransition}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[11px] transition"
            >
              Migrate Tier
            </button>
            <button
              onClick={() => onDeleteObjects(selectedKeys)}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[11px] transition"
            >
              <Trash2 className="w-3 h-3" />
              Delete ({selectedKeys.length})
            </button>
          </div>
        )}
      </div>

      {/* High-Density Object Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-400 select-none">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </th>
              <th
                onClick={() => toggleSort("name")}
                className="p-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("storageClass")}
                className="p-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Storage Class</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("size")}
                className="p-3 text-right cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Size</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("lastModified")}
                className="p-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Last Modified (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {/* Common Prefixes (Virtual Directories) */}
            {prefixes.map((prefix) => {
              const dirName = prefix.slice(currentPrefix.length);
              return (
                <tr
                  key={prefix}
                  onClick={() => onNavigatePrefix(prefix)}
                  className="hover:bg-zinc-900/60 cursor-pointer transition"
                >
                  <td className="p-3">
                    <Folder className="w-4 h-4 text-amber-400" />
                  </td>
                  <td className="p-3 text-zinc-200 font-semibold" colSpan={4}>
                    {dirName}
                  </td>
                  <td className="p-3 text-right text-zinc-500">Folder</td>
                </tr>
              );
            })}

            {/* Objects */}
            {filteredObjects.length === 0 && prefixes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500">
                  {loading ? "Loading bucket objects..." : "No objects found in this namespace path."}
                </td>
              </tr>
            ) : (
              filteredObjects.map((obj) => {
                const relativeKey = obj.key.slice(currentPrefix.length);
                const isSelected = selectedKeys.includes(obj.key);

                return (
                  <tr
                    key={obj.key}
                    className={`hover:bg-zinc-900/60 transition ${
                      isSelected ? "bg-zinc-900/80" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectKey(obj.key)}
                        className="rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td
                      className="p-3 cursor-pointer text-zinc-200 hover:text-sky-300 transition"
                      onClick={() => onInspectObject(obj.key)}
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(obj.key)}
                        <span className="truncate max-w-xs">{relativeKey}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                        {obj.storageClass || "STANDARD"}
                      </span>
                    </td>
                    <td className="p-3 text-right text-zinc-400 font-mono">
                      {formatBytes(obj.size)}
                    </td>
                    <td className="p-3 text-zinc-500 text-[11px]">
                      {obj.lastModified
                        ? new Date(obj.lastModified).toISOString().replace("T", " ").substring(0, 19)
                        : "--"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadObject(obj.key)}
                          className="p-1 text-zinc-500 hover:text-emerald-400 rounded transition"
                          title="Instant Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onInspectObject(obj.key)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition"
                          title="Inspect Metadata & Hex Preview"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenPresignedModal(obj.key)}
                          className="p-1 text-zinc-500 hover:text-sky-400 rounded transition"
                          title="Generate Presigned URL & SDK Snippets"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteObjects([obj.key])}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                          title="Delete Object"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-900/40 text-[11px] font-mono text-zinc-500">
        <span>
          {filteredObjects.length} objects ({prefixes.length} prefixes)
        </span>
        <span>
          Total Size:{" "}
          {formatBytes(filteredObjects.reduce((acc, o) => acc + (o.size || 0), 0))}
        </span>
      </div>

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-100 font-mono flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                Create Virtual Directory
              </h4>
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. assets or archive"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Path: s3://{bucket}/{currentPrefix}{newFolderName}/
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 text-zinc-400 rounded hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium disabled:opacity-50"
                >
                  {creatingFolder ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
