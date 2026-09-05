import type { DirEntry } from "@/lib/types";
import { formatBytes, formatDate, kindLabel } from "@/lib/files";

type Props = {
  entries: DirEntry[];
  selectedPath: string | null;
  searching: boolean;
  query: string;
  onSelect: (entry: DirEntry) => void;
  onOpen: (entry: DirEntry) => void;
};

export function FileList({ entries, selectedPath, searching, query, onSelect, onOpen }: Props) {
  return (
    <section className="file-list" aria-label="Files">
      <div className="file-head" aria-hidden="true">
        <span className="col-name">Name</span>
        <span className="col-kind">Type</span>
        <span className="col-size">Size</span>
        <span className="col-date">Updated</span>
      </div>
      <div className="file-rows" role="listbox" aria-label="Folder contents">
        {entries.length === 0 ? (
          <div className="file-empty">
            {searching
              ? "Looking through this folder…"
              : query
                ? "No files match that search."
                : "This folder is empty."}
          </div>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.path}
              type="button"
              role="option"
              aria-selected={selectedPath === entry.path}
              className={`file-row ${selectedPath === entry.path ? "selected" : ""} ${entry.isDir ? "dir" : ""}`}
              onClick={() => onSelect(entry)}
              onDoubleClick={() => onOpen(entry)}
            >
              <span className="col-name">
                <span className="file-icon" aria-hidden="true">{entry.isDir ? "📁" : entry.ext === "pdf" ? "📄" : "📃"}</span>
                {entry.name}
              </span>
              <span className="col-kind">{kindLabel(entry)}</span>
              <span className="col-size">{entry.isDir ? "—" : formatBytes(entry.size)}</span>
              <span className="col-date">{formatDate(entry.modifiedMs)}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
