import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Radar — Crypto & AI Signal Monitor",
  description: "Real-time crypto and AI hot topic aggregation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body style={{ position: "relative", zIndex: 1 }}>
        {children}
      </body>
    </html>
  );
}
