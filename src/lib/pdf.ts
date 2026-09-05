import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let ready = false;

export function ensurePdfjsWorker(): void {
  if (ready) return;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  ready = true;
}

export async function openPdf(bytes: Uint8Array) {
  ensurePdfjsWorker();
  const copy = new Uint8Array(bytes);
  return pdfjs.getDocument({
    data: copy,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;
}
