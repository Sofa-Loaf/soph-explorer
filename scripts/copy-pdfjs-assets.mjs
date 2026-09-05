import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pdfjs-dist");
const dest = join(root, "public", "pdfjs");

if (!existsSync(join(src, "cmaps"))) {
  console.warn("pdfjs-dist not installed yet; skip asset copy");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(join(src, "cmaps"), join(dest, "cmaps"), { recursive: true });
cpSync(join(src, "standard_fonts"), join(dest, "standard_fonts"), { recursive: true });
console.log("Copied pdf.js cmaps and standard fonts to public/pdfjs/");
