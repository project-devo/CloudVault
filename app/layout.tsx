import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CloudVault - Your Personal Cloud Storage",
  description: "Securely upload, organize, and access your files from anywhere.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${inter.className} relative h-full bg-ink-950 font-sans text-ink-50 antialiased`}
      >
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
