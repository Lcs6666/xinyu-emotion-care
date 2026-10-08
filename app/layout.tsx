import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./care-practice.css";

export const metadata: Metadata = {
  title: "心屿｜情绪日记与自我关怀",
  description: "记录每日心情，理解情绪触发因素，找到适合自己的关怀方式。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
