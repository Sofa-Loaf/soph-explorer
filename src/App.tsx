import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FileList } from "@/components/FileList";
import { Places } from "@/components/Places";
import { PreviewPane } from "@/components/PreviewPane";
import {
  displayFolderLabel,
  isTauri,
  listFolder,
  parentPath,
  pickFolder,
  searchFolder,
  specialFolders,
} from "@/lib/api";
import { DEMO_ROOT, isDemoPath } from "@/lib/demo";
import { breadcrumbParts, nameMatches } from "@/lib/files";
import { loadRecent, loadTheme, rememberFolder, saveTheme } from "@/lib/recent";
import type { DirEntry, Place } from "@/lib/types";

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);
  const [path, setPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [selected, setSelected] = useState<DirEntry | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DirEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [parent, setParent] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  const refreshPlaces = useCallback(async (current?: string | null) => {
    const special = await specialFolders();
    const next: Place[] = [];
    if (special.documents) next.push({ id: "documents", label: "Documents", path: special.documents });
    if (special.desktop) next.push({ id: "desktop", label: "Desktop", path: special.desktop });
    if (special.downloads) next.push({ id: "downloads", label: "Downloads", path: special.downloads });
    if (special.home) next.push({ id: "home", label: "Home", path: special.home });
    next.push({ id: "sample", label: "Sample files", path: DEMO_ROOT });
    const recent = loadRecent();
    recent.forEach((item, i) => {
      if (!next.some((p) => p.path === item)) {
        next.push({ id: `recent-${i}`, label: displayFolderLabel(item), path: item });
      }
    });
    if (current && !next.some((p) => p.path === current)) {
      next.unshift({ id: "current", label: displayFolderLabel(current), path: current });
    }
    setPlaces(next);
  }, []);

  useEffect(() => {
    void refreshPlaces(path);
  }, [path, refreshPlaces]);

  const openPath = useCallback(async (nextPath: string) => {
    setError(null);
    setQuery("");
    setHits(null);
    setSelected(null);
    try {
      const listed = await listFolder(nextPath);
      setPath(nextPath);
      setEntries(listed);
      setParent(await parentPath(nextPath));
      if (!isDemoPath(nextPath) && !nextPath.startsWith("browser://")) {
        rememberFolder(nextPath);
      }
      const firstPdf = listed.find((item) => !item.isDir && item.ext === "pdf") ?? null;
      setSelected(firstPdf);
      void refreshPlaces(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That folder could not be opened.");
    }
  }, [refreshPlaces]);

  const onOpenFolder = async () => {
    setError(null);
    try {
      const picked = await pickFolder();
      if (picked) await openPath(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That folder could not be opened.");
    }
  };

  useEffect(() => {
    if (!path) {
      setHits(null);
      setSearching(false);
      return;
    }
    const q = query.trim();
    if (!q) {
      setHits(null);
      setSearching(false);
      return;
    }
    let cancel = false;
    setSearching(true);
    const handle = window.setTimeout(() => {
      void searchFolder(path, q)
        .then((found) => {
          if (!cancel) setHits(found);
        })
        .catch((err) => {
          if (!cancel) setError(err instanceof Error ? err.message : "Search failed.");
        })
        .finally(() => {
          if (!cancel) setSearching(false);
        });
    }, 160);
    return () => {
      cancel = true;
      window.clearTimeout(handle);
    };
  }, [path, query]);

  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return entries;
    if (hits) return hits;
    return entries.filter((entry) => nameMatches(entry.name, q));
  }, [entries, hits, query]);

  const crumbs = useMemo(() => {
    if (!path) return [];
    if (path.startsWith("demo://")) {
      return breadcrumbParts(path.replace(/^demo:\/\//, "")).map((part) => ({
        ...part,
        path: `demo://${part.path.replace(/^\//, "")}`,
      }));
    }
    if (path.startsWith("browser://")) {
      return breadcrumbParts(path.replace(/^browser:\/\//, "")).map((part) => ({
        ...part,
        path: `browser://${part.path.replace(/^\//, "")}`,
      }));
    }
    return breadcrumbParts(path);
  }, [path]);

  const openEntry = async (entry: DirEntry) => {
    if (entry.isDir) {
      await openPath(entry.path);
      return;
    }
    setSelected(entry);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand sm" aria-hidden="true">S</div>
          <div>
            <strong>Soph Explorer Debloat</strong>
            <span className="free-pill">Free forever</span>
          </div>
        </div>
        <label className="search">
          <span className="sr-only">Search this folder</span>
          <input
            type="search"
            placeholder="Find a file…"
            value={query}
            disabled={!path}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="ghost"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </header>

      <div className="nav">
        <button type="button" className="primary" onClick={() => void onOpenFolder()}>
          Open a folder
        </button>
        <button
          type="button"
          className="ghost"
          disabled={!parent}
          onClick={() => parent && void openPath(parent)}
        >
          Up one folder
        </button>
        <nav className="crumbs" aria-label="Folder path">
          {crumbs.map((crumb, i) => (
            <span key={crumb.path}>
              {i > 0 && <span className="crumb-sep">›</span>}
              <button type="button" onClick={() => void openPath(crumb.path)}>{crumb.label}</button>
            </span>
          ))}
          {!path && <span className="muted">No folder open yet</span>}
        </nav>
      </div>

      {!path ? (
        <EmptyState
          onOpenFolder={() => void onOpenFolder()}
          onTrySample={() => void openPath(DEMO_ROOT)}
          error={error}
        />
      ) : (
        <div className="workspace">
          <Places places={places} currentPath={path} onOpen={(next) => void openPath(next)} />
          <FileList
            entries={visible}
            selectedPath={selected?.path ?? null}
            searching={searching}
            query={query}
            onSelect={setSelected}
            onOpen={(entry) => void openEntry(entry)}
          />
          <PreviewPane entry={selected} onOpenFolder={(next) => void openPath(next)} />
        </div>
      )}

      <footer className="statusbar">
        <span>
          {path
            ? `${visible.length} item${visible.length === 1 ? "" : "s"}${query.trim() ? " found" : ""}`
            : isTauri()
              ? "Windows app ready"
              : "Browser preview — the Windows installer is the real product"}
        </span>
        <span>PDF preview is on · Double-click a file to open it</span>
      </footer>
    </div>
  );
}
