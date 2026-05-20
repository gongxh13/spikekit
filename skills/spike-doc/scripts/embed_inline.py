#!/usr/bin/env python3
"""Turn an image or video file into an inline HTML tag (base64 data URI).

Self-contained HTML docs can't link external files — they must carry their media
inside the markup so the page still renders when moved or opened offline. Doing
the base64 dance by hand for every asset is tedious and error-prone; this does it.

Usage:
    python embed_inline.py <file> ["alt / caption text"] [--width 720]

Prints the tag to stdout. Images become <img>, videos become a <video> with
controls. Pipe or paste the result into your HTML.

    python embed_inline.py figure.png "架构图" --width 720
    python embed_inline.py demo.mp4 "操作演示"
"""

import base64
import mimetypes
import sys


def main() -> int:
    args = [a for a in sys.argv[1:]]
    if not args:
        print(__doc__)
        return 1

    width = None
    if "--width" in args:
        i = args.index("--width")
        try:
            width = int(args[i + 1])
        except (IndexError, ValueError):
            print("ERR: --width needs a number", file=sys.stderr)
            return 1
        del args[i : i + 2]

    path = args[0]
    alt = args[1] if len(args) > 1 else ""

    try:
        with open(path, "rb") as f:
            raw = f.read()
    except OSError as e:
        print(f"ERR: cannot read {path}: {e}", file=sys.stderr)
        return 1

    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    b64 = base64.b64encode(raw).decode("ascii")
    style = f' style="max-width:{width}px;width:100%"' if width else ' style="max-width:100%"'

    size_kb = len(b64) // 1024
    if mime.startswith("video/"):
        tag = (
            f'<video controls{style} aria-label="{alt}">'
            f'<source src="data:{mime};base64,{b64}" type="{mime}">'
            f"</video>"
        )
    else:
        if not mime.startswith("image/"):
            print(f"WARN: {mime} is neither image nor video; emitting <img> anyway", file=sys.stderr)
        tag = f'<img alt="{alt}" src="data:{mime};base64,{b64}"{style}>'

    # Note to stderr so it doesn't pollute the tag on stdout.
    print(f"[embed_inline] {path} -> inline {mime}, ~{size_kb} KB base64", file=sys.stderr)
    if size_kb > 800:
        print(
            "[embed_inline] large asset — base64 inlining bloats the HTML. "
            "For big videos prefer a short GIF or a linked file instead.",
            file=sys.stderr,
        )
    print(tag)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
