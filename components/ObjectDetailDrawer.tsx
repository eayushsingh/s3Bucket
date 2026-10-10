"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  X,
  Clock,
  HardDrive,
  Tag,
  Hash,
  ShieldCheck,
  ExternalLink,
  Download,
  Image as ImageIcon,
  Film,
  Music,
  Code2,
  Binary,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { HexDumpViewer } from "./HexDumpViewer";
import { CodeViewer } from "./CodeViewer";
import { useToast } from "./ToastContext";

interface ObjectDetailDrawerProps {
  bucket: string;
  objectKey: string | null;
  onClose: () => void;
  onOpenPresignedModal: (key: string) => void;
}

export function ObjectDetailDrawer({
  bucket,
  objectKey,
  onClose,
  onOpenPresignedModal,
}: ObjectDetailDrawerProps) {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [objectContent, setObjectContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "hex" | "headers">("preview");
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!objectKey) {
      setData(null);
      setPreviewUrl(null);
      setObjectContent(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [metaRes, downloadRes, contentRes] = await Promise.all([
          fetch("/api/storage/objects/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucket, objectKey }),
          }),
          fetch("/api/storage/download-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucket, objectKey, expiresInSeconds: 900 }),
          }),
          fetch(
            `/api/storage/objects/content?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(objectKey)}&maxBytes=262144`
          ),
        ]);

        const metaData = await metaRes.json();
        const downloadData = await downloadRes.json();
        const contentData = await contentRes.json();

        if (metaData.success) {
          setData(metaData.data);
        }
        if (downloadData.success) {
          setPreviewUrl(downloadData.data.downloadUrl);
        }
        if (contentData.success) {
          setObjectContent(contentData.data);
        }
      } catch (err: any) {
        toastError("Fetch Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bucket, objectKey]);

  if (!objectKey) return null;

  const copyS3Uri = () => {
    navigator.clipboard.writeText(`s3://${bucket}/${objectKey}`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    success("Copied", `s3://${bucket}/${objectKey}`);
  };

  const isImage = data?.contentType?.startsWith("image/");
  const isVideo = data?.contentType?.startsWith("video/");
  const isAudio = data?.contentType?.startsWith("audio/");
  const isText =
    data?.contentType?.startsWith("text/") ||
    data?.contentType?.includes("json") ||
    data?.contentType?.includes("javascript") ||
    data?.contentType?.includes("xml");

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-zinc-800 text-sky-400 rounded shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 truncate font-mono">
                  {objectKey.split("/").pop()}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {data?.storageClass || "STANDARD"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono truncate">
                s3://{bucket}/{objectKey}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyS3Uri}
              className="p-1 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded bg-zinc-900 transition"
              title="Copy S3 URI"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-900/20 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("hex")}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === "hex"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Hex Dump
            </button>
            <button
              onClick={() => setActiveTab("headers")}
              className={`px-2.5 py-1 rounded transition ${
                activeTab === "headers"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Raw S3 Headers
            </button>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                download
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            )}
            <button
              onClick={() => onOpenPresignedModal(objectKey)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs transition"
            >
              Share Presigned
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-xs">
          {activeTab === "preview" && (
            <div className="space-y-4">
              {isImage && previewUrl ? (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded flex flex-col items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={objectKey}
                    className="max-h-80 max-w-full rounded object-contain border border-zinc-800"
                  />
                  <span className="text-[10px] text-zinc-500 mt-2">
                    {data?.contentType} • {formatBytes(data?.size)}
                  </span>
                </div>
              ) : isAudio && previewUrl ? (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded">
                  <audio controls src={previewUrl} className="w-full" />
                </div>
              ) : isVideo && previewUrl ? (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded">
                  <video controls src={previewUrl} className="max-h-80 w-full rounded" />
                </div>
              ) : objectContent?.text ? (
                <CodeViewer
                  content={objectContent.text}
                  language={data?.contentType?.includes("json") ? "json" : "text"}
                />
              ) : objectContent?.base64 ? (
                <div className="space-y-2">
                  <p className="text-zinc-400 text-[11px]">
                    Binary payload detected. Showing hexadecimal inspection:
                  </p>
                  <HexDumpViewer base64Data={objectContent.base64} />
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 border border-zinc-900 rounded">
                  No visual preview available for {data?.contentType || "this file type"}.
                </div>
              )}
            </div>
          )}

          {activeTab === "hex" && (
            <div className="space-y-2">
              {objectContent?.base64 ? (
                <HexDumpViewer base64Data={objectContent.base64} />
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  Loading binary buffer...
                </div>
              )}
            </div>
          )}

          {activeTab === "headers" && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                S3 HTTP Response Headers & System Attributes
              </h4>
              <div className="border border-zinc-800 rounded divide-y divide-zinc-900 overflow-hidden">
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">Content-Type</span>
                  <span className="text-zinc-200">{data?.contentType || "application/octet-stream"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">Content-Length</span>
                  <span className="text-zinc-200">
                    {data?.size} bytes ({formatBytes(data?.size)})
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">ETag</span>
                  <span className="text-emerald-400 font-mono">"{data?.etag}"</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">Storage-Class</span>
                  <span className="text-zinc-200">{data?.storageClass || "STANDARD"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">Server-Side-Encryption</span>
                  <span className="text-zinc-200">{data?.serverSideEncryption || "None"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                  <span className="text-zinc-500">Last-Modified</span>
                  <span className="text-zinc-300">
                    {data?.lastModified ? new Date(data.lastModified).toUTCString() : "--"}
                  </span>
                </div>
                {data?.versionId && (
                  <div className="p-2.5 bg-zinc-900/40 flex justify-between">
                    <span className="text-zinc-500">VersionId</span>
                    <span className="text-sky-400 font-mono">{data.versionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User-defined Metadata key-values */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              User Metadata (x-amz-meta-*)
            </h4>
            {data?.metadata && Object.keys(data.metadata).length > 0 ? (
              <div className="border border-zinc-800 rounded divide-y divide-zinc-900">
                {Object.entries(data.metadata).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-zinc-900/30 flex justify-between">
                    <span className="text-zinc-400">x-amz-meta-{k}</span>
                    <span className="text-zinc-200 font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-[11px]">No user metadata headers attached.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center text-[11px] font-mono text-zinc-500">
          <span>Namespace: {bucket}</span>
          <span>Status: Verified 200 OK</span>
        </div>
      </div>
    </div>
  );
}
