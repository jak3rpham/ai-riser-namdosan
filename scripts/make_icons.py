#!/usr/bin/env python3
"""
Sinh bộ icon PWA cho app "Nhà Mình".

Tại sao là script chứ không phải file PNG bỏ sẵn vào repo: icon phải tái tạo
được. Đổi màu thương hiệu hay đổi hình thì sửa vài con số ở đây rồi chạy lại,
không phải đi tìm file gốc trong máy ai đó.

Không phụ thuộc thư viện ngoài — chỉ dùng zlib và struct của thư viện chuẩn,
nên chạy được trên máy trắng và trong CI mà không cần cài gì.

    python3 scripts/make_icons.py

Sinh ra trong public/:
    icon-192.png            icon thường
    icon-512.png            icon thường, bản lớn
    icon-maskable-512.png   bản cho Android adaptive icon (hình thu nhỏ để
                            nằm gọn trong vùng an toàn 80%, tránh bị cắt)
    apple-touch-icon.png    180x180, iOS đọc riêng thẻ này
    favicon.svg             favicon cho trình duyệt desktop
"""

import math
import struct
import zlib
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "public"

CORAL = (0xFF, 0x6B, 0x4B)   # --coral-main, trùng theme-color trong index.html
CREAM = (0xFF, 0xFF, 0xFF)

SUPERSAMPLE = 3  # khử răng cưa: mỗi pixel lấy mẫu 3x3


def house_coverage(x, y):
    """
    Hình mái nhà + thân nhà, toạ độ chuẩn hoá 0..1.
    Trả về True nếu điểm nằm trong hình.
    """
    # Mái: tam giác cân, đỉnh ở trên
    apex_x, apex_y = 0.50, 0.16
    left_x, right_x, eaves_y = 0.10, 0.90, 0.52

    in_roof = False
    if apex_y <= y <= eaves_y:
        t = (y - apex_y) / (eaves_y - apex_y)
        half = t * (right_x - left_x) / 2
        in_roof = abs(x - apex_x) <= half

    # Thân nhà
    in_body = (0.24 <= x <= 0.76) and (0.48 <= y <= 0.86)

    return in_roof or in_body


def heart_coverage(x, y):
    """
    Trái tim khoét trong thân nhà — "nhà" cộng "thương".
    Dùng phương trình ẩn quen thuộc của hình tim, co về vùng thân nhà.
    """
    cx, cy, scale = 0.50, 0.655, 0.175
    u = (x - cx) / scale
    v = -(y - cy) / scale
    return (u * u + v * v - 1) ** 3 - u * u * (v ** 3) <= 0


def render(size, glyph_scale):
    """
    Vẽ một icon vuông `size` px. `glyph_scale` là tỉ lệ hình nhà so với khung —
    bản maskable cần nhỏ hơn để không bị Android cắt mất mái.
    """
    pixels = bytearray()
    margin = (1.0 - glyph_scale) / 2
    step = 1.0 / (size * SUPERSAMPLE)

    for py in range(size):
        pixels.append(0)  # filter byte của mỗi hàng trong PNG
        for px in range(size):
            hits = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    gx = (px * SUPERSAMPLE + sx + 0.5) * step
                    gy = (py * SUPERSAMPLE + sy + 0.5) * step
                    # đưa về toạ độ của hình sau khi thu nhỏ
                    hx = (gx - margin) / glyph_scale
                    hy = (gy - margin) / glyph_scale
                    if not (0 <= hx <= 1 and 0 <= hy <= 1):
                        continue
                    if house_coverage(hx, hy) and not heart_coverage(hx, hy):
                        hits += 1

            alpha = hits / (SUPERSAMPLE * SUPERSAMPLE)
            pixels.extend(
                round(CORAL[c] + (CREAM[c] - CORAL[c]) * alpha) for c in range(3)
            )

    return bytes(pixels)


def write_png(path, size, raw):
    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)
    return len(png)


FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#FF6B4B"/>
  <path d="M50 16 L90 52 L76 52 L76 86 L24 86 L24 52 L10 52 Z" fill="#FFFFFF"/>
  <path d="M50 76 C36 66 33 60 33 55 C33 50 37 47 41 47
           C45 47 48 50 50 53 C52 50 55 47 59 47
           C63 47 67 50 67 55 C67 60 64 66 50 76 Z" fill="#FF6B4B"/>
</svg>
"""


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    targets = [
        ("icon-192.png", 192, 0.78),
        ("icon-512.png", 512, 0.78),
        # Android khoét tròn/bo góc adaptive icon: hình phải nằm trong 80% giữa
        ("icon-maskable-512.png", 512, 0.58),
        ("apple-touch-icon.png", 180, 0.78),
    ]

    for name, size, scale in targets:
        n = write_png(OUT_DIR / name, size, render(size, scale))
        print(f"  {name:<26} {size}x{size}  {n / 1024:.1f} KB")

    (OUT_DIR / "favicon.svg").write_text(FAVICON_SVG)
    print("  favicon.svg")


if __name__ == "__main__":
    main()
