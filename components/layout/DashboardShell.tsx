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
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar
        userEmail={userEmail}
        usedBytes={usedBytes}
        totalBytes={totalBytes}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onOpenNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 animate-fade-in sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
