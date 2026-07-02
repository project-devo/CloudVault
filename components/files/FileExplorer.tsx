"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  MoreVertical,
  Star,
  Trash2,
} from "lucide-react";
import { cn, formatBytes, formatDate, getFileIcon } from "@/lib/utils";
import type { FileItem, Folder as FolderType, ViewMode } from "@/types";
import CreateFolderModal from "./CreateFolderModal";

interface Props {
  files: FileItem[];
  folders: FolderType[];
  currentFolderId: string | null;
  category: string;
  searchQuery: string;
  breadcrumbs: { id: string; name: string }[];
}

function fileDownloadHref(fileId: string) {
  return `/api/files/${fileId}`;
}

export default function FileExplorer({
  files,
  folders,
  currentFolderId,
  category,
  searchQuery,
  breadcrumbs,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isEmpty = files.length === 0 && folders.length === 0;
  const categoryLabel: Record<string, string> = {
    all: "All Files",
    images: "Images",
    documents: "Documents",
    videos: "Videos",
    audio: "Audio",
    archives: "Archives",
    starred: "Starred",
    trash: "Trash",
  };

  async function refreshAfter(
    action: Promise<Response>,
    nextMenuState: string | null = null
  ) {
    const response = await action;
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      window.alert(body?.error ?? "The action failed.");
    }

    setActiveMenu(nextMenuState);
    router.refresh();
  }

  async function handleDelete(fileId: string) {
    await refreshAfter(fetch(`/api/files/${fileId}`, { method: "DELETE" }));
  }

  async function handleStar(fileId: string, isStarred: boolean) {
    await refreshAfter(
      fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_starred: !isStarred }),
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  async function handleTrash(fileId: string, isTrashed: boolean) {
    await refreshAfter(
      fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_trashed: !isTrashed }),
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  function renderFileActions(file: FileItem) {
    return (
      <div className="absolute right-0 top-9 z-20 w-44 origin-top-right rounded-xl border border-white/[0.08] bg-ink-900/90 p-1 shadow-soft-lg backdrop-blur-2xl animate-scale-in">
        <a
          href={fileDownloadHref(file.id)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 transition-colors hover:bg-white/[0.06]"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
        <button
          onClick={() => void handleStar(file.id, file.is_starred)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-100 transition-colors hover:bg-white/[0.06]"
        >
          <Star className="h-3.5 w-3.5" />
          {file.is_starred ? "Unstar" : "Star"}
        </button>
        <button
          onClick={() => void handleTrash(file.id, file.is_trashed)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-coral-300 transition-colors hover:bg-coral-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {file.is_trashed ? "Restore" : "Move to trash"}
        </button>
        {category === "trash" && (
          <button
            onClick={() => void handleDelete(file.id)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-coral-300 transition-colors hover:bg-coral-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete forever
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col"
      onClick={() => activeMenu && setActiveMenu(null)}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-sm text-ink-300">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-ink-500" />
                <Link
                  href={`/dashboard?folder=${crumb.id}`}
                  className="transition-colors hover:text-white"
                >
                  {crumb.name}
                </Link>
              </span>
            ))}
            {!breadcrumbs.length && (
              <span className="font-medium text-white">
                {categoryLabel[category] ?? "Files"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">
            {folders.length} folder{folders.length !== 1 ? "s" : ""}, {files.length} file
            {files.length !== 1 ? "s" : ""}
            {searchQuery ? ` — results for "${searchQuery}"` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {category === "all" && (
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="btn-glass"
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
          )}
          <div className="segmented">
            <button
              type="button"
              data-active={view === "grid"}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              data-active={view === "list"}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="card flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 text-3xl ring-1 ring-inset ring-white/10">
            📂
          </div>
          <h3 className="mb-1 text-lg font-semibold text-white">
            Nothing here yet
          </h3>
          <p className="text-sm text-ink-300">
            {category === "trash"
              ? "Trash is empty."
              : "Upload files or create a folder to get started."}
          </p>
        </div>
      )}

      {!isEmpty && view === "grid" && (
        <div className="safe-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/dashboard?folder=${folder.id}`}
              className="card-interactive group p-4"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10 transition-transform duration-300 ease-apple group-hover:scale-105">
                <Folder className="h-5 w-5 text-accent-200" />
              </div>
              <p className="truncate text-sm font-medium text-white">
                {folder.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {formatDate(folder.created_at)}
              </p>
            </Link>
          ))}

          {files.map((file) => (
            <div key={file.id} className="card-interactive group relative p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] transition-transform duration-300 ease-apple group-hover:scale-105">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                </div>
                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === file.id ? null : file.id)
                    }
                    className="rounded-lg p-1.5 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white md:opacity-0 md:group-hover:opacity-100"
                    aria-label={`Open actions for ${file.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {activeMenu === file.id && renderFileActions(file)}
                </div>
              </div>

              <p className="mt-3 truncate text-sm font-medium text-white">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {formatBytes(file.size)}
              </p>
              {file.is_starred && (
                <Star className="absolute bottom-4 right-4 h-3.5 w-3.5 fill-coral-400 text-coral-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {!isEmpty && view === "list" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 md:table-cell">
                  Size
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 lg:table-cell">
                  Modified
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {folders.map((folder) => (
                <tr
                  key={folder.id}
                  className="transition-colors duration-200 ease-apple hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard?folder=${folder.id}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
                        <Folder className="h-4 w-4 text-accent-200" />
                      </div>
                      <span className="truncate font-medium text-white transition-colors group-hover:text-accent-200">
                        {folder.name}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-400 md:table-cell">—</td>
                  <td className="hidden px-4 py-3 text-ink-400 lg:table-cell">
                    {formatDate(folder.created_at)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}

              {files.map((file) => (
                <tr
                  key={file.id}
                  className="group transition-colors duration-200 ease-apple hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
                        <span className="text-base">
                          {getFileIcon(file.type)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-white">
                          {file.name}
                        </span>
                        <span className="text-xs text-ink-400 md:hidden">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      {file.is_starred && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-coral-400 text-coral-400" />
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-300 md:table-cell">
                    {formatBytes(file.size)}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-300 lg:table-cell">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="relative flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setActiveMenu(activeMenu === file.id ? null : file.id)
                        }
                        className="rounded-lg p-1.5 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Open actions for ${file.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeMenu === file.id && renderFileActions(file)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        currentFolderId={currentFolderId}
      />
    </div>
  );
}
