import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MIME_CATEGORIES, type FileCategory } from "@/types";

export const DEFAULT_STORAGE_QUOTA_BYTES = 1_073_741_824;
export const DEFAULT_MAX_UPLOAD_SIZE = 52_428_800;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function storagePercent(used: number, total: number): number {
  return Math.min(Math.round((used / total) * 100), 100);
}

export function getFileCategory(mimeType: string): FileCategory {
  for (const [category, mimes] of Object.entries(MIME_CATEGORIES)) {
    if (category === "all" || category === "starred" || category === "trash") {
      continue;
    }

    if (mimes.includes(mimeType)) {
      return category as FileCategory;
    }
  }

  return "all";
}

export function getFileIcon(mimeType: string): string {
  const category = getFileCategory(mimeType);
  const iconMap: Record<string, string> = {
    images: "🖼️",
    documents: "📄",
    videos: "🎬",
    audio: "🎵",
    archives: "📦",
    all: "📎",
  };

  return iconMap[category] ?? "📎";
}

export function buildStoragePath(
  userId: string,
  folderId: string | null,
  fileName: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();

  return folderId
    ? `${userId}/${folderId}/${timestamp}_${sanitized}`
    : `${userId}/${timestamp}_${sanitized}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
