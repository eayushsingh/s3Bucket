export type AwsS3TabId = "objects" | "properties" | "permissions" | "metrics" | "management" | "access-points";

export interface AwsRegionInfo {
  id: string;
  name: string;
  location: string;
  isDefault?: boolean;
}

export type AwsStorageClass =
  | "STANDARD"
  | "INTELLIGENT_TIERING"
  | "STANDARD_IA"
  | "ONEZONE_IA"
  | "GLACIER_IR"
  | "GLACIER"
  | "DEEP_ARCHIVE";

export interface AwsStorageClassOption {
  value: AwsStorageClass;
  label: string;
  description: string;
  durability: string;
  minDurationDays: number;
}

export interface AwsS3ObjectItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  storageClass: AwsStorageClass;
  isFolder: boolean;
  etag?: string;
  versionId?: string;
}

export interface AwsSelectedObjectSummary {
  keys: string[];
  totalBytes: number;
  count: number;
}
