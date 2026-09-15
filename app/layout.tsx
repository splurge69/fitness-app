import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACL tracker",
  description: "Personal ACL rehab session tracker",
  appleWebApp: {
    capable: true,
    title: "ACL tracker",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ece0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
