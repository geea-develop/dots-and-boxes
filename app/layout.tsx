import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dots & Boxes",
  description: "A two-player Dots and Boxes game — mobile-friendly",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dots & Boxes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon-192.png`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
