"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  EyeOff,
  File,
  Folder,
  Home,
  Link2Off,
  Loader2,
  Lock,
  Share2,
} from "lucide-react";
import { cn, formatBytes, formatDate, getFileIcon } from "@/lib/utils";
import { getPreviewKind } from "@/lib/preview";
import ImagePreview from "@/components/files/preview/ImagePreview";
import AudioPreview from "@/components/files/preview/AudioPreview";
import VideoPreview from "@/components/files/preview/VideoPreview";
import PdfPreview from "@/components/files/preview/PdfPreview";
import CodePreview from "@/components/files/preview/CodePreview";
import MarkdownPreview from "@/components/files/preview/MarkdownPreview";

interface ShareMeta {
  id: string;
  file_id: string | null;
  folder_id: string | null;
  expires_at: string | null;
  has_password: boolean;
  file?: { id: string; name: string; type: string; size: number } | null;
  folder?: { id: string; name: string } | null;
}

interface FolderItem {
  id: string;
  name: string;
  created_at: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
}

interface FolderContents {
  share_id: string;
  root_folder_id: string;
  current_folder_id: string;
  files: FileItem[];
  folders: FolderItem[];
}

type PageState = "loading" | "password" | "ready" | "expired" | "notfound" | "error";

function PreviewRenderer({
  file,
  shareId,
  sharePassword,
}: {
  file: { id: string; name: string; type: string; size: number };
  shareId: string;
  sharePassword: string;
}) {
  const kind = getPreviewKind({ name: file.name, type: file.type });

  if (kind === "image") return <ImagePreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  if (kind === "audio") return <AudioPreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  if (kind === "video") return <VideoPreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  if (kind === "pdf") return <PdfPreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  if (kind === "code") return <CodePreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  if (kind === "markdown") return <MarkdownPreview fileId={file.id} shareId={shareId} sharePassword={sharePassword || undefined} />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">{getFileIcon(file.type)}</div>
      <p className="text-lg font-semibold text-white">{file.name}</p>
      <p className="text-sm text-ink-400">{formatBytes(file.size)}</p>
      <a
        href={`/api/shares/${shareId}/file?download=true`}
        className="btn-primary mt-2"
      >
        <Download className="h-4 w-4" />
        Download file
      </a>
    </div>
  );
}

