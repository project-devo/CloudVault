import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import { LoadingProvider } from "@/lib/useLoading";
import { ToastProvider } from "@/lib/useToast";
import LoadingIndicator from "@/components/LoadingIndicator";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Headlines, file names and the wordmark.
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "CloudVault - Your Personal Cloud Storage",
  description: "Securely upload, organize, and access your files from anywhere.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1815" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${serif.variable} ${inter.className} relative h-full bg-ink-950 font-sans text-ink-50 antialiased`}
      >
        <LoadingProvider>
          <ToastProvider>
            {children}
            <Suspense fallback={null}>
              <LoadingIndicator />
            </Suspense>
          </ToastProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
