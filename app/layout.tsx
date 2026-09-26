import type { Metadata, Viewport } from "next";
import { ArtDefs } from "@/components/exercise-art";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Serginho",
  description: "Personal training and ACL rehab log",
  appleWebApp: {
    capable: true,
    title: "Club Serginho",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#12081f",
  width: "device-width",
  initialScale: 1,
};

// Fonts load in the browser, not at build time, so Vercel builds stay offline.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,700&family=Racing+Sans+One&family=VT323&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-full">
        <ArtDefs />
        {children}
      </body>
    </html>
  );
}
