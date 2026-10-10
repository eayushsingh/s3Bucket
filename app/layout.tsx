import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S3-Compatible Object Storage Console (MinIO Native)",
  description:
    "Production-grade S3-compatible cloud object storage console, built with MinIO, Next.js, and TypeScript.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        <main className="relative z-10 min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}