export default function SharePage({ params }: { params: { id: string } }) {
  const shareId = params.id;

  const [state, setState] = useState<PageState>("loading");
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Folder navigation
  const [folderContents, setFolderContents] = useState<FolderContents | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);
  const [verifiedPassword, setVerifiedPassword] = useState("");

  // File preview (for shared folder file opens)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Fetch share metadata (no auth required)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/shares/${shareId}`);
        if (res.status === 404) { setState("notfound"); return; }
        if (res.status === 410) { setState("expired"); return; }
        if (!res.ok) { setState("error"); return; }
        const { data } = await res.json();
        setMeta(data);
        if (data.has_password) {
          setState("password");
        } else {
          setState("ready");
          if (data.folder_id) void loadFolderContents(data.folder_id, "");
        }
      } catch {
        setState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  const loadFolderContents = useCallback(
    async (folderId: string, pw: string) => {
      setFolderLoading(true);
      try {
        const headers: HeadersInit = {};
        if (pw) headers["x-share-password"] = pw;
        const res = await fetch(
          `/api/shares/${shareId}/content?folderId=${folderId}`,
          { headers }
        );
        if (!res.ok) return;
        const { data } = await res.json();
        setFolderContents(data);
      } finally {
        setFolderLoading(false);
      }
    },
    [shareId]
  );

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setPasswordLoading(true);
    setPasswordError("");
    try {
      // Verify by trying to access the share content/file
      const headers: HeadersInit = { "x-share-password": passwordInput };
      const checkUrl = meta?.folder_id
        ? `/api/shares/${shareId}/content`
        : `/api/shares/${shareId}/file`;
      const res = await fetch(checkUrl, { headers, method: "GET" });

      if (res.status === 403) {
        setPasswordError("Incorrect password. Please try again.");
        return;
      }

      // Password accepted
      setVerifiedPassword(passwordInput);
      setState("ready");

      if (meta?.folder_id) {
        const { data } = await res.json();
        setFolderContents(data);
      }
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  }

  function navigateToFolder(folder: FolderItem) {
    setBreadcrumbs((prev) => [...prev, folder]);
    void loadFolderContents(folder.id, verifiedPassword);
  }

  function navigateToBreadcrumb(index: number) {
    const targetBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(targetBreadcrumbs);
    const targetId =
      index < 0
        ? meta!.folder_id!
        : targetBreadcrumbs[index].id;
    void loadFolderContents(targetId, verifiedPassword);
  }

  function navigateToRoot() {
    setBreadcrumbs([]);
    void loadFolderContents(meta!.folder_id!, verifiedPassword);
  }

  return (
    <div className="relative min-h-screen bg-ink-950 flex flex-col">
      {/* Ambient Aurora Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-[-10%] h-[480px] w-[480px] rounded-full bg-accent-500/15 blur-3xl animate-pulse-soft" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-coral-500/12 blur-3xl animate-pulse-soft [animation-delay:1.4s]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 border-b border-white/[0.05] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg aurora-bg shadow-glow-accent">
              <Cloud className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-white">CloudVault</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-ink-300">
              <Share2 className="h-3 w-3" />
              Shared Link
            </div>
            {meta?.expires_at && (
              <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-ink-300 sm:flex">
                <Calendar className="h-3 w-3" />
                Expires {formatDate(meta.expires_at)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">

        {/* Loading state */}
        {state === "loading" && (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent-400" />
              <p className="text-sm text-ink-400">Loading shared content…</p>
            </div>
          </div>
        )}

        {/* Not found */}
        {state === "notfound" && (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
              <Link2Off className="h-9 w-9 text-ink-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Link not found</h1>
            <p className="max-w-xs text-sm text-ink-300">
              This link may have been revoked by the owner, or it never existed.
            </p>
          </div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500/20 to-coral-500/10 ring-1 ring-inset ring-white/10">
              <AlertTriangle className="h-9 w-9 text-coral-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Link expired</h1>
            <p className="max-w-xs text-sm text-ink-300">
              This shared link has expired. Ask the owner to generate a new link.
            </p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500/20 to-coral-500/10 ring-1 ring-inset ring-white/10">
              <AlertTriangle className="h-9 w-9 text-coral-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
            <p className="text-sm text-ink-300">Please try again later.</p>
          </div>
        )}

        {/* Password Gate */}
        {state === "password" && (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-6">
            <div className="card w-full max-w-sm rounded-2xl p-6">
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/30 to-coral-500/20 ring-1 ring-inset ring-white/10">
                  <Lock className="h-6 w-6 text-accent-300" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Password Required</h1>
                  <p className="mt-1 text-sm text-ink-300">
                    This shared link is password protected.
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-3">
                <div className="relative">
                  <input
                    id="share-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    autoFocus
                    className={cn(
                      "h-10 w-full rounded-xl border bg-white/[0.04] pl-3 pr-9 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none transition-all",
                      passwordError
                        ? "border-coral-500/50 focus:border-coral-400/70"
                        : "border-white/[0.08] focus:border-accent-400/60 focus:bg-white/[0.06]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs text-coral-400">{passwordError}</p>
                )}

                <button
                  type="submit"
                  disabled={!passwordInput.trim() || passwordLoading}
                  className="btn-primary w-full justify-center disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Unlock
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Ready: File share */}
        {state === "ready" && meta?.file_id && meta.file && (
          <div className="flex h-full flex-col gap-6 animate-fade-in">
            {/* File header */}
            <div className="card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.08] text-3xl shrink-0">
                  {getFileIcon(meta.file.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-semibold text-white">{meta.file.name}</h1>
                  <p className="mt-0.5 text-sm text-ink-400">{formatBytes(meta.file.size)}</p>
                </div>
                <a
                  href={`/api/shares/${shareId}/file?download=true${verifiedPassword ? "" : ""}`}
                  download
                  className="btn-primary shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>

            {/* Preview */}
            <div className="card min-h-[60vh] overflow-hidden rounded-2xl">
              <PreviewRenderer
                file={meta.file}
                shareId={shareId}
                sharePassword={verifiedPassword}
              />
            </div>
          </div>
        )}

        {/* Ready: Folder share */}
        {state === "ready" && meta?.folder_id && meta.folder && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Folder header */}
            <div className="card rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10 shrink-0">
                  <Folder className="h-7 w-7 text-accent-200" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">{meta.folder.name}</h1>
                  <p className="mt-0.5 text-sm text-ink-400">Shared folder</p>
                </div>
              </div>
            </div>

            {/* Breadcrumbs */}
            {(breadcrumbs.length > 0 || true) && (
              <div className="flex flex-wrap items-center gap-1 text-sm text-ink-300">
                <button
                  onClick={navigateToRoot}
                  className="flex items-center gap-1 transition-colors hover:text-white"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>{meta.folder.name}</span>
                </button>
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-ink-500" />
                    <button
                      onClick={() => navigateToBreadcrumb(i)}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Folder contents */}
            {folderLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
              </div>
            ) : (
              <div className="card overflow-hidden rounded-2xl">
                {(!folderContents || (folderContents.files.length === 0 && folderContents.folders.length === 0)) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Folder className="mb-3 h-10 w-10 text-ink-500" />
                    <p className="text-sm text-ink-400">This folder is empty</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Name</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 md:table-cell">Size</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 lg:table-cell">Modified</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {/* Folders */}
                      {folderContents?.folders.map((folder) => (
                        <tr
                          key={folder.id}
                          className="group cursor-pointer transition-colors hover:bg-white/[0.03]"
                          onClick={() => navigateToFolder(folder)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/20 to-coral-500/20 ring-1 ring-inset ring-white/10">
                                <Folder className="h-4 w-4 text-accent-200" />
                              </div>
                              <span className="font-medium text-white group-hover:text-accent-200 transition-colors">
                                {folder.name}
                              </span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-ink-400 md:table-cell">—</td>
                          <td className="hidden px-4 py-3 text-ink-300 lg:table-cell">{formatDate(folder.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight className="ml-auto h-4 w-4 text-ink-500 group-hover:text-ink-300" />
                          </td>
                        </tr>
                      ))}

                      {/* Files */}
                      {folderContents?.files.map((file) => {
                        const canPreview = getPreviewKind({ name: file.name, type: file.type }) !== "none";

                        return (
                          <tr
                            key={file.id}
                            className={cn(
                              "group transition-colors hover:bg-white/[0.03]",
                              canPreview && "cursor-pointer"
                            )}
                            onClick={() => canPreview && setPreviewFile(file)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
                                  <span className="text-base">{getFileIcon(file.type)}</span>
                                </div>
                                <div>
                                  <span className="block font-medium text-white">{file.name}</span>
                                  <span className="text-xs text-ink-500 md:hidden">{formatBytes(file.size)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 text-ink-300 md:table-cell">{formatBytes(file.size)}</td>
                            <td className="hidden px-4 py-3 text-ink-300 lg:table-cell">{formatDate(file.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canPreview && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                    className="rounded-lg p-1.5 text-ink-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white"
                                    title="Preview"
                                    aria-label={`Preview ${file.name}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}
                                <a
                                  href={`/api/shares/${shareId}/file?fileId=${file.id}&download=true`}
                                  download
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-lg p-1.5 text-ink-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white"
                                  title="Download"
                                  aria-label={`Download ${file.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inline file preview panel for folder shares */}
        {previewFile && state === "ready" && meta?.folder_id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md animate-fade-in">
            <div className="card relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-soft-lg">
              <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-900/60 px-4 py-3">
                <span className="flex-1 truncate text-sm font-semibold text-white">{previewFile.name}</span>
                <span className="text-xs text-ink-400">{formatBytes(previewFile.size)}</span>
                <a
                  href={`/api/shares/${shareId}/file?fileId=${previewFile.id}&download=true`}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                  title="Download"
                  aria-label="Download file"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                  aria-label="Close preview"
                >
                  <File className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PreviewRenderer
                  file={previewFile}
                  shareId={shareId}
                  sharePassword={verifiedPassword}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 text-center">
        <p className="text-xs text-ink-500">
          Shared via{" "}
          <a href="/" className="text-accent-400 hover:text-accent-300 transition-colors">
            CloudVault
          </a>
        </p>
      </footer>
    </div>
  );
}
