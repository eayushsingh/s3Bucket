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

export interface AwsBucketProperties {
  bucket: string;
  region: string;
  arn: string;
  creationDate: string;
  versioningStatus: "Enabled" | "Suspended" | "Disabled";
  defaultEncryption: {
    type: "SSE-S3" | "SSE-KMS";
    bucketKeyEnabled: boolean;
    kmsMasterKeyId?: string;
  };
  serverAccessLogging: {
    enabled: boolean;
    targetBucket?: string;
    targetPrefix?: string;
  };
  staticWebsiteHosting: {
    enabled: boolean;
    indexDocument?: string;
    errorDocument?: string;
  };
  transferAcceleration: boolean;
  objectLock: boolean;
  tags: Record<string, string>;
}

export interface AwsBlockPublicAccessSettings {
  blockPublicAcls: boolean;
  ignorePublicAcls: boolean;
  blockPublicPolicy: boolean;
  restrictPublicBuckets: boolean;
}

export interface AwsCorsRule {
  allowedHeaders: string[];
  allowedMethods: ("GET" | "PUT" | "POST" | "DELETE" | "HEAD")[];
  allowedOrigins: string[];
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
}

export interface AwsLifecycleRule {
  id: string;
  status: "Enabled" | "Disabled";
  prefix: string;
  transitions: {
    days: number;
    storageClass: AwsStorageClass;
  }[];
  expirationDays?: number;
  noncurrentVersionExpirationDays?: number;
}

export interface AwsBucketMetricsData {
  bucketSizeSeries: { timestamp: string; bytes: number }[];
  objectCountSeries: { timestamp: string; count: number }[];
  requestCount24h: {
    allRequests: number;
    getRequests: number;
    putRequests: number;
    deleteRequests: number;
  };
  latencyMs: number;
}
