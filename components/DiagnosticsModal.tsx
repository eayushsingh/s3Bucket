"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Server,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
} from "lucide-react";
import { StorageHealthResult } from "@/storage/storage.types";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const [health, setHealth] = useState<StorageHealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/health/storage");
      const data = await res.json();
      if (data.success && data.data) {
        setHealth(data.data);
        setHistory((prev) => [...prev.slice(-9), data.data.latencyMs]);
      }
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Storage Cluster Telemetry & Diagnostics Probe
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Real-time S3 API health check, TLS status and latency profiler
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

        {/* Content */}
        <div className="p-6 space-y-6 font-mono text-xs">
          {/* Status banner */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/70 border border-zinc-800 rounded-md">
            <div className="flex items-center gap-3">
              {health?.status === "healthy" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <div>
                <p className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Cluster Status: {health?.status || "PROBING..."}
                </p>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  {health?.status === "healthy"
                    ? "S3 storage engine responsive with valid SigV4 signature authentication."
                    : health?.error || "Unable to establish S3 client connection."}
                </p>
              </div>
            </div>

            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700/80 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Run Probe
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Round-Trip Latency</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {health?.latencyMs ?? 0} ms
              </p>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Buckets</span>
              <p className="text-lg font-bold text-zinc-100 mt-1">
                {health?.bucketsCount ?? 0}
              </p>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Auth Protocol</span>
              <p className="text-lg font-bold text-sky-400 mt-1">
                AWS SigV4
              </p>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Addressing Style</span>
              <p className="text-lg font-bold text-zinc-100 mt-1">
                Path Style
              </p>
            </div>
          </div>

          {/* Latency History Bars */}
          <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
              <span>Latency History (Last 10 Probes)</span>
              <span>Average: {history.length ? (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1) : 0} ms</span>
            </div>
            <div className="h-16 flex items-end gap-2 pt-2">
              {history.map((lat, idx) => {
                const heightPct = Math.min(100, Math.max(15, (lat / 50) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-emerald-500/60 hover:bg-emerald-400 rounded-t transition-all"
                    />
                    <span className="text-[9px] text-zinc-500">{lat}ms</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Endpoint Details */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Connection Endpoints
            </h4>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded divide-y divide-zinc-800">
              <div className="flex items-center justify-between py-1.5 first:pt-0">
                <span className="text-zinc-500">Internal Storage Endpoint</span>
                <span className="text-zinc-300 font-mono">{health?.endpoint}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">Accessible Namespaces</span>
                <span className="text-zinc-300 font-mono">
                  {health?.accessibleBuckets.join(", ") || "None"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 last:pb-0">
                <span className="text-zinc-500">Last Telemetry Probe</span>
                <span className="text-zinc-400 font-mono">{health?.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
