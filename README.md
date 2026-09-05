# Soph Explorer Debloat

A lite Windows file explorer. Fast search. **PDF preview is already on.** Free forever.

Same spirit as SophPDF Debloat: big buttons, plain language, no feature maze. This one is for people who just want to open a folder, find a file, and see a PDF without fighting Windows Explorer.

## Install on Windows (office users)

You do **not** need to build anything. When a release is published:

1. Open **[Releases](https://github.com/Sofa-Loaf/soph-explorer/releases/latest)**.
2. Download **`Soph Explorer Debloat_..._x64-setup.exe`** (the installer).
   - Prefer the installer if you want a Start-menu shortcut.
   - Or download **`soph-explorer.exe`** if you just want a portable file you can run.
   - An **`.msi`** is also there if your workplace prefers that.
3. Double-click the download.
4. If Windows says **“Windows protected your PC”**, click **More info**, then **Run anyway**. This app is new and may not be signed yet.
5. Click **Next** until it finishes. Then open **Soph Explorer Debloat** from the Start menu (or double-click the portable `.exe`).

### First use

1. Click **Open a folder**.
2. Pick **Documents** (or any folder you actually use).
3. Click a **PDF**. The preview appears on the **right**. You do not turn this on — it is the default.
4. Type in **Find a file…** to search this folder and its subfolders.
5. Double-click any file to open it in the usual program (Word, Excel, your PDF editor).

**Try a sample folder** shows a few pretend office files if you want to see search and PDF preview before opening your own files.

The app is **free forever**. There is no account and no subscription.

## What it does (and does not)

Does:

- Browse folders
- List files with a large, readable list
- Fast name search
- PDF preview in a side pane (pdf.js)
- Open files with the normal Windows program

Does not (on purpose):

- Ribbon tabs, Home / Share / View mazes, or OneDrive nags
- Cloud sync, ads, or in-app store
- Payments or licenses

## Windows packages (builders)

Produce the installer **only** on Windows 10/11 x64, or with the GitHub Actions Windows workflow. Cross-compiling a signed Windows installer from Linux is not supported.

| Path | What you get |
| --- | --- |
| [`scripts/build-windows.ps1`](scripts/build-windows.ps1) | Local NSIS + MSI + portable exe |
| [`.github/workflows/windows-build.yml`](.github/workflows/windows-build.yml) | Same artifacts on `windows-latest` (`workflow_dispatch` or a `v*` tag) |
| [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json) | Tauri 2 bundler: `targets: ["nsis", "msi"]`, current-user NSIS |

On a Windows machine (PowerShell):

```powershell
# Need Node.js 20+ and Rust: https://rustup.rs
.\scripts\build-windows.ps1
```

Artifacts:

- Portable app: `src-tauri\target\release\soph-explorer.exe`
- NSIS installer: `src-tauri\target\release\bundle\nsis\*.exe`
- MSI: `src-tauri\target\release\bundle\msi\*.msi`

More notes: [`docs/WINDOWS_BUILD.md`](docs/WINDOWS_BUILD.md).

## Run from source (developers)

```bash
npm install
npm run sample-pdf
npm test
npm run dev          # browser UI at http://127.0.0.1:1420
```

Desktop window (needs Tauri system libraries on your OS):

```bash
npm run tauri:dev
```

The browser build is a full explorer against a **sample folder**, and can open a real folder in Chromium via the File System Access picker. The Windows Tauri build is the product: native folder dialog, fast disk search, and NSIS/MSI installers.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Desktop shell | **Tauri 2** (Rust) | Small Windows `.exe` / NSIS / MSI |
| Preview | **pdf.js** | PDF preview without Adobe |
| UI | React + Vite + TypeScript | Same family as SophPDF Debloat |

## Project layout

```
src/                 React UI (folders, search, preview)
src/lib/             File helpers + Tauri / browser / sample adapters
src-tauri/           Tauri 2 Rust shell and Windows bundle config
scripts/             icons, sample PDFs, Windows build, pdf.js asset copy
tests/               search / label unit tests
docs/                Windows build notes
.github/workflows/   CI + Windows installer build
```

## License

[MIT](LICENSE). pdf.js is Apache-2.0. Tauri is MIT.
