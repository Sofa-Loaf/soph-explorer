#!/usr/bin/env python3
"""Generate Soph Explorer Debloat app icons (PNG + ICO + SVG favicon)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TAURI_ICONS = ROOT / "src-tauri" / "icons"
PUBLIC = ROOT / "public"


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 32)
    radius = size * 0.22
    for y in range(size):
        t = y / max(1, size - 1)
        color = (lerp(28, 18, t), lerp(78, 46, t), lerp(168, 118, t), 255)
        d.line([(pad, y), (size - pad - 1, y)], fill=color)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=radius, fill=255)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask)
    img = bg
    d = ImageDraw.Draw(img)

    # Folder
    fx, fy = int(size * 0.16), int(size * 0.30)
    fw, fh = int(size * 0.50), int(size * 0.40)
    tab = int(size * 0.16)
    d.rounded_rectangle([fx, fy, fx + fw, fy + fh], radius=size * 0.06, fill=(248, 250, 252, 240))
    d.rounded_rectangle([fx, fy - int(size * 0.07), fx + tab, fy + int(size * 0.08)], radius=size * 0.04, fill=(214, 224, 240, 255))

    # Small PDF badge
    bx, by = int(size * 0.52), int(size * 0.38)
    bw, bh = int(size * 0.28), int(size * 0.36)
    fold = int(size * 0.08)
    d.polygon(
        [(bx, by), (bx + bw - fold, by), (bx + bw, by + fold), (bx + bw, by + bh), (bx, by + bh)],
        fill=(255, 255, 255, 255),
    )
    d.polygon(
        [(bx + bw - fold, by), (bx + bw, by + fold), (bx + bw - fold, by + fold)],
        fill=(214, 224, 240, 255),
    )
    d.rounded_rectangle(
        [bx + int(size * 0.04), by + int(size * 0.14), bx + bw - int(size * 0.04), by + int(size * 0.22)],
        radius=size // 80,
        fill=(38, 95, 227, 255),
    )
    return img


def write_svg(path: Path) -> None:
    path.write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c4ea8"/>
      <stop offset="1" stop-color="#122e76"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#g)"/>
  <path d="M12 24h8l4-5h14v26H12z" fill="#f8fafc"/>
  <rect x="12" y="24" width="26" height="21" rx="3" fill="#e8eef8"/>
  <path d="M34 22h12l6 6v20H34z" fill="#ffffff"/>
  <path d="M46 22v6h6" fill="#d6e0f0"/>
  <rect x="38" y="34" width="12" height="5" rx="1" fill="#265fe3"/>
</svg>
""",
        encoding="utf-8",
    )


def main() -> None:
    TAURI_ICONS.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    master = draw_icon(1024)
    master.save(TAURI_ICONS / "icon.png")
    draw_icon(32).save(TAURI_ICONS / "32x32.png")
    draw_icon(128).save(TAURI_ICONS / "128x128.png")
    draw_icon(256).save(TAURI_ICONS / "128x128@2x.png")
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    draw_icon(256).save(TAURI_ICONS / "icon.ico", format="ICO", sizes=ico_sizes)
    write_svg(PUBLIC / "favicon.svg")
    write_svg(TAURI_ICONS / "icon.svg")
    print(f"Wrote icons to {TAURI_ICONS}")


if __name__ == "__main__":
    main()
