import type { DirEntry } from "./types";

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function nameMatches(name: string, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function sortEntries(entries: DirEntry[]): DirEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = n >= 10 || i === 0 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
}

export function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function kindLabel(entry: DirEntry): string {
  if (entry.isDir) return "Folder";
  switch (entry.ext) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
    case "csv":
      return "Spreadsheet";
    case "ppt":
    case "pptx":
      return "Slideshow";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "bmp":
      return "Picture";
    case "txt":
    case "md":
      return "Text";
    default:
      return entry.ext ? entry.ext.toUpperCase() : "File";
  }
}

export function isPdf(entry: DirEntry | null): boolean {
  return !!entry && !entry.isDir && entry.ext === "pdf";
}

export function isImage(entry: DirEntry | null): boolean {
  return !!entry && !entry.isDir && ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(entry.ext);
}

export function isText(entry: DirEntry | null): boolean {
  return !!entry && !entry.isDir && ["txt", "md", "csv", "json", "log"].includes(entry.ext);
}

export function breadcrumbParts(path: string): { label: string; path: string }[] {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized) return [];
  const chunks = normalized.split("/").filter(Boolean);
  const parts: { label: string; path: string }[] = [];
  let acc = normalized.startsWith("/") ? "" : "";
  const winRoot = /^[A-Za-z]:$/.test(chunks[0] ?? "");
  chunks.forEach((chunk, i) => {
    if (i === 0 && winRoot) {
      acc = `${chunk}/`;
      parts.push({ label: chunk, path: acc });
      return;
    }
    acc = acc ? `${acc.replace(/\/$/, "")}/${chunk}` : chunk.startsWith("/") ? chunk : `/${chunk}`;
    if (!normalized.startsWith("/") && !winRoot && i === 0) acc = chunk;
    parts.push({ label: chunk, path: acc });
  });
  return parts;
}

export function folderLabel(path: string): string {
  const parts = breadcrumbParts(path);
  return parts.at(-1)?.label || path;
}
