export type PreviewKind = "markdown" | "pdf" | "image" | "audio" | "video" | "code" | "none";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdown", ".mdx"]);
const MARKDOWN_MIME_TYPES = new Set(["text/markdown", "text/x-markdown"]);

const PDF_EXTENSIONS = new Set([".pdf"]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogv", ".mov", ".m4v"]);

const CODE_EXTENSIONS = new Set([
  ".txt", ".json", ".js", ".jsx", ".ts", ".tsx",
  ".html", ".css", ".py", ".go", ".rs", ".sh",
  ".yml", ".yaml", ".xml", ".ini", ".conf", ".log",
  ".csv", ".sql", ".env", ".toml"
]);

const CODE_MIME_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/x-javascript",
  "application/xml",
  "text/xml",
  "text/css",
  "text/html",
  "text/csv",
  "text/x-python",
  "text/x-go",
  "text/x-rust",
  "text/x-shellscript",
  "text/plain"
]);

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function getPreviewKind(file: { name: string; type: string }): PreviewKind {
  const ext = getExtension(file.name);
  const mime = file.type.toLowerCase();

  if (MARKDOWN_MIME_TYPES.has(mime) || MARKDOWN_EXTENSIONS.has(ext)) {
    return "markdown";
  }
  if (PDF_MIME_TYPES.has(mime) || PDF_EXTENSIONS.has(ext)) {
    return "pdf";
  }
  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) {
    return "image";
  }
  if (mime.startsWith("audio/") || AUDIO_EXTENSIONS.has(ext)) {
    return "audio";
  }
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) {
    return "video";
  }
  if (mime.startsWith("text/") || CODE_MIME_TYPES.has(mime) || CODE_EXTENSIONS.has(ext)) {
    return "code";
  }

  return "none";
}
