type Props = {
  onOpenFolder: () => void;
  onTrySample: () => void;
  error: string | null;
};

export function EmptyState({ onOpenFolder, onTrySample, error }: Props) {
  return (
    <div className="empty">
      <div className="empty-card">
        <div className="brand" aria-hidden="true">S</div>
        <h1>Soph Explorer Debloat</h1>
        <p className="lede">
          A lite file explorer. Open a folder, find a file, click a PDF — the preview is already on.
          Free forever. No Windows Explorer bloat.
        </p>
        <ol className="how">
          <li>Open a folder</li>
          <li>Type in the search box to find a file</li>
          <li>Click a PDF. The preview opens on the right</li>
        </ol>
        <div className="actions">
          <button type="button" className="primary big" onClick={onOpenFolder}>
            Open a folder
          </button>
          <button type="button" className="ghost big" onClick={onTrySample}>
            Try a sample folder
          </button>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
      </div>
    </div>
  );
}
