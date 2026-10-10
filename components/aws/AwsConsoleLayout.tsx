import React, { useState } from "react";
import { AwsGlobalHeader } from "./AwsGlobalHeader";
import { AwsS3Breadcrumbs } from "./AwsS3Breadcrumbs";
import { AwsS3TabBar } from "./AwsS3TabBar";
import { AwsObjectsTab } from "./tabs/AwsObjectsTab";
import { AwsPropertiesTab } from "./tabs/AwsPropertiesTab";
import { AwsPermissionsTab } from "./tabs/AwsPermissionsTab";
import { AwsMetricsTab } from "./tabs/AwsMetricsTab";
import { AwsManagementTab } from "./tabs/AwsManagementTab";
import { AwsDeleteModal } from "./modals/AwsDeleteModal";
import { AwsCreateFolderModal } from "./modals/AwsCreateFolderModal";
import { AwsS3TabId } from "./aws.types";

interface AwsConsoleLayoutProps {
  bucket: string | null;
  buckets: any[];
  objects: any[];
  prefixes: string[];
  currentPrefix: string;
  onSelectBucket: (b: string) => void;
  onNavigatePrefix: (prefix: string) => void;
  onOpenUpload: () => void;
  onOpenMultipart: () => void;
  onInspectObject: (key: string) => void;
  onOpenPresignedModal: (key: string) => void;
  onDeleteObjects: (keys: string[]) => void;
  onRefresh: () => void;
  loading: boolean;
  onOpenCommandPalette: () => void;
  onOpenAuditLog: () => void;
  onOpenShortcuts: () => void;
  onOpenAbout: () => void;
}

export const AwsConsoleLayout: React.FC<AwsConsoleLayoutProps> = ({
  bucket,
  objects,
  prefixes,
  currentPrefix,
  onNavigatePrefix,
  onOpenUpload,
  onOpenMultipart,
  onInspectObject,
  onOpenPresignedModal,
  onDeleteObjects,
  onRefresh,
  loading,
  onOpenCommandPalette,
  onOpenAuditLog,
  onOpenShortcuts,
  onOpenAbout,
}) => {
  const [activeTab, setActiveTab] = useState<AwsS3TabId>("objects");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetKeys, setDeleteTargetKeys] = useState<string[]>([]);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col font-sans">
      <AwsGlobalHeader
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenAuditLog={onOpenAuditLog}
        onOpenShortcuts={onOpenShortcuts}
        onOpenAbout={onOpenAbout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-4">
        <AwsS3Breadcrumbs
          bucket={bucket}
          currentPrefix={currentPrefix}
          onNavigatePrefix={onNavigatePrefix}
          onSelectBucketRoot={() => onNavigatePrefix("")}
        />

        {bucket && (
          <div className="bg-[#1e293b] border border-[#334155] rounded overflow-hidden shadow-lg">
            <AwsS3TabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              objectCount={objects.length}
            />

            <div className="p-4 sm:p-5">
              {activeTab === "objects" && (
                <AwsObjectsTab
                  bucket={bucket}
                  objects={objects}
                  prefixes={prefixes}
                  currentPrefix={currentPrefix}
                  onNavigatePrefix={onNavigatePrefix}
                  onOpenUpload={onOpenUpload}
                  onOpenCreateFolder={() => setIsFolderModalOpen(true)}
                  onInspectObject={onInspectObject}
                  onOpenPresignedModal={onOpenPresignedModal}
                  onDeleteObjects={(keys) => {
                    setDeleteTargetKeys(keys);
                    setIsDeleteModalOpen(true);
                  }}
                  onRefresh={onRefresh}
                  loading={loading}
                />
              )}

              {activeTab === "properties" && <AwsPropertiesTab bucket={bucket} />}
              {activeTab === "permissions" && <AwsPermissionsTab bucket={bucket} />}
              {activeTab === "metrics" && <AwsMetricsTab bucket={bucket} />}
              {activeTab === "management" && <AwsManagementTab bucket={bucket} />}
              {activeTab === "access-points" && (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">
                  No S3 Access Points currently configured for this bucket namespace.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AwsDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        targetKeys={deleteTargetKeys}
        onConfirmDelete={() => {
          onDeleteObjects(deleteTargetKeys);
        }}
      />

      <AwsCreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreateFolder={(name) => {
          // Virtual folder creation via zero-byte object with trailing slash
          fetch("/api/storage/objects/folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucket, folderName: currentPrefix + name }),
          }).then(() => onRefresh());
        }}
      />
    </div>
  );
};
