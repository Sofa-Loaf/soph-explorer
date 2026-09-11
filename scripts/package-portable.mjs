#!/usr/bin/env node
/**
 * Package a portable Windows zip of the runnable web scaffold.
 * Used as a public download when a Tauri installer is not available,
 * and as an extra artifact beside the installer.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist-portable", "Soph-Explorer-Debloat-portable");
const zipPath = join(root, "dist-portable", "Soph-Explorer-Debloat-0.1.0-portable-win64.zip");
const dist = join(root, "dist");

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

if (!existsSync(join(root, "node_modules"))) {
  run("npm", ["ci"]);
}

run("npm", ["run", "sample-pdf"]);
run("npm", ["run", "build"]);

rmSync(join(root, "dist-portable"), { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(dist, join(outDir, "web"), { recursive: true });

writeFileSync(
  join(outDir, "START.bat"),
  `@echo off
setlocal
cd /d "%~dp0"
echo Starting Soph Explorer Debloat (portable web preview)...
echo Free forever. PDF preview is on. Close this window to stop the server.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START.ps1"
`,
  "utf8",
);

writeFileSync(
  join(outDir, "START.ps1"),
  `$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "web"
if (-not (Test-Path $root)) { throw "Missing web folder. Unzip the whole archive." }
$listener = New-Object System.Net.HttpListener
$port = 1420
$prefix = "http://127.0.0.1:$port/"
try {
  $listener.Prefixes.Add($prefix)
  $listener.Start()
} catch {
  $port = 14200
  $prefix = "http://127.0.0.1:$port/"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  $listener.Start()
}
Start-Process $prefix
Write-Host "Soph Explorer Debloat is open at $prefix"
Write-Host "Click 'Try a sample folder' to see PDF preview. Close this window to stop."
$mime = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript"; ".css"="text/css"
  ".svg"="image/svg+xml"; ".png"="image/png"; ".pdf"="application/pdf"
  ".woff"="font/woff"; ".woff2"="font/woff2"; ".json"="application/json"
  ".map"="application/json"; ".ico"="image/x-icon"
}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
  $full = Join-Path $root ($path -replace "/", [IO.Path]::DirectorySeparatorChar)
  $full = [IO.Path]::GetFullPath($full)
  if (-not $full.StartsWith([IO.Path]::GetFullPath($root))) {
    $ctx.Response.StatusCode = 403
    $ctx.Response.Close()
    continue
  }
  if (-not (Test-Path $full -PathType Leaf)) {
    $full = Join-Path $root "index.html"
  }
  $bytes = [IO.File]::ReadAllBytes($full)
  $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
  $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
`,
  "utf8",
);

writeFileSync(
  join(outDir, "README.txt"),
  `Soph Explorer Debloat — portable preview (Windows)
=================================================

This zip is a free, runnable preview. Double-click START.bat.

What you get
- The same explorer UI: open a folder, search, PDF preview on the right
- "Try a sample folder" works without picking files
- Chromium browsers can open a real folder via the File System Access picker

The full Windows app (native folder dialog, Start-menu installer, portable .exe)
is on the GitHub Release when the Tauri build is attached:

https://github.com/Sofa-Loaf/soph-explorer/releases/latest

Free forever. No account. No subscription.

If Windows blocks START.bat: right-click → Run anyway / More info.
`,
  "utf8",
);

rmSync(zipPath, { force: true });
const zipResult = spawnSync("zip", ["-r", "-9", zipPath, "Soph-Explorer-Debloat-portable"], {
  cwd: join(root, "dist-portable"),
  stdio: "inherit",
});
if (zipResult.status !== 0) {
  const python = spawnSync(
    "python3",
    ["-c", "import shutil; shutil.make_archive('Soph-Explorer-Debloat-0.1.0-portable-win64', 'zip', '.', 'Soph-Explorer-Debloat-portable')"],
    { cwd: join(root, "dist-portable"), stdio: "inherit" },
  );
  if (python.status !== 0) throw new Error("Could not create zip");
}

console.log(`Wrote ${zipPath}`);
