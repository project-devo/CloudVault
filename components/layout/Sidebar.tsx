"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Cloud,
  FileText,
  FolderOpen,
  HardDrive,
  Image,
  LogOut,
  Music,
  Star,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { cn, formatBytes, storagePercent } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userEmail: string;
  usedBytes: number;
  totalBytes: number;
  mobileOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "All Files", icon: FolderOpen, category: "all" },
  { label: "Images", icon: Image, category: "images" },
  { label: "Documents", icon: FileText, category: "documents" },
  { label: "Videos", icon: Video, category: "videos" },
  { label: "Audio", icon: Music, category: "audio" },
  { label: "Archives", icon: Archive, category: "archives" },
];

const BOTTOM_ITEMS = [
  { label: "Starred", icon: Star, category: "starred" },
  { label: "Trash", icon: Trash2, category: "trash" },
];

function SidebarContent({
  currentCategory,
  onNavigate,
  onSignOut,
  pct,
  totalBytes,
  usedBytes,
  userEmail,
}: {
  currentCategory: string;
  onNavigate: () => void;
  onSignOut: () => Promise<void>;
  pct: number;
  totalBytes: number;
  usedBytes: number;
  userEmail: string;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 py-1"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl aurora-bg shadow-glow-accent">
          <Cloud className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          CloudVault
        </span>
      </Link>

      <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, category }) => (
          <Link
            key={category}
            href={`/dashboard?category=${category}`}
            onClick={onNavigate}
            data-active={currentCategory === category}
            className="nav-pill"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="my-3 h-px bg-white/5" />

        {BOTTOM_ITEMS.map(({ label, icon: Icon, category }) => (
          <Link
            key={category}
            href={`/dashboard?category=${category}`}
            onClick={onNavigate}
            data-active={currentCategory === category}
            className="nav-pill"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-ink-300" />
            <span className="text-xs font-medium text-ink-200">Storage</span>
          </div>
          <span className="text-xs font-semibold text-white">{pct}%</span>
        </div>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-apple",
              pct > 90
                ? "bg-gradient-to-r from-coral-500 to-coral-400"
                : pct > 70
                ? "bg-gradient-to-r from-coral-500 to-coral-300"
                : "aurora-bg"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-ink-300">
          {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500/30 to-coral-500/30 ring-1 ring-inset ring-white/10">
          <span className="text-xs font-semibold text-white">
            {userEmail[0]?.toUpperCase()}
          </span>
        </div>
        <span className="flex-1 truncate text-xs text-ink-200">
          {userEmail}
        </span>
        <button
          onClick={() => void onSignOut()}
          className="text-ink-400 transition-all duration-200 ease-apple hover:scale-110 hover:text-white"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export default function Sidebar({
  userEmail,
  usedBytes,
  totalBytes,
  mobileOpen,
  onClose,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category") ?? "all";
  const pct = storagePercent(usedBytes, totalBytes);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/auth/login");
    router.refresh();
  }

  const contentProps = {
    currentCategory,
    onNavigate: onClose,
    onSignOut: handleSignOut,
    pct,
    totalBytes,
    usedBytes,
    userEmail,
  };

  return (
    <>
      {/* Desktop floating glass sidebar */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col p-3 md:flex",
          "sticky top-0"
        )}
      >
        <div className="glass flex h-full w-60 flex-col rounded-2xl p-4 shadow-soft-lg">
          <SidebarContent {...contentProps} />
        </div>
      </aside>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fade-in"
            onClick={onClose}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-white/[0.06] bg-ink-900/90 p-4 shadow-2xl backdrop-blur-2xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-200">Menu</span>
              <button
                onClick={onClose}
                className="text-ink-300 transition-colors hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent {...contentProps} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
