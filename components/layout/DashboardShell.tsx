"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

interface Props {
  children: React.ReactNode;
  totalBytes: number;
  usedBytes: number;
  userEmail: string;
}

export default function DashboardShell({
  children,
  totalBytes,
  usedBytes,
  userEmail,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-ink-950">
      {/* Ambient aurora wash behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-[-10%] h-[480px] w-[480px] rounded-full bg-accent-500/15 blur-3xl animate-pulse-soft" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-coral-500/12 blur-3xl animate-pulse-soft [animation-delay:1.4s]" />
      </div>

      <Sidebar
        userEmail={userEmail}
        usedBytes={usedBytes}
        totalBytes={totalBytes}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onOpenNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
