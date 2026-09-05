import type { DirEntry, SpecialFolders } from "./types";
import { DEMO_ROOT, isDemoPath, listDemo, readDemoBytes, searchDemo } from "./demo";
import { extOf, folderLabel, sortEntries } from "./files";

const browserDirs = new Map<string, FileSystemDirectoryHandle>();
const browserFiles = new Map<string, FileSystemFileHandle>();

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function canPickBrowserFolder(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

export async function pickFolder(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === "string" ? selected : null;
  }
  if (!canPickBrowserFolder() || !window.showDirectoryPicker) {
    throw new Error("This browser cannot open a real folder. Use Try a sample folder, or run the Windows app.");
  }
  const handle = await window.showDirectoryPicker();
  const path = `browser://${handle.name}`;
  browserDirs.set(path, handle);
  return path;
}

export async function listFolder(path: string): Promise<DirEntry[]> {
  if (isDemoPath(path)) return sortEntries(listDemo(path));
  if (isTauri()) return invoke<DirEntry[]>("list_folder", { path });
  const dir = browserDirs.get(path);
  if (!dir) throw new Error("That folder could not be opened.");
  const out: DirEntry[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith(".")) continue;
    const childPath = `${path}/${name}`;
    if (handle.kind === "directory") {
      browserDirs.set(childPath, handle);
      out.push({ name, path: childPath, isDir: true, size: 0, modifiedMs: null, ext: "" });
    } else {
      browserFiles.set(childPath, handle);
      const file = await handle.getFile();
      out.push({
        name,
        path: childPath,
        isDir: false,
        size: file.size,
        modifiedMs: file.lastModified,
        ext: extOf(name),
      });
    }
  }
  return sortEntries(out);
}

export async function searchFolder(path: string, query: string): Promise<DirEntry[]> {
  if (isDemoPath(path)) return sortEntries(searchDemo(path, query));
  if (isTauri()) return invoke<DirEntry[]>("search_folder", { path, query });
  const hits: DirEntry[] = [];
  const walk = async (dirPath: string, dir: FileSystemDirectoryHandle, depth: number) => {
    if (depth > 8 || hits.length >= 400) return;
    for await (const [name, handle] of dir.entries()) {
      if (hits.length >= 400) return;
      if (name.startsWith(".")) continue;
      const childPath = `${dirPath}/${name}`;
      const match = name.toLowerCase().includes(query.trim().toLowerCase());
      if (handle.kind === "directory") {
        browserDirs.set(childPath, handle);
        if (match) {
          hits.push({ name, path: childPath, isDir: true, size: 0, modifiedMs: null, ext: "" });
        }
        await walk(childPath, handle, depth + 1);
      } else {
        browserFiles.set(childPath, handle);
        if (match) {
          const file = await handle.getFile();
          hits.push({
            name,
            path: childPath,
            isDir: false,
            size: file.size,
            modifiedMs: file.lastModified,
            ext: extOf(name),
          });
        }
      }
    }
  };
  const root = browserDirs.get(path);
  if (!root) return [];
  await walk(path, root, 0);
  return sortEntries(hits);
}

export async function readFileBytes(path: string): Promise<Uint8Array> {
  if (isDemoPath(path)) return readDemoBytes(path);
  if (isTauri()) {
    const bytes = await invoke<number[]>("read_file_bytes", { path });
    return Uint8Array.from(bytes);
  }
  const handle = browserFiles.get(path);
  if (!handle) throw new Error("That file could not be opened.");
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

export async function openInSystem(path: string): Promise<void> {
  if (isDemoPath(path)) {
    const bytes = await readDemoBytes(path);
    const blob = new Blob([bytes.slice()]);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    return;
  }
  if (isTauri()) {
    await invoke("open_in_system", { path });
    return;
  }
  const handle = browserFiles.get(path);
  if (!handle) throw new Error("That file could not be opened.");
  const file = await handle.getFile();
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener");
}

export async function parentPath(path: string): Promise<string | null> {
  if (isDemoPath(path)) {
    if (path === DEMO_ROOT) return null;
    const trimmed = path.replace(/\/+$/, "");
    const i = trimmed.lastIndexOf("/");
    return i > "demo:/".length ? trimmed.slice(0, i) : DEMO_ROOT;
  }
  if (isTauri()) return invoke<string | null>("parent_path", { path });
  if (!path.startsWith("browser://")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join("/");
}

export async function specialFolders(): Promise<SpecialFolders> {
  if (isTauri()) return invoke<SpecialFolders>("special_folders");
  return { home: null, documents: null, desktop: null, downloads: null };
}

export function displayFolderLabel(path: string): string {
  if (isDemoPath(path)) return folderLabel(path.replace(/^demo:\/\//, ""));
  if (path.startsWith("browser://")) return folderLabel(path.replace(/^browser:\/\//, ""));
  return folderLabel(path);
}
