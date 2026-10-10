"use client";

import React, { useState, useEffect } from "react";
import {
  Link2,
  Copy,
  Check,
  Download,
  Eye,
  Clock,
  ExternalLink,
  X,
  Code2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PresignedCodeSnippets } from "./PresignedCodeSnippets";
import { useToast } from "./ToastContext";

interface PresignedUrlModalProps {
  bucket: string;
  objectKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PresignedUrlModal({
  bucket,
  objectKey,
  isOpen,
  onClose,
}: PresignedUrlModalProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [expirySeconds, setExpirySeconds] = useState(3600); // default 1 hour
  const [method, setMethod] = useState<"GET" | "PUT">("GET");
  const [asAttachment, setAsAttachment] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const presets = [
    { label: "15 min", seconds: 900 },
    { label: "1 hour", seconds: 3600 },
    { label: "6 hours", seconds: 21600 },
    { label: "24 hours", seconds: 86400 },
    { label: "7 days", seconds: 604800 },
  ];

  const fetchPresignedUrl = async () => {
    setLoading(true);
    try {
      const endpoint = method === "GET" ? "/api/storage/download-url" : "/api/storage/upload-url";
      const payload =
        method === "GET"
          ? {
              bucket,
              objectKey,
              expiresInSeconds: expirySeconds,
              asAttachment,
            }
          : {
              bucket,
              objectKey,
              expiresInSeconds: expirySeconds,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate presigned URL");
      }

      const url = method === "GET" ? data.data.downloadUrl : data.data.uploadUrl;
      setGeneratedUrl(url);
      setExpiresAt(data.data.expiresAt);
      toastSuccess("Presigned URL Generated", `Signed for ${expirySeconds}s with ${method} authorization`);
    } catch (err: any) {
      toastError("Generation Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPresignedUrl();
    }
  }, [isOpen, expirySeconds, asAttachment, method]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toastSuccess("Copied", "Presigned URL copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 text-sky-400 rounded">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Presigned URL Engineering Workbench
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-md">
                s3://{bucket}/{objectKey}
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

        {/* Body */}
        <div className="p-6 space-y-5 font-mono text-xs max-h-[75vh] overflow-y-auto">
          {/* Method and Expiry row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method selection */}
            <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                HTTP Method Capability
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("GET")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition ${
                    method === "GET"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  GET (Download)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("PUT")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition ${
                    method === "PUT"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  PUT (Direct Upload)
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                Expiration Duration Preset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.seconds}
                    type="button"
                    onClick={() => setExpirySeconds(p.seconds)}
                    className={`px-2.5 py-1 text-[11px] rounded border transition ${
                      expirySeconds === p.seconds
                        ? "bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Download Disposition toggle if GET */}
          {method === "GET" && (
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={asAttachment}
                onChange={(e) => setAsAttachment(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-0"
              />
              <span className="text-xs">
                Force Browser Download attachment header (<code>Content-Disposition: attachment</code>)
              </span>
            </label>
          )}

          {/* Generated URL Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Active Signed URL
              </span>
              {expiresAt && (
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires: {new Date(expiresAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-2">
              <input
                type="text"
                readOnly
                value={generatedUrl || "Generating signature..."}
                className="w-full bg-transparent text-xs text-sky-300 focus:outline-none font-mono truncate"
              />
              <button
                onClick={copyToClipboard}
                disabled={!generatedUrl}
                className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              {method === "GET" && generatedUrl && (
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Code Snippets Workbench */}
          {generatedUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Code2 className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  SDK Implementation Snippets
                </span>
              </div>
              <PresignedCodeSnippets
                bucket={bucket}
                objectKey={objectKey}
                presignedUrl={generatedUrl}
                method={method}
                expiresInSeconds={expirySeconds}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
