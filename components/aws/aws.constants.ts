import { AwsRegionInfo, AwsStorageClassOption } from "./aws.types";

export const AWS_REGIONS: AwsRegionInfo[] = [
  { id: "us-east-1", name: "US East (N. Virginia)", location: "North America", isDefault: true },
  { id: "us-east-2", name: "US East (Ohio)", location: "North America" },
  { id: "us-west-1", name: "US West (N. California)", location: "North America" },
  { id: "us-west-2", name: "US West (Oregon)", location: "North America" },
  { id: "eu-west-1", name: "Europe (Ireland)", location: "Europe" },
  { id: "eu-central-1", name: "Europe (Frankfurt)", location: "Europe" },
  { id: "ap-northeast-1", name: "Asia Pacific (Tokyo)", location: "Asia Pacific" },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", location: "Asia Pacific" },
  { id: "local-minio", name: "Local MinIO Cluster", location: "On-Premises" },
];

export const AWS_STORAGE_CLASSES: AwsStorageClassOption[] = [
  {
    value: "STANDARD",
    label: "Standard",
    description: "Frequently accessed data with low latency and high throughput performance.",
    durability: "99.999999999% (11 9s)",
    minDurationDays: 0,
  },
  {
    value: "INTELLIGENT_TIERING",
    label: "Intelligent-Tiering",
    description: "Automatic cost savings by moving data across access tiers based on usage.",
    durability: "99.999999999% (11 9s)",
    minDurationDays: 0,
  },
  {
    value: "STANDARD_IA",
    label: "Standard-IA",
    description: "Infrequently accessed data requiring rapid access when needed.",
    durability: "99.999999999% (11 9s)",
    minDurationDays: 30,
  },
  {
    value: "GLACIER",
    label: "Glacier Flexible Retrieval",
    description: "Low-cost archival storage with configurable retrieval from minutes to hours.",
    durability: "99.999999999% (11 9s)",
    minDurationDays: 90,
  },
  {
    value: "DEEP_ARCHIVE",
    label: "Glacier Deep Archive",
    description: "Lowest-cost storage class designed for long-term retention and compliance.",
    durability: "99.999999999% (11 9s)",
    minDurationDays: 180,
  },
];

export function getDefaultBucketPolicy(bucketName: string): string {
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    },
    null,
    2
  );
}

export const DEFAULT_CORS_CONFIG = JSON.stringify(
  [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: ["*"],
      ExposeHeaders: ["ETag", "x-amz-server-side-encryption"],
      MaxAgeSeconds: 3600,
    },
  ],
  null,
  2
);
