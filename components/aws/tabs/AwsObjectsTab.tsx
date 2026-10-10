import React, { useState } from "react";
import { Folder, File, Search, RefreshCw, CheckSquare, Square } from "lucide-react";
import { AwsObjectsActionBar } from "./AwsObjectsActionBar";

interface AwsObjectsTabProps {
  bucket: string;
  objects: any[];
  prefixes: string[];
  currentPrefix: string;
  onNavigatePrefix: (prefix: string) => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onInspectObject: (key: string) => void;
  onOpenPresignedModal: (key: string) => void;
  onDeleteObjects: (keys: string[]) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const AwsObjectsTab: React.FC<AwsObjectsTabProps> = ({
  bucket,
  objects,
  prefixes,
  currentPrefix,
  onNavigatePrefix,
  onOpenUpload,
  onOpenCreateFolder,
  onInspectObject,
  onOpenPresignedModal,
  onDeleteObjects,
  onRefresh,
  loading,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const allKeys = objects.map((o) => o.key);
  const isAllSelected = allKeys.length > 0 && selectedKeys.length === allKeys.length;

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedKeys([]);
    else setSelectedKeys([...allKeys]);
  };

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filteredObjects = objects.filter((o) =>
    o.key.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Action Bar */}
      <AwsObjectsActionBar
        selectedCount={selectedKeys.length}
        onOpenUpload={onOpenUpload}
        onOpenCreateFolder={onOpenCreateFolder}
        onDownloadSelected={() => {
          if (selectedKeys.length > 0) onOpenPresignedModal(selectedKeys[0]);
        }}
        onOpenDeleteModal={() => {
          if (selectedKeys.length > 0) onDeleteObjects(selectedKeys);
        }}
        onCopyS3Uri={() => {
          if (selectedKeys.length > 0) {
            navigator.clipboard.writeText(`s3://${bucket}/${selectedKeys[0]}`);
          }
        }}
        onOpenPresigned={() => {
          if (selectedKeys.length === 1) onOpenPresignedModal(selectedKeys[0]);
        }}
      />

      {/* Search & Refresh Filter */}
      <div className="flex items-center justify-between gap-3 bg-[#1e293b]/60 p-2.5 rounded border border-[#334155] text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Find objects by prefix..."
            className="w-full bg-[#0f172a] border border-[#334155] rounded pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={onRefresh}
          className="btn-aws-secondary text-xs flex items-center gap-1.5"
          title="Refresh objects list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* High-density AWS Objects Table */}
      <div className="border border-[#334155] rounded bg-[#1e293b] overflow-x-auto shadow-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#0f172a] border-b border-[#334155] text-gray-400 font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <button onClick={toggleSelectAll}>
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Last modified</th>
              <th className="py-2.5 px-3 text-right">Size</th>
              <th className="py-2.5 px-3">Storage class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {/* Folder Prefixes */}
            {prefixes.map((prefix) => (
              <tr
                key={prefix}
                onClick={() => onNavigatePrefix(prefix)}
                className="aws-table-row cursor-pointer hover:bg-[#334155]/40"
              >
                <td className="py-2 px-3 text-center"></td>
                <td className="py-2 px-3 font-medium text-amber-400 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-400/90" />
                  <span>{prefix.split("/").filter(Boolean).pop()}/</span>
                </td>
                <td className="py-2 px-3 text-gray-400">Folder</td>
                <td className="py-2 px-3 text-gray-500">--</td>
                <td className="py-2 px-3 text-right text-gray-500 font-mono">--</td>
                <td className="py-2 px-3 text-gray-500">--</td>
              </tr>
            ))}

            {/* Objects */}
            {filteredObjects.map((obj) => {
              const isSelected = selectedKeys.includes(obj.key);
              const displayName = obj.key.replace(currentPrefix, "");

              return (
                <tr
                  key={obj.key}
                  className={`aws-table-row ${isSelected ? "selected" : ""}`}
                >
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => toggleSelectKey(obj.key)}>
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td
                    onClick={() => onInspectObject(obj.key)}
                    className="py-2 px-3 font-medium text-gray-200 hover:text-amber-400 cursor-pointer flex items-center gap-2"
                  >
                    <File className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-md font-mono text-[11px]">{displayName}</span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 text-[11px]">Object</td>
                  <td className="py-2 px-3 text-gray-400 text-[11px] font-mono">
                    {new Date(obj.lastModified).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-300">
                    {formatBytes(obj.size)}
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-[11px]">Standard</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
