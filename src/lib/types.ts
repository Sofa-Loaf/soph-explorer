export type DirEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modifiedMs: number | null;
  ext: string;
};

export type SpecialFolders = {
  home: string | null;
  documents: string | null;
  desktop: string | null;
  downloads: string | null;
};

export type Place = {
  id: string;
  label: string;
  path: string;
};

export type FolderSession = {
  path: string;
  label: string;
};
