export type PreviewKind = "markdown" | "pdf" | "none";

const MARKDOWN_MIME_TYPES = new Set([
  "text/markdown",
  "text/x-markdown",
  "text/plain",
]);

const MARKDOWN_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".mdown",
  ".mdx",
]);

const PDF_MIME_TYPES = new Set(["application/pdf"]);

const PDF_EXTENSIONS = new Set([".pdf"]);

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function getPreviewKind(file: {
  name: string;
  type: string;
}): PreviewKind {
  const ext = getExtension(file.name);
  const mime = file.type.toLowerCase();

  if (MARKDOWN_MIME_TYPES.has(mime) || MARKDOWN_EXTENSIONS.has(ext)) {
    return "markdown";
  }

  if (PDF_MIME_TYPES.has(mime) || PDF_EXTENSIONS.has(ext)) {
    return "pdf";
  }

  return "none";
}
