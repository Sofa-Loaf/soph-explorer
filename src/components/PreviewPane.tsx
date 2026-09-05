import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { DirEntry } from "@/lib/types";
import { isImage, isPdf, isText } from "@/lib/files";
import { openPdf } from "@/lib/pdf";
import { openInSystem, readFileBytes } from "@/lib/api";

type Props = {
  entry: DirEntry | null;
  onOpenFolder: (path: string) => void;
};

export function PreviewPane({ entry, onOpenFolder }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    let objectUrl: string | null = null;
    setPdf(null);
    setPage(1);
    setPageCount(0);
    setImageUrl(null);
    setText(null);
    setError(null);

    if (!entry || entry.isDir) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void (async () => {
      try {
        const bytes = await readFileBytes(entry.path);
        if (cancel) return;
        if (isPdf(entry)) {
          const doc = await openPdf(bytes);
          if (cancel) {
            doc.destroy();
            return;
          }
          setPdf(doc);
          setPageCount(doc.numPages);
        } else if (isImage(entry)) {
          objectUrl = URL.createObjectURL(new Blob([bytes.slice()]));
          setImageUrl(objectUrl);
        } else if (isText(entry)) {
          setText(new TextDecoder().decode(bytes.slice(0, 8000)));
        }
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : "Could not preview this file.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    let cancel = false;
    void (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        const viewport = pdfPage.getViewport({ scale: 1.15 });
        const context = canvas.getContext("2d");
        if (!context || cancel) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvasContext: context, viewport }).promise;
      } catch {
        if (!cancel) setError("Could not draw this PDF page.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pdf, page]);

  useEffect(() => {
    return () => {
      pdf?.destroy();
    };
  }, [pdf]);

  const openSelected = async () => {
    if (!entry) return;
    if (entry.isDir) {
      onOpenFolder(entry.path);
      return;
    }
    try {
      await openInSystem(entry.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that file.");
    }
  };

  return (
    <aside className="preview" aria-label="Preview">
      <div className="preview-head">
        <h2>Preview</h2>
        <p>PDF preview is on</p>
      </div>
      <div className="preview-body">
        {!entry && <p className="preview-hint">Select a file. If it is a PDF, you will see it here.</p>}
        {entry?.isDir && (
          <div className="preview-hint">
            <p><strong>{entry.name}</strong> is a folder.</p>
            <button type="button" className="primary" onClick={() => onOpenFolder(entry.path)}>Open this folder</button>
          </div>
        )}
        {loading && <p className="preview-hint">Loading preview…</p>}
        {error && <p className="error-text" role="alert">{error}</p>}
        {pdf && (
          <div className="pdf-preview">
            <div className="pdf-toolbar">
              <button type="button" className="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous page</button>
              <span>Page {page} of {pageCount}</span>
              <button type="button" className="ghost" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next page</button>
            </div>
            <div className="pdf-scroll">
              <canvas ref={canvasRef} />
            </div>
          </div>
        )}
        {imageUrl && <img className="image-preview" src={imageUrl} alt={entry?.name ?? "Picture preview"} />}
        {text !== null && <pre className="text-preview">{text}</pre>}
        {entry && !entry.isDir && !loading && !pdf && !imageUrl && text === null && !error && (
          <p className="preview-hint">No preview for this file type. Double-click to open it in the usual program.</p>
        )}
      </div>
      {entry && !entry.isDir && (
        <div className="preview-actions">
          <button type="button" className="primary" onClick={() => void openSelected()}>
            Open this file
          </button>
        </div>
      )}
    </aside>
  );
}
