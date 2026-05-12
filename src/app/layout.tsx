import type { Metadata } from "next";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";


import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TzoShop",
  description:
    "TzoShop cung cấp các gói API Credits linh hoạt cho học tập, làm việc và sử dụng cùng các công cụ hỗ trợ.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
