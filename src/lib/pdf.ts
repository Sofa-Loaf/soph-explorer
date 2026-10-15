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
    // Do not eval PDF function strings (CVE-2024-4367 class; default is still true).
    isEvalSupported: false,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;
}
