"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Shield,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { S3StorageClass } from "@/storage/storage.types";
import { useToast } from "./ToastContext";

interface FileUploadModalProps {
  bucket: string;
  currentPrefix: string;
  isOpen: boolean;
  initialFiles?: File[];
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "requesting" | "uploading" | "verifying" | "success" | "error";
  error?: string;
  objectKey?: string;
}

export function FileUploadModal({
  bucket,
  currentPrefix,
  isOpen,
  initialFiles,
  onClose,
  onUploadComplete,
}: FileUploadModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [customPrefix, setCustomPrefix] = useState(currentPrefix);
  const [storageClass, setStorageClass] = useState<S3StorageClass>("STANDARD");
  const [useEncryption, setUseEncryption] = useState(false);
  const [customTags, setCustomTags] = useState<Array<{ key: string; value: string }>>([]);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagVal, setNewTagVal] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const staged: UploadingFile[] = initialFiles.map((f) => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        progress: 0,
        status: "idle",
      }));
      setFiles((prev) => [...prev, ...staged]);
    }
  }, [initialFiles]);

  if (!isOpen) return null;

  const handleFilesAdded = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const newItems: UploadingFile[] = Array.from(incomingFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "idle",
    }));
    setFiles((prev) => [...prev, ...newItems]);
  };

  const addTag = () => {
    if (!newTagKey.trim()) return;
    setCustomTags((prev) => [...prev, { key: newTagKey.trim(), value: newTagVal.trim() }]);
    setNewTagKey("");
    setNewTagVal("");
  };

  const removeTag = (index: number) => {
    setCustomTags((prev) => prev.filter((_, idx) => idx !== index));
  };

  const uploadSingleFile = async (item: UploadingFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "requesting" } : f))
      );

      const normalizedPrefix = customPrefix ? customPrefix.replace(/\/+$/, "") + "/" : "";
      const objectKey = `${normalizedPrefix}${item.file.name}`;

      // Convert custom tags to object
      const metadataObj: Record<string, string> = {};
      customTags.forEach((t) => {
        if (t.key) metadataObj[t.key] = t.value;
      });

      // 1. Request presigned upload URL
      const presignRes = await fetch("/api/storage/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket,
          objectKey,
          contentType: item.file.type || "application/octet-stream",
          storageClass,
          metadata: metadataObj,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error?.message || "Failed to generate upload URL");
      }

      const { uploadUrl } = presignData.data;

      // 2. Perform direct streaming PUT to S3
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", objectKey } : f))
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: percent } : f))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage engine rejected upload: HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during binary transfer"));
        xhr.send(item.file);
      });

      // 3. Mark success
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "success", progress: 100 } : f))
      );
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "error", error: err.message } : f
        )
      );
    }
  };

  const startUploadAll = async () => {
    const pending = files.filter((f) => f.status === "idle" || f.status === "error");
    for (const f of pending) {
      await uploadSingleFile(f);
    }
    toastSuccess("Upload Pipeline Complete", "All files transferred directly to S3 storage");
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "success");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 text-sky-400 rounded">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Direct S3 Presigned Uploader
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                s3://{bucket}/{customPrefix}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 font-mono text-xs max-h-[70vh] overflow-y-auto">
          {/* Target prefix & Storage Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                Target Folder / Prefix
              </label>
              <input
                type="text"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                placeholder="e.g. assets/2026/"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                S3 Storage Class Tier
              </label>
              <select
                value={storageClass}
                onChange={(e) => setStorageClass(e.target.value as S3StorageClass)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="STANDARD">STANDARD (Frequent Access)</option>
                <option value="INTELLIGENT_TIERING">INTELLIGENT_TIERING (Auto-optimizing)</option>
                <option value="STANDARD_IA">STANDARD_IA (Infrequent Access)</option>
                <option value="GLACIER">GLACIER (Cold Archive)</option>
                <option value="DEEP_ARCHIVE">DEEP_ARCHIVE (Long-Term Vault)</option>
              </select>
            </div>
          </div>

          {/* User Metadata Tags */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              User Metadata Tags (x-amz-meta-*)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                placeholder="Key (e.g. env)"
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 flex-1 focus:outline-none"
              />
              <input
                type="text"
                value={newTagVal}
                onChange={(e) => setNewTagVal(e.target.value)}
                placeholder="Value (e.g. production)"
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 flex-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700"
              >
                Add Tag
              </button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customTags.map((t, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-300"
                  >
                    <span>{t.key}: {t.value}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              isDragging
                ? "border-sky-500 bg-sky-500/10"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
            <Upload className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-zinc-300 font-medium">Click to select files or drop here</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Transfers directly to S3/MinIO using signed cryptographic signatures
            </p>
          </div>

          {/* Upload Queue */}
          {files.length > 0 && (
            <div className="space-y-2 border border-zinc-800 rounded p-3 bg-zinc-900/30 max-h-48 overflow-y-auto divide-y divide-zinc-900">
              {files.map((f) => (
                <div key={f.id} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-zinc-200 truncate max-w-xs">{f.file.name}</span>
                    <span className="text-zinc-500">
                      {f.status === "success"
                        ? "Transferred"
                        : f.status === "uploading"
                        ? `${f.progress}%`
                        : f.status === "error"
                        ? "Failed"
                        : "Ready"}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${f.progress}%` }}
                      className={`h-full transition-all duration-150 ${
                        f.status === "error"
                          ? "bg-rose-500"
                          : f.status === "success"
                          ? "bg-emerald-400"
                          : "bg-sky-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center">
          <button
            onClick={() => {
              if (allDone) onUploadComplete();
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono rounded transition"
          >
            {allDone ? "Done" : "Cancel"}
          </button>
          <button
            onClick={allDone ? () => { onUploadComplete(); onClose(); } : startUploadAll}
            disabled={files.length === 0}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium rounded transition disabled:opacity-50"
          >
            {allDone ? "Close" : `Upload ${files.length} Files`}
          </button>
        </div>
      </div>
    </div>
  );
}
