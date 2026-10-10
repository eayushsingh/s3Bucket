"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  X,
  Play,
  Pause,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { S3AuditEvent } from "@/storage/storage.types";

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeBucket?: string | null;
}

export function AuditLogDrawer({ isOpen, onClose, activeBucket }: AuditLogDrawerProps) {
  const [events, setEvents] = useState<S3AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [filterOp, setFilterOp] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterOp) query.set("operation", filterOp);
      const res = await fetch(`/api/storage/events?${query.toString()}`);
      const data = await res.json();
      if (data.success && data.data?.events) {
        setEvents(data.data.events);
      }
    } catch (err) {
      console.error("Failed to load audit events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchEvents();

    if (!isLive) return;
    const interval = setInterval(() => {
      fetchEvents();
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, isLive, filterOp]);

  if (!isOpen) return null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s3-audit-trail-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-800 text-zinc-300 rounded">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  S3 Operational Audit Stream
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LEDGER
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                Real-time API interactions, status codes, and latency telemetry
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

        {/* Controls Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-900/20 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={filterOp}
              onChange={(e) => setFilterOp(e.target.value)}
              placeholder="Filter operation (e.g. PutObject, Lifecycle)..."
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 w-full max-w-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition ${
                isLive
                  ? "bg-zinc-900 text-emerald-400 border-emerald-500/30 hover:bg-zinc-800"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isLive ? "Pause" : "Live"}
            </button>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-1 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded bg-zinc-900 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={exportJson}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 transition"
              title="Export JSON"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 font-mono text-xs p-3">
          {events.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No audit events recorded yet.
            </div>
          ) : (
            events.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              const is2xx = evt.statusCode >= 200 && evt.statusCode < 300;
              const is4xx = evt.statusCode >= 400 && evt.statusCode < 500;
              const is5xx = evt.statusCode >= 500;

              return (
                <div key={evt.id} className="py-2 px-2 hover:bg-zinc-900/60 rounded">
                  <div
                    className="flex items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setSelectedEventId(isSelected ? null : evt.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          is2xx
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : is4xx
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {evt.statusCode}
                      </span>
                      <span className="font-semibold text-zinc-200">{evt.operation}</span>
                      {evt.bucket && (
                        <span className="text-zinc-500 truncate max-w-[120px]">
                          s3://{evt.bucket}
                          {evt.objectKey ? `/${evt.objectKey}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-zinc-500">{evt.latencyMs}ms</span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 p-3 bg-zinc-900 rounded border border-zinc-800 text-[11px] text-zinc-300 overflow-x-auto">
                      <div className="grid grid-cols-2 gap-2 mb-2 text-zinc-400 border-b border-zinc-800 pb-2">
                        <div>
                          <span className="text-zinc-500">Event ID: </span>
                          <span className="text-zinc-300 font-mono">{evt.id}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Timestamp: </span>
                          <span className="text-zinc-300 font-mono">{evt.timestamp}</span>
                        </div>
                        {evt.bucket && (
                          <div>
                            <span className="text-zinc-500">Bucket: </span>
                            <span className="text-zinc-300 font-mono">{evt.bucket}</span>
                          </div>
                        )}
                        {evt.objectKey && (
                          <div>
                            <span className="text-zinc-500">Object Key: </span>
                            <span className="text-zinc-300 font-mono">{evt.objectKey}</span>
                          </div>
                        )}
                      </div>
                      <pre className="text-emerald-400 font-mono overflow-x-auto">
                        {JSON.stringify(evt.details || {}, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-900 bg-zinc-950 text-right text-[11px] text-zinc-500 font-mono">
          Total Buffer Entries: {events.length} | Circular Memory: Max 500
        </div>
      </div>
    </div>
  );
}
