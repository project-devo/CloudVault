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
  showBrandHeader,
  totalBytes,
  usedBytes,
  userEmail,
}: {
  currentCategory: string;
  onNavigate: () => void;
  onSignOut: () => Promise<void>;
  pct: number;
  showBrandHeader: boolean;
  totalBytes: number;
  usedBytes: number;
  userEmail: string;
}) {
  return (
    <>
      {showBrandHeader && (
        <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-5">
          <Cloud className="h-6 w-6 text-brand-500" />
          <span className="text-lg font-bold text-white">CloudVault</span>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, icon: Icon, category }) => (
          <Link
            key={category}
            href={`/dashboard?category=${category}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentCategory === category
                ? "bg-brand-500/15 text-brand-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="my-3 border-t border-gray-800" />

        {BOTTOM_ITEMS.map(({ label, icon: Icon, category }) => (
          <Link
            key={category}
            href={`/dashboard?category=${category}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentCategory === category
                ? "bg-brand-500/15 text-brand-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-800 px-4 py-4">
        <div className="mb-2 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-400">Storage</span>
        </div>
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-brand-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
        </p>
      </div>

      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/20">
            <span className="text-xs font-bold text-brand-400">
              {userEmail[0]?.toUpperCase()}
            </span>
          </div>
          <span className="flex-1 truncate text-xs text-gray-400">{userEmail}</span>
          <button
            onClick={() => void onSignOut()}
            className="text-gray-600 transition-colors hover:text-gray-300"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
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
    showBrandHeader: true,
    totalBytes,
    usedBytes,
    userEmail,
  };

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900 md:flex">
        <SidebarContent {...contentProps} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-gray-800 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
              <div className="flex items-center gap-2">
                <Cloud className="h-6 w-6 text-brand-500" />
                <span className="text-lg font-bold text-white">CloudVault</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 transition-colors hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent {...contentProps} showBrandHeader={false} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
