"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Layers,
  Shield,
  FileCode,
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";
import { BucketLifecycleRule, BucketCorsRule } from "@/storage/storage.types";
import { useToast } from "./ToastContext";

interface BucketPropertiesModalProps {
  bucket: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function BucketPropertiesModal({
  bucket,
  isOpen,
  onClose,
  onUpdate,
}: BucketPropertiesModalProps) {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"versioning" | "lifecycle" | "cors" | "policy">("versioning");

  // Versioning state
  const [versioningStatus, setVersioningStatus] = useState<"Enabled" | "Suspended" | "Disabled">("Disabled");
  const [loadingVersioning, setLoadingVersioning] = useState(false);

  // Lifecycle state
  const [lifecycleRules, setLifecycleRules] = useState<BucketLifecycleRule[]>([]);
  const [loadingLifecycle, setLoadingLifecycle] = useState(false);

  // CORS state
  const [corsRules, setCorsRules] = useState<BucketCorsRule[]>([]);
  const [loadingCors, setLoadingCors] = useState(false);

  // Policy state
  const [policyJson, setPolicyJson] = useState("");
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  // New rule forms
  const [newRulePrefix, setNewRulePrefix] = useState("");
  const [newRuleDays, setNewRuleDays] = useState(30);

  // Fetch Versioning
  const fetchVersioning = async () => {
    try {
      setLoadingVersioning(true);
      const res = await fetch(`/api/storage/buckets/${bucket}/versioning`);
      const data = await res.json();
      if (data.success) {
        setVersioningStatus(data.data.status);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingVersioning(false);
    }
  };

  // Fetch Lifecycle
  const fetchLifecycle = async () => {
    try {
      setLoadingLifecycle(true);
      const res = await fetch(`/api/storage/buckets/${bucket}/lifecycle`);
      const data = await res.json();
      if (data.success) {
        setLifecycleRules(data.data.rules || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLifecycle(false);
    }
  };

  // Fetch CORS
  const fetchCors = async () => {
    try {
      setLoadingCors(true);
      const res = await fetch(`/api/storage/buckets/${bucket}/cors`);
      const data = await res.json();
      if (data.success) {
        setCorsRules(data.data.rules || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCors(false);
    }
  };

  // Fetch Policy
  const fetchPolicy = async () => {
    try {
      setLoadingPolicy(true);
      const res = await fetch(`/api/storage/buckets/${bucket}/policy`);
      const data = await res.json();
      if (data.success) {
        setPolicyJson(data.data.policy ? JSON.stringify(JSON.parse(data.data.policy), null, 2) : "");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingPolicy(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersioning();
      fetchLifecycle();
      fetchCors();
      fetchPolicy();
    }
  }, [isOpen, bucket]);

  if (!isOpen) return null;

  // Toggle versioning
  const handleToggleVersioning = async () => {
    const nextStatus = versioningStatus === "Enabled" ? "Suspended" : "Enabled";
    try {
      const res = await fetch(`/api/storage/buckets/${bucket}/versioning`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setVersioningStatus(nextStatus);
        success("Versioning Updated", `Bucket versioning is now ${nextStatus}`);
        onUpdate?.();
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toastError("Versioning Error", err.message);
    }
  };

  // Save Lifecycle Rule
  const handleAddLifecycleRule = async () => {
    const newRule: BucketLifecycleRule = {
      id: `rule-${Date.now()}`,
      status: "Enabled",
      prefix: newRulePrefix,
      transitions: [{ days: newRuleDays, storageClass: "GLACIER" }],
      expirationDays: newRuleDays * 2,
    };
    const updated = [...lifecycleRules, newRule];
    try {
      const res = await fetch(`/api/storage/buckets/${bucket}/lifecycle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setLifecycleRules(updated);
        setNewRulePrefix("");
        success("Lifecycle Rule Added", `Objects transition to Glacier after ${newRuleDays} days`);
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toastError("Lifecycle Error", err.message);
    }
  };

  // Delete Lifecycle Rule
  const handleDeleteLifecycleRule = async (ruleId: string) => {
    const updated = lifecycleRules.filter((r) => r.id !== ruleId);
    try {
      const res = await fetch(`/api/storage/buckets/${bucket}/lifecycle`, {
        method: updated.length ? "PUT" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: updated.length ? JSON.stringify({ rules: updated }) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setLifecycleRules(updated);
        success("Lifecycle Rule Removed", "Bucket lifecycle rules updated");
      }
    } catch (err: any) {
      toastError("Delete Failed", err.message);
    }
  };

  // Save Policy
  const handleSavePolicy = async () => {
    try {
      const res = await fetch(`/api/storage/buckets/${bucket}/policy`, {
        method: policyJson.trim() ? "PUT" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: policyJson.trim() ? JSON.stringify({ policy: policyJson }) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        success("Policy Updated", "Bucket IAM policy successfully synced");
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toastError("Policy Error", err.message);
    }
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
            <div className="p-1.5 bg-zinc-800 text-indigo-400 rounded">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Bucket Configuration & Governance
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

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/20 px-5 gap-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab("versioning")}
            className={`py-2.5 border-b-2 font-medium transition ${
              activeTab === "versioning"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Versioning
          </button>
          <button
            onClick={() => setActiveTab("lifecycle")}
            className={`py-2.5 border-b-2 font-medium transition ${
              activeTab === "lifecycle"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Lifecycle Rules ({lifecycleRules.length})
          </button>
          <button
            onClick={() => setActiveTab("cors")}
            className={`py-2.5 border-b-2 font-medium transition ${
              activeTab === "cors"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            CORS ({corsRules.length})
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={`py-2.5 border-b-2 font-medium transition ${
              activeTab === "policy"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            IAM Policy JSON
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 font-mono text-xs max-h-[65vh] overflow-y-auto">
          {activeTab === "versioning" && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100">Object Versioning</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        versioningStatus === "Enabled"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {versioningStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans mt-1">
                    Protects against unintended overwrites and accidental deletions by retaining historical revisions of every object.
                  </p>
                </div>
                <button
                  onClick={handleToggleVersioning}
                  disabled={loadingVersioning}
                  className={`px-3 py-1.5 rounded text-xs transition ${
                    versioningStatus === "Enabled"
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {versioningStatus === "Enabled" ? "Suspend Versioning" : "Enable Versioning"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "lifecycle" && (
            <div className="space-y-4">
              {/* Add rule inline form */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  Add S3 Transition & Expiration Rule
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newRulePrefix}
                    onChange={(e) => setNewRulePrefix(e.target.value)}
                    placeholder="Prefix filter (e.g. logs/ or backups/)"
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none flex-1 font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newRuleDays}
                      onChange={(e) => setNewRuleDays(parseInt(e.target.value, 10))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 w-20 font-mono"
                    />
                    <span className="text-zinc-500 text-[11px]">Days to Glacier</span>
                  </div>
                  <button
                    onClick={handleAddLifecycleRule}
                    className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-sans transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Rules list */}
              <div className="divide-y divide-zinc-900 border border-zinc-800 rounded overflow-hidden">
                {lifecycleRules.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    No lifecycle rules defined for this bucket.
                  </div>
                ) : (
                  lifecycleRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-zinc-900/30 flex items-center justify-between hover:bg-zinc-900/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">
                            Prefix: {rule.prefix || "(All Objects)"}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                            {rule.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Transitions to GLACIER after {rule.transitions?.[0]?.days || 30} days
                          {rule.expirationDays ? ` • Expires after ${rule.expirationDays} days` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteLifecycleRule(rule.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "cors" && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded">
                <span className="text-zinc-300 font-semibold">Active Cross-Origin Rules</span>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">
                  Enables direct browser presigned PUT/GET requests across external domains.
                </p>
                <div className="mt-3 space-y-2">
                  {corsRules.length === 0 ? (
                    <p className="text-zinc-500">No custom CORS rules configured (defaults apply).</p>
                  ) : (
                    corsRules.map((rule, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-900 rounded border border-zinc-800 space-y-1">
                        <div>
                          <span className="text-zinc-500">Origins: </span>
                          <span className="text-zinc-200">{rule.allowedOrigins.join(", ")}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Methods: </span>
                          <span className="text-sky-400">{rule.allowedMethods.join(", ")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "policy" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Bucket Access Policy (AWS IAM JSON Format)</span>
                <button
                  onClick={handleSavePolicy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Policy
                </button>
              </div>
              <textarea
                value={policyJson}
                onChange={(e) => setPolicyJson(e.target.value)}
                rows={10}
                placeholder={`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": "*",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::${bucket}/*"\n    }\n  ]\n}`}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
