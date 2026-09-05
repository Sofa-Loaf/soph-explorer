import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "samples");
mkdirSync(dest, { recursive: true });

async function writePdf(name, title, lines) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText(title, { x: 64, y: 720, size: 22, font: bold, color: rgb(0.11, 0.18, 0.36) });
  lines.forEach((line, i) => {
    page.drawText(line, { x: 64, y: 670 - i * 22, size: 13, font, color: rgb(0.15, 0.18, 0.22) });
  });
  page.drawText("Soph Explorer Debloat — sample file for PDF preview", {
    x: 64,
    y: 56,
    size: 10,
    font,
    color: rgb(0.4, 0.45, 0.52),
  });
  writeFileSync(join(dest, name), await doc.save());
}

await writePdf("welcome.pdf", "Welcome to Soph Explorer Debloat", [
  "This is a lite file explorer.",
  "Open a folder, type in the search box, then click a PDF.",
  "The preview pane on the right is already on — nothing to enable.",
  "The app is free forever.",
]);

await writePdf("invoice.pdf", "Invoice April 2026", [
  "Bill to: North Desk Office Supplies",
  "Invoice number: INV-1044",
  "Paper reams ........................ $24.00",
  "Toner cartridges .................... $89.00",
  "Total due ........................... $113.00",
]);

await writePdf("nda.pdf", "Sample non-disclosure note", [
  "This is a short sample document so you can try preview.",
  "Search for NDA from the Sample files folder.",
  "It lives in the Contracts subfolder.",
]);

console.log("Wrote sample PDFs to public/samples/");
