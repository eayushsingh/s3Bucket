"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  timestamp: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        description,
        timestamp: new Date().toLocaleTimeString(),
      };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds for success/info, 6s for errors/warnings
      const duration = type === "error" || type === "warning" ? 6000 : 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => showToast("success", title, description), [showToast]);
  const error = useCallback((title: string, description?: string) => showToast("error", title, description), [showToast]);
  const info = useCallback((title: string, description?: string) => showToast("info", title, description), [showToast]);
  const warning = useCallback((title: string, description?: string) => showToast("warning", title, description), [showToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, info, warning, removeToast }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-zinc-900/95 border-emerald-500/30 text-emerald-400"
                : toast.type === "error"
                ? "bg-zinc-900/95 border-rose-500/40 text-rose-400"
                : toast.type === "warning"
                ? "bg-zinc-900/95 border-amber-500/30 text-amber-400"
                : "bg-zinc-900/95 border-zinc-700 text-zinc-300"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-100 tracking-tight">{toast.title}</p>
                <span className="text-[10px] text-zinc-500 font-mono">{toast.timestamp}</span>
              </div>
              {toast.description && (
                <p className="text-[11px] text-zinc-400 mt-0.5 break-words font-mono">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
