import type { DirEntry } from "./types";
import { extOf } from "./files";

export const DEMO_ROOT = "demo://Sample files";

type DemoNode = {
  name: string;
  isDir?: boolean;
  text?: string;
  pdf?: string;
  children?: DemoNode[];
  size?: number;
};

const TREE: DemoNode = {
  name: "Sample files",
  isDir: true,
  children: [
    { name: "Welcome.pdf", pdf: "/samples/welcome.pdf", size: 18_400 },
    { name: "Invoice-April.pdf", pdf: "/samples/invoice.pdf", size: 16_200 },
    { name: "Meeting notes.txt", text: "Weekly standup\n\n- Invoice-April.pdf is ready for review\n- Send the NDA from Contracts\n- Next meeting: Thursday 10:00\n" },
    { name: "Team budget.csv", text: "Item,Amount\nPaper,24\nToner,89\nCoffee,16\n" },
    {
      name: "Contracts",
      isDir: true,
      children: [
        { name: "NDA.pdf", pdf: "/samples/nda.pdf", size: 15_800 },
        { name: "Read me.txt", text: "These are sample office files so you can try search and PDF preview." },
      ],
    },
  ],
};

function nodeAt(path: string): DemoNode | null {
  const rel = path.replace(/^demo:\/\//, "");
  const parts = rel.split("/").filter(Boolean);
  let node: DemoNode = TREE;
  if (parts[0] !== TREE.name) return null;
  for (const part of parts.slice(1)) {
    const next = node.children?.find((c) => c.name === part);
    if (!next) return null;
    node = next;
  }
  return node;
}

function toEntry(parentPath: string, node: DemoNode): DirEntry {
  const path = `${parentPath}/${node.name}`;
  return {
    name: node.name,
    path,
    isDir: !!node.isDir,
    size: node.size ?? (node.text ? new TextEncoder().encode(node.text).length : 0),
    modifiedMs: Date.UTC(2026, 3, 8, 14, 30),
    ext: node.isDir ? "" : extOf(node.name),
  };
}

export function isDemoPath(path: string): boolean {
  return path.startsWith("demo://");
}

export function listDemo(path: string): DirEntry[] {
  const node = nodeAt(path);
  if (!node?.isDir || !node.children) return [];
  return node.children.map((child) => toEntry(path, child));
}

export function searchDemo(root: string, query: string): DirEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: DirEntry[] = [];
  const walk = (parent: string, node: DemoNode) => {
    const path = parent ? `${parent}/${node.name}` : `demo://${node.name}`;
    if (node.name.toLowerCase().includes(q) && parent) {
      hits.push({
        name: node.name,
        path,
        isDir: !!node.isDir,
        size: node.size ?? (node.text ? new TextEncoder().encode(node.text).length : 0),
        modifiedMs: Date.UTC(2026, 3, 8, 14, 30),
        ext: node.isDir ? "" : extOf(node.name),
      });
    }
    node.children?.forEach((child) => walk(path, child));
  };
  const start = nodeAt(root) ?? TREE;
  const startPath = nodeAt(root) ? root : DEMO_ROOT;
  start.children?.forEach((child) => walk(startPath, child));
  return hits;
}

export async function readDemoBytes(path: string): Promise<Uint8Array> {
  const node = nodeAt(path);
  if (!node || node.isDir) throw new Error("That file could not be opened.");
  if (node.pdf) {
    const res = await fetch(node.pdf);
    if (!res.ok) throw new Error("That file could not be opened.");
    return new Uint8Array(await res.arrayBuffer());
  }
  return new TextEncoder().encode(node.text ?? "");
}
