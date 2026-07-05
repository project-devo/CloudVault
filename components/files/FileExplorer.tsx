"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  Eye,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { cn, formatBytes, formatDate, getFileIcon } from "@/lib/utils";
import { getPreviewKind } from "@/lib/preview";
import { useToast } from "@/lib/useToast";
import type { FileItem, Folder as FolderType, ViewMode } from "@/types";
import CreateFolderModal from "./CreateFolderModal";
import PreviewModal from "./PreviewModal";
import RenameModal, { type RenameTarget } from "./RenameModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  files: FileItem[];
  folders: FolderType[];
  currentFolderId: string | null;
  category: string;
  searchQuery: string;
  breadcrumbs: { id: string; name: string }[];
}

type ResourceKind = "file" | "folder";

function fileDownloadHref(fileId: string) {
  return `/api/files/${fileId}?download=true`;
}

const VIEW_STORAGE_KEY = "cloudvault:view";

export default function FileExplorer({
  files,
  folders,
  currentFolderId,
  category,
  searchQuery,
  breadcrumbs,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = useState<ViewMode>("grid");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuUp, setMenuUp] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<
    { kind: ResourceKind; id: string; name: string } | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const isEmpty = files.length === 0 && folders.length === 0;

  // Restore the last-used view; persist changes across navigation.
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function changeView(next: ViewMode) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  // Close any open menu on Escape.
  useEffect(() => {
    if (!activeMenu) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMenu]);

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

  function toggleMenu(id: string, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    if (activeMenu === id) {
      setActiveMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    // Flip the menu upward when the trigger sits near the viewport bottom.
    setMenuUp(rect.bottom > window.innerHeight - 240);
    setActiveMenu(id);
  }

  function patchResource(
    kind: ResourceKind,
    id: string,
    patch: Record<string, unknown>
  ) {
    return kind === "file"
      ? fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
      : fetch(`/api/folders`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        });
  }

  function deleteResource(kind: ResourceKind, id: string) {
    return kind === "file"
      ? fetch(`/api/files/${id}`, { method: "DELETE" })
      : fetch(`/api/folders?id=${id}`, { method: "DELETE" });
  }

  async function mutate(
    id: string,
    request: () => Promise<Response>,
    successMessage: string
  ): Promise<boolean> {
    setPendingId(id);
    try {
      const response = await request();
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "The action failed.");
        return false;
      }
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch {
      toast.error("Network error — please try again.");
      return false;
    } finally {
      setPendingId(null);
    }
  }

  function handleStar(kind: ResourceKind, id: string, isStarred: boolean) {
    setActiveMenu(null);
    return mutate(
      id,
      () => patchResource(kind, id, { is_starred: !isStarred }),
      isStarred ? "Removed from starred" : "Added to starred"
    );
  }

  function handleTrash(kind: ResourceKind, id: string, isTrashed: boolean) {
    setActiveMenu(null);
    return mutate(
      id,
      () => patchResource(kind, id, { is_trashed: !isTrashed }),
      isTrashed ? "Restored" : "Moved to trash"
    );
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const ok = await mutate(
      confirmTarget.id,
      () => deleteResource(confirmTarget.kind, confirmTarget.id),
      "Deleted permanently"
    );
    setConfirmLoading(false);
    if (ok) setConfirmTarget(null);
  }

  function openRename(kind: ResourceKind, id: string, name: string) {
    setActiveMenu(null);
    setRenameTarget({ id, name, kind });
  }

  function requestDelete(kind: ResourceKind, id: string, name: string) {
    setActiveMenu(null);
    setConfirmTarget({ kind, id, name });
  }

  function renderMenu(kind: ResourceKind, item: FileItem | FolderType) {
    const isFile = kind === "file";
    const file = isFile ? (item as FileItem) : null;
    const disabled = pendingId === item.id;
    const menuItem =
      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-100 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

    return (
      <div
        role="menu"
        aria-label={`Actions for ${item.name}`}
        className={cn(
          "absolute right-0 z-30 w-44 rounded-xl border border-white/[0.08] bg-ink-900/90 p-1 shadow-soft-lg backdrop-blur-2xl animate-scale-in",
          menuUp ? "bottom-9 origin-bottom-right" : "top-9 origin-top-right"
        )}
      >
        {isFile && file && getPreviewKind(file) !== "none" && (
          <button
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              setPreviewFile(file);
              setActiveMenu(null);
            }}
            className={menuItem}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        )}
        {isFile && (
          <a
            role="menuitem"
            href={fileDownloadHref(item.id)}
            onClick={() => setActiveMenu(null)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-100 transition-colors hover:bg-white/[0.06]"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
        <button
          role="menuitem"
          disabled={disabled}
          onClick={() => openRename(kind, item.id, item.name)}
          className={menuItem}
        >
          <Pencil className="h-3.5 w-3.5" />
          Rename
        </button>
        <button
          role="menuitem"
          disabled={disabled}
          onClick={() => void handleStar(kind, item.id, item.is_starred)}
          className={menuItem}
        >
          <Star className="h-3.5 w-3.5" />
          {item.is_starred ? "Unstar" : "Star"}
        </button>
        <button
          role="menuitem"
          disabled={disabled}
          onClick={() => void handleTrash(kind, item.id, item.is_trashed)}
          className={cn(
            menuItem,
            "text-coral-300 hover:bg-coral-500/10 hover:text-coral-200"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {item.is_trashed ? "Restore" : "Move to trash"}
        </button>
        {category === "trash" && (
          <button
            role="menuitem"
            disabled={disabled}
            onClick={() => requestDelete(kind, item.id, item.name)}
            className={cn(
              menuItem,
              "text-coral-300 hover:bg-coral-500/10 hover:text-coral-200"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete forever
          </button>
        )}
      </div>
    );
  }

  function renderTrigger(
    kind: ResourceKind,
    item: FileItem | FolderType,
    extraClass?: string
  ) {
    const isPending = pendingId === item.id;
    return (
      <button
        onClick={(event) => toggleMenu(item.id, event)}
        aria-haspopup="menu"
        aria-expanded={activeMenu === item.id}
        aria-label={`Open actions for ${item.name}`}
        disabled={isPending}
        className={cn(
          "rounded-lg p-1.5 text-ink-300 transition-all duration-200 ease-apple hover:bg-white/[0.06] hover:text-white",
          extraClass
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent-300" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>
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
              onClick={() => changeView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              data-active={view === "list"}
              onClick={() => changeView("list")}
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
            <div key={folder.id} className="group relative">
              <Link
                href={`/dashboard?folder=${folder.id}`}
                className="card-interactive block p-4"
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10 transition-transform duration-300 ease-apple group-hover:scale-105">
                  <Folder className="h-5 w-5 text-accent-200" />
                </div>
                <p className="truncate pr-6 text-sm font-medium text-white">
                  {folder.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {formatDate(folder.created_at)}
                </p>
                {folder.is_starred && (
                  <Star className="absolute bottom-4 right-4 h-3.5 w-3.5 fill-coral-400 text-coral-400" />
                )}
              </Link>
              <div
                className="absolute right-2 top-2"
                onClick={(event) => event.stopPropagation()}
              >
                {renderTrigger("folder", folder)}
                {activeMenu === folder.id && renderMenu("folder", folder)}
              </div>
            </div>
          ))}

          {files.map((file) => {
            const canPreview = getPreviewKind(file) !== "none";
            const cardClass = cn(
              "card-interactive group relative p-4",
              canPreview && "cursor-pointer"
            );
            const cardBody = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] transition-transform duration-300 ease-apple group-hover:scale-105">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                  </div>
                  <div
                    className="relative"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {renderTrigger(
                      "file",
                      file,
                      "md:opacity-0 md:group-hover:opacity-100"
                    )}
                    {activeMenu === file.id && renderMenu("file", file)}
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
              </>
            );
            return canPreview ? (
              <button
                key={file.id}
                type="button"
                onClick={() => setPreviewFile(file)}
                className={cn(cardClass, "w-full text-left")}
                aria-label={`Preview ${file.name}`}
              >
                {cardBody}
              </button>
            ) : (
              <div key={file.id} className={cardClass}>
                {cardBody}
              </div>
            );
          })}
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
                  className="group transition-colors duration-200 ease-apple hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard?folder=${folder.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
                        <Folder className="h-4 w-4 text-accent-200" />
                      </div>
                      <span className="truncate font-medium text-white transition-colors group-hover:text-accent-200">
                        {folder.name}
                      </span>
                      {folder.is_starred && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-coral-400 text-coral-400" />
                      )}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-400 md:table-cell">—</td>
                  <td className="hidden px-4 py-3 text-ink-400 lg:table-cell">
                    {formatDate(folder.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="relative flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderTrigger(
                        "folder",
                        folder,
                        "md:opacity-0 md:group-hover:opacity-100"
                      )}
                      {activeMenu === folder.id && renderMenu("folder", folder)}
                    </div>
                  </td>
                </tr>
              ))}

              {files.map((file) => {
                const canPreview = getPreviewKind(file) !== "none";
                return (
                  <tr
                    key={file.id}
                    onClick={() => {
                      if (canPreview) setPreviewFile(file);
                    }}
                    className={cn(
                      "group transition-colors duration-200 ease-apple hover:bg-white/[0.03]",
                      canPreview && "cursor-pointer"
                    )}
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
                        {renderTrigger(
                          "file",
                          file,
                          "md:opacity-0 md:group-hover:opacity-100"
                        )}
                        {activeMenu === file.id && renderMenu("file", file)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        currentFolderId={currentFolderId}
      />
      <RenameModal
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete forever?"
        message={
          confirmTarget
            ? `"${confirmTarget.name}" will be permanently deleted. This can't be undone.`
            : ""
        }
        confirmLabel="Delete forever"
        loading={confirmLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => !confirmLoading && setConfirmTarget(null)}
      />
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
