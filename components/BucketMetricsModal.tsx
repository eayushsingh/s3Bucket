"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  HardDrive,
  Layers,
  Database,
  PieChart,
  RefreshCw,
  X,
} from "lucide-react";
import { BucketMetricsResult } from "@/storage/storage.types";

interface BucketMetricsModalProps {
  bucket: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BucketMetricsModal({
  bucket,
  isOpen,
  onClose,
}: BucketMetricsModalProps) {
  const [metrics, setMetrics] = useState<BucketMetricsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/storage/buckets/${bucket}/metrics`);
      const data = await res.json();
      if (data.success && data.data) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen, bucket]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
            <div className="p-1.5 bg-zinc-800 text-emerald-400 rounded">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Bucket Storage Analytics & Allocation
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                s3://{bucket}
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
        <div className="p-6 space-y-6 font-mono text-xs max-h-[70vh] overflow-y-auto">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded">
              <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                <span>Total Stored Payload</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-zinc-100 mt-2">
                {formatBytes(metrics?.totalSizeBytes || 0)}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {(metrics?.totalSizeBytes || 0).toLocaleString()} bytes
              </p>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded">
              <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                <span>Total Objects Count</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl font-bold text-zinc-100 mt-2">
                {metrics?.totalObjects || 0}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Isolated keys indexed</p>
            </div>
          </div>

          {/* Storage Class Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Storage Class Allocation
            </h4>
            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-3">
              {Object.keys(metrics?.storageClassBreakdown || {}).length === 0 ? (
                <p className="text-zinc-500">No objects recorded.</p>
              ) : (
                Object.entries(metrics?.storageClassBreakdown || {}).map(([sc, data]) => {
                  const pct = metrics?.totalSizeBytes ? (data.bytes / metrics.totalSizeBytes) * 100 : 0;
                  return (
                    <div key={sc} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-200 font-semibold">{sc}</span>
                        <span className="text-zinc-400">
                          {formatBytes(data.bytes)} ({pct.toFixed(1)}%) • {data.count} objs
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-sky-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Content Type Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Content Type Distribution
            </h4>
            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-3">
              {Object.keys(metrics?.contentTypeBreakdown || {}).length === 0 ? (
                <p className="text-zinc-500">No objects recorded.</p>
              ) : (
                Object.entries(metrics?.contentTypeBreakdown || {}).map(([cat, data]) => {
                  const pct = metrics?.totalSizeBytes ? (data.bytes / metrics.totalSizeBytes) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-200 capitalize">{cat}</span>
                        <span className="text-zinc-400">
                          {formatBytes(data.bytes)} • {data.count} objs
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center text-zinc-500 text-[11px] font-mono">
          <span>Telemetry updated: {metrics?.lastCalculated ? new Date(metrics.lastCalculated).toLocaleTimeString() : "--"}</span>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
