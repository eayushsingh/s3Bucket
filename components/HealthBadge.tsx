"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface HealthData {
  status: "healthy" | "unhealthy" | "degraded";
  endpoint: string;
  bucketsCount: number;
  latencyMs: number;
  error?: string;
  timestamp: string;
}

interface HealthBadgeProps {
  onOpenDiagnostics?: () => void;
}

export function HealthBadge({ onOpenDiagnostics }: HealthBadgeProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/health/storage");
      const data = await res.json();
      if (data.data) {
        setHealth(data.data);
      }
    } catch (err: any) {
      setHealth({
        status: "unhealthy",
        endpoint: "Unknown",
        bucketsCount: 0,
        latencyMs: 0,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px] text-zinc-400">
        <Activity className="w-3 h-3 animate-spin text-sky-400" />
        <span>Probing S3 Cluster...</span>
      </div>
    );
  }

  const isHealthy = health?.status === "healthy";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenDiagnostics}
        className={`flex items-center gap-2 px-2.5 py-1 rounded border font-mono text-[11px] transition ${
          isHealthy
            ? "bg-zinc-900 text-emerald-400 border-zinc-800 hover:border-emerald-500/40"
            : "bg-zinc-900 text-rose-400 border-zinc-800 hover:border-rose-500/40"
        }`}
        title="Click to view detailed Cluster Telemetry & Latency History"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isHealthy ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
          }`}
        />
        <span className="font-semibold">{isHealthy ? "ONLINE" : "OFFLINE"}</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-300 font-mono">{health?.latencyMs ?? 0}ms</span>
      </button>

      <button
        onClick={fetchHealth}
        disabled={loading}
        className="p-1 text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded bg-zinc-900 transition"
        title="Ping S3 Cluster"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
