import { describe, expect, it } from "vitest";
import { breadcrumbParts, extOf, formatBytes, kindLabel, nameMatches, sortEntries } from "@/lib/files";
import { searchDemo } from "@/lib/demo";
import type { DirEntry } from "@/lib/types";

const file = (name: string, extra: Partial<DirEntry> = {}): DirEntry => ({
  name,
  path: name,
  isDir: false,
  size: 10,
  modifiedMs: null,
  ext: extOf(name),
  ...extra,
});

describe("nameMatches", () => {
  it("matches case-insensitively", () => {
    expect(nameMatches("Invoice-April.pdf", "invoice")).toBe(true);
    expect(nameMatches("Invoice-April.pdf", "Q3")).toBe(false);
  });

  it("treats blank query as match-all", () => {
    expect(nameMatches("anything", "   ")).toBe(true);
  });
});

describe("sortEntries", () => {
  it("puts folders first, then names", () => {
    const sorted = sortEntries([
      file("zeta.pdf"),
      file("Contracts", { isDir: true, ext: "" }),
      file("alpha.txt"),
    ]);
    expect(sorted.map((e) => e.name)).toEqual(["Contracts", "alpha.txt", "zeta.pdf"]);
  });
});

describe("formatBytes and kindLabel", () => {
  it("formats sizes office users can read", () => {
    expect(formatBytes(800)).toBe("800 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
  });

  it("labels common office types", () => {
    expect(kindLabel(file("report.pdf"))).toBe("PDF");
    expect(kindLabel(file("notes", { isDir: true, ext: "" }))).toBe("Folder");
    expect(kindLabel(file("sheet.xlsx"))).toBe("Spreadsheet");
  });
});

describe("breadcrumbParts", () => {
  it("splits a Windows-style path", () => {
    const parts = breadcrumbParts("C:/Users/Ada/Documents");
    expect(parts.at(0)?.label).toBe("C:");
    expect(parts.at(-1)?.label).toBe("Documents");
  });
});

describe("searchDemo", () => {
  it("finds a nested PDF by name", () => {
    const hits = searchDemo("demo://Sample files", "nda");
    expect(hits.map((h) => h.name)).toContain("NDA.pdf");
  });
});
