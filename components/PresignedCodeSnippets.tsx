"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

interface PresignedCodeSnippetsProps {
  bucket: string;
  objectKey: string;
  presignedUrl: string;
  method: "GET" | "PUT" | "DELETE";
  expiresInSeconds: number;
}

export function PresignedCodeSnippets({
  bucket,
  objectKey,
  presignedUrl,
  method,
  expiresInSeconds,
}: PresignedCodeSnippetsProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "awscli" | "python" | "node" | "go">("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: method === "PUT"
      ? `# Upload binary payload directly via presigned PUT
curl -X PUT "${presignedUrl}" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary "@/path/to/local-file"`
      : method === "DELETE"
      ? `# Delete object via presigned DELETE
curl -X DELETE "${presignedUrl}"`
      : `# Download object directly via presigned GET
curl -O "${presignedUrl}"`,

    awscli: method === "PUT"
      ? `# AWS CLI: Generate upload URL
aws s3 presign "s3://${bucket}/${objectKey}" --expires-in ${expiresInSeconds}`
      : `# AWS CLI: Generate download URL
aws s3 presign "s3://${bucket}/${objectKey}" --expires-in ${expiresInSeconds}`,

    python: `import boto3
from botocore.client import Config

# Initialize S3 client for MinIO / AWS S3
s3_client = boto3.client(
    's3',
    endpoint_url='http://localhost:9000',
    aws_access_key_id='minioadmin',
    aws_secret_access_key='minioadmin',
    config=Config(signature_version='s3v4'),
    region_name='us-east-1'
)

# Generate presigned ${method} URL
url = s3_client.generate_presigned_url(
    ClientMethod='${method === "PUT" ? "put_object" : method === "DELETE" ? "delete_object" : "get_object"}',
    Params={'Bucket': '${bucket}', 'Key': '${objectKey}'},
    ExpiresIn=${expiresInSeconds}
)

print(f"Generated URL: {url}")`,

    node: `import { S3Client, ${method === "PUT" ? "PutObjectCommand" : method === "DELETE" ? "DeleteObjectCommand" : "GetObjectCommand"} } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true,
});

const command = new ${method === "PUT" ? "PutObjectCommand" : method === "DELETE" ? "DeleteObjectCommand" : "GetObjectCommand"}({
  Bucket: "${bucket}",
  Key: "${objectKey}",
});

const signedUrl = await getSignedUrl(client, command, { expiresIn: ${expiresInSeconds} });
console.log("Presigned URL:", signedUrl);`,

    go: `package main

import (
	"context"
	"fmt"
	"time"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
	presignClient := s3.NewPresignClient(s3Client)
	req, err := presignClient.Presign${method === "PUT" ? "Put" : method === "DELETE" ? "Delete" : "Get"}Object(context.TODO(), &s3.${method === "PUT" ? "Put" : method === "DELETE" ? "Delete" : "Get"}ObjectInput{
		Bucket: aws.String("${bucket}"),
		Key:    aws.String("${objectKey}"),
	}, s3.WithPresignExpires(${expiresInSeconds}*time.Second))

	if err != nil {
		panic(err)
	}
	fmt.Println("URL:", req.URL)
}`,
  };

  const copyActive = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded font-mono text-xs overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("curl")}
            className={`px-2 py-1 rounded text-[11px] transition ${
              activeTab === "curl" ? "bg-zinc-800 text-zinc-100 font-semibold" : "hover:text-zinc-200"
            }`}
          >
            cURL
          </button>
          <button
            onClick={() => setActiveTab("awscli")}
            className={`px-2 py-1 rounded text-[11px] transition ${
              activeTab === "awscli" ? "bg-zinc-800 text-zinc-100 font-semibold" : "hover:text-zinc-200"
            }`}
          >
            AWS CLI
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`px-2 py-1 rounded text-[11px] transition ${
              activeTab === "python" ? "bg-zinc-800 text-zinc-100 font-semibold" : "hover:text-zinc-200"
            }`}
          >
            Python (boto3)
          </button>
          <button
            onClick={() => setActiveTab("node")}
            className={`px-2 py-1 rounded text-[11px] transition ${
              activeTab === "node" ? "bg-zinc-800 text-zinc-100 font-semibold" : "hover:text-zinc-200"
            }`}
          >
            Node.js (SDK v3)
          </button>
          <button
            onClick={() => setActiveTab("go")}
            className={`px-2 py-1 rounded text-[11px] transition ${
              activeTab === "go" ? "bg-zinc-800 text-zinc-100 font-semibold" : "hover:text-zinc-200"
            }`}
          >
            Go (v2)
          </button>
        </div>

        <button
          onClick={copyActive}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Snippet Content */}
      <pre className="p-3 text-[11px] text-zinc-300 overflow-x-auto whitespace-pre font-mono max-h-64">
        {snippets[activeTab]}
      </pre>
    </div>
  );
}
