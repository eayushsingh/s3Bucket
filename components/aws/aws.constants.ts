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
