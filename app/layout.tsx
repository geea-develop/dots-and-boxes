import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dots and Boxes",
  description: "A simple two-player Dots and Boxes game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
