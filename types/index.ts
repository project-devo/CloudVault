export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  is_trashed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  is_trashed: boolean;
  color?: string;
}

export interface StorageStats {
  used_bytes: number;
  total_bytes: number;
  file_count: number;
}

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ViewMode = "grid" | "list";
export type SortField = "name" | "size" | "created_at" | "updated_at";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export type FileCategory =
  | "all"
  | "images"
  | "documents"
  | "videos"
  | "audio"
  | "archives"
  | "starred"
  | "trash";

export const MIME_CATEGORIES: Record<FileCategory, string[]> = {
  all: [],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
  ],
  videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac"],
  archives: [
    "application/zip",
    "application/x-tar",
    "application/x-7z-compressed",
    "application/x-rar-compressed",
  ],
  starred: [],
  trash: [],
};
