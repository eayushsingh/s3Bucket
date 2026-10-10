"use client";

import React, { useState, useRef } from "react";
import {
  Layers,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useToast } from "./ToastContext";

interface MultipartUploadModalProps {
  bucket: string;
  currentPrefix: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks

export function MultipartUploadModal({
  bucket,
  currentPrefix,
  isOpen,
  onClose,
  onUploadComplete,
}: MultipartUploadModalProps) {
  const { success, error: toastError } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customPrefix, setCustomPrefix] = useState(currentPrefix);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [completedPartsList, setCompletedPartsList] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const calculatedParts = Math.ceil(file.size / CHUNK_SIZE);
      setTotalParts(calculatedParts);
      setCompletedPartsList([]);
      setProgress(0);
      setIsDone(false);
      setError(null);
    }
  };

  const handleStartMultipart = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setStatusMessage("Initiating S3 multipart upload session...");

    const normalizedPrefix = customPrefix ? customPrefix.replace(/\/+$/, "") + "/" : "";
    const objectKey = `${normalizedPrefix}${selectedFile.name}`;

    try {
      // Step 1: Initiate
      const initRes = await fetch("/api/storage/multipart/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket,
          objectKey,
          contentType: selectedFile.type || "application/octet-stream",
          partSize: CHUNK_SIZE,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error?.message || "Failed to initiate multipart upload");
      }

      const { uploadId } = initData.data;

      // Step 2: Fetch presigned part URLs
      setStatusMessage("Acquiring cryptographic presigned part signatures...");
      const partsRes = await fetch("/api/storage/multipart/presigned-part-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket,
          objectKey,
          uploadId,
          partNumbers: Array.from({ length: totalParts }, (_, i) => i + 1),
        }),
      });

      const partsData = await partsRes.json();
      if (!partsRes.ok || !partsData.success) {
        throw new Error(partsData.error?.message || "Failed to generate part URLs");
      }

      const partUrls: Array<{ partNumber: number; url: string }> = partsData.data.partUrls;

      // Step 3: Upload chunks sequentially
      const completedParts: Array<{ PartNumber: number; ETag: string }> = [];

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        setCurrentPart(partNumber);
        setStatusMessage(`Streaming Part ${partNumber} of ${totalParts} (${CHUNK_SIZE / (1024 * 1024)}MB)...`);

        const startByte = i * CHUNK_SIZE;
        const endByte = Math.min(startByte + CHUNK_SIZE, selectedFile.size);
        const chunkBlob = selectedFile.slice(startByte, endByte);

        const targetPartUrl = partUrls.find((p) => p.partNumber === partNumber)?.url;
        if (!targetPartUrl) {
          throw new Error(`Missing presigned URL for part ${partNumber}`);
        }

        const etag = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", targetPartUrl, true);

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const resEtag = xhr.getResponseHeader("ETag");
              if (!resEtag) {
                reject(new Error(`Storage did not return ETag for part ${partNumber}`));
              } else {
                resolve(resEtag.replace(/"/g, ""));
              }
            } else {
              reject(new Error(`Part ${partNumber} rejected: HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Network error uploading part ${partNumber}`));
          xhr.send(chunkBlob);
        });

        completedParts.push({ PartNumber: partNumber, ETag: etag });
        setCompletedPartsList((prev) => [...prev, partNumber]);
        setProgress(Math.round(((i + 1) / totalParts) * 100));
      }

      // Step 4: Finalize assembly
      setStatusMessage("Finalizing manifest and assembling binary chunks...");
      const completeRes = await fetch("/api/storage/multipart/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket,
          objectKey,
          uploadId,
          parts: completedParts,
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.error?.message || "Failed to finalize multipart upload");
      }

      setIsDone(true);
      setStatusMessage("Multipart pipeline complete. Object stored successfully.");
      success("Multipart Assembly Succeeded", `Stored s3://${bucket}/${objectKey}`);
    } catch (err: any) {
      setError(err.message);
      setStatusMessage("Upload failed.");
      toastError("Multipart Upload Failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 text-purple-400 rounded">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Resilient S3 Multipart Stream Pipeline
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Handles multi-gigabyte payloads via chunked parallel S3 parts
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
          {/* Target Folder / Prefix */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
              Destination Prefix
            </label>
            <input
              type="text"
              disabled={uploading}
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder="e.g. datasets/large-models/"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* File Picker */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 rounded-lg p-8 text-center cursor-pointer transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <File className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-zinc-300 font-medium">Select large file for multipart upload</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Optimized for ISOs, video raw footage, archive tars and database dumps
              </p>
            </div>
          ) : (
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-200 truncate max-w-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {totalParts} Chunks @ 10MB each
                  </p>
                </div>
                {!uploading && !isDone && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{statusMessage || "Ready to initiate"}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`h-full transition-all duration-200 ${
                      error ? "bg-rose-500" : isDone ? "bg-emerald-400" : "bg-purple-500"
                    }`}
                  />
                </div>
              </div>

              {/* Chunk Matrix Blocks */}
              {totalParts > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                    Part Assembly Matrix ({completedPartsList.length} / {totalParts})
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-zinc-950 rounded border border-zinc-900">
                    {Array.from({ length: totalParts }, (_, i) => i + 1).map((partNum) => {
                      const isComplete = completedPartsList.includes(partNum);
                      const isCurrent = currentPart === partNum && uploading;
                      return (
                        <div
                          key={partNum}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-mono border transition ${
                            isComplete
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : isCurrent
                              ? "bg-purple-500/30 border-purple-400 text-purple-200 animate-pulse"
                              : "bg-zinc-900 border-zinc-800 text-zinc-600"
                          }`}
                          title={`Part #${partNum}`}
                        >
                          {partNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center">
          <button
            onClick={() => {
              if (isDone) onUploadComplete();
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono rounded transition"
          >
            {isDone ? "Done" : "Cancel"}
          </button>
          {selectedFile && !isDone && (
            <button
              onClick={handleStartMultipart}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium rounded transition disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {uploading ? "Transferring Chunks..." : "Start Multipart Stream"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
