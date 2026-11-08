"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  FileText,
  FolderOpen,
  Image,
  Link2,
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
  { label: "Starred", icon: Star, category: "starred", href: "/dashboard?category=starred" },
  { label: "Shared Links", icon: Link2, category: "shares", href: "/dashboard/shares" },
  { label: "Trash", icon: Trash2, category: "trash", href: "/dashboard?category=trash" },
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
        className="px-3 py-1 font-serif text-xl font-semibold italic tracking-tight text-ink-50"
      >
        CloudVault
      </Link>

      <nav className="mt-8 flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, category }) => (
          <Link
            key={category}
            href={`/dashboard?category=${category}`}
            onClick={onNavigate}
            data-active={currentCategory === category}
            className="nav-pill"
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {label}
          </Link>
        ))}

        <div className="my-3 h-px bg-ink-700" />

        {BOTTOM_ITEMS.map(({ label, icon: Icon, category, href }) => (
          <Link
            key={category}
            href={href}
            onClick={onNavigate}
            data-active={currentCategory === category}
            className="nav-pill"
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-ink-700 pt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-50">
            Storage
          </span>
          <span className="text-xs text-ink-300">{pct}%</span>
        </div>
        <div className="mb-2 h-0.5 w-full bg-ink-700">
          <div
            className={cn(
              "h-full transition-all duration-700 ease-apple",
              pct > 90 ? "bg-coral-500" : "bg-accent-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-ink-300">
          {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-ink-700 pt-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800">
          <span className="text-xs font-semibold text-ink-50">
            {userEmail[0]?.toUpperCase()}
          </span>
        </div>
        <span className="flex-1 truncate text-xs text-ink-300">
          {userEmail}
        </span>
        <button
          onClick={() => void onSignOut()}
          className="text-ink-400 transition-colors duration-200 ease-apple hover:text-ink-50"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
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
  const pathname = usePathname();
  const router = useRouter();
  const currentCategory =
    pathname === "/dashboard/shares"
      ? "shares"
      : (searchParams.get("category") ?? "all");
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
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-950 p-5 md:flex">
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px] animate-fade-in"
            onClick={onClose}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-ink-700 bg-ink-950 p-5 shadow-soft-lg animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-200">Menu</span>
              <button
                onClick={onClose}
                className="text-ink-300 transition-colors hover:text-ink-50"
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
