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
      <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
        <a
          href={fileDownloadHref(file.id)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
        <button
          onClick={() => void handleStar(file.id, file.is_starred)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700"
        >
          <Star className="h-3.5 w-3.5" />
          {file.is_starred ? "Unstar" : "Star"}
        </button>
        <button
          onClick={() => void handleTrash(file.id, file.is_trashed)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {file.is_trashed ? "Restore" : "Move to trash"}
        </button>
        {category === "trash" && (
          <button
            onClick={() => void handleDelete(file.id)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1 text-sm text-gray-400">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                <Link
                  href={`/dashboard?folder=${crumb.id}`}
                  className="transition-colors hover:text-white"
                >
                  {crumb.name}
                </Link>
              </span>
            ))}
            {!breadcrumbs.length && (
              <span className="font-medium text-gray-300">
                {categoryLabel[category] ?? "Files"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {folders.length} folder{folders.length !== 1 ? "s" : ""}, {files.length} file
            {files.length !== 1 ? "s" : ""}
            {searchQuery ? ` — results for "${searchQuery}"` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {category === "all" && (
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
          )}
          <div className="flex items-center rounded-lg bg-gray-800 p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "grid"
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "list"
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">📂</div>
          <h3 className="mb-1 text-lg font-semibold text-white">Nothing here yet</h3>
          <p className="text-sm text-gray-500">
            {category === "trash"
              ? "Trash is empty."
              : "Upload files or create a folder to get started."}
          </p>
        </div>
      )}

      {!isEmpty && view === "grid" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/dashboard?folder=${folder.id}`}
              className="card group p-4 transition-all hover:border-gray-700"
            >
              <Folder className="mb-3 h-10 w-10 text-brand-500 transition-transform group-hover:scale-105" />
              <p className="truncate text-sm font-medium text-white">{folder.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatDate(folder.created_at)}
              </p>
            </Link>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="card group relative p-4 transition-all hover:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl">{getFileIcon(file.type)}</span>
                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === file.id ? null : file.id)
                    }
                    className="p-1 text-gray-400 transition-all hover:text-gray-200 md:opacity-0 md:group-hover:opacity-100"
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
              <p className="mt-0.5 text-xs text-gray-500">
                {formatBytes(file.size)}
              </p>
              {file.is_starred && (
                <Star className="absolute bottom-4 right-4 h-3 w-3 text-yellow-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {!isEmpty && view === "list" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Size
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Modified
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {folders.map((folder) => (
                <tr
                  key={folder.id}
                  className="transition-colors hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard?folder=${folder.id}`}
                      className="group flex items-center gap-3"
                    >
                      <Folder className="h-5 w-5 shrink-0 text-brand-500" />
                      <span className="truncate font-medium text-white transition-colors group-hover:text-brand-400">
                        {folder.name}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">—</td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                    {formatDate(folder.created_at)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}

              {files.map((file) => (
                <tr
                  key={file.id}
                  className="group transition-colors hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-xl">{getFileIcon(file.type)}</span>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-white">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 md:hidden">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      {file.is_starred && (
                        <Star className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-400 md:table-cell">
                    {formatBytes(file.size)}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-400 lg:table-cell">
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
                        className="p-1 text-gray-400 transition-all hover:text-gray-200 md:opacity-0 md:group-hover:opacity-100"
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
