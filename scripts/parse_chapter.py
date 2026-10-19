#!/usr/bin/env python3
"""Parse one chapter of a scanned PDF into line-level text blocks.

Pipeline: pdftoppm (render @ dpi) -> Apple Vision OCR (ocrmac) -> blocks JSON.

Every block carries the printed book page (bookPage) and a normalized bbox
[x, y, w, h] (origin bottom-left, Vision convention) so downstream consumers
can jump to the page. Regions: main | sidebar | header | footer.

Usage:
    .venv/bin/python scripts/parse_chapter.py            # all chapters in config
    .venv/bin/python scripts/parse_chapter.py ch01       # one chapter

    # uploaded material PDF (ingest 落盘 data/uploads/<id>.pdf)——不传 --pdf 才用
    # config/chapter.json 的 seed PDF（免疫学）：
    .venv/bin/python scripts/parse_chapter.py --pdf data/uploads/m-xxx.pdf ch05 ch06
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from ocrmac.ocrmac import OCR
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config" / "chapter.json").read_text())


def resolve_pdf(arg: str | None) -> Path:
    """--pdf 显式指定（相对仓库根或绝对）；缺省回落 config 的 seed PDF。"""
    if arg is None:
        return ROOT / CONFIG["pdf"]
    p = Path(arg)
    return p if p.is_absolute() else ROOT / p


def render_pages(pdf: Path, first: int, last: int, dpi: int, outdir: Path) -> list[Path]:
    outdir.mkdir(parents=True, exist_ok=True)
    prefix = outdir / "pg"
    subprocess.run(
        ["pdftoppm", "-f", str(first), "-l", str(last), "-r", str(dpi),
         "-png", str(pdf), str(prefix)],
        check=True,
    )
    return sorted(outdir.glob("pg-*.png"))


def classify(bbox: list[float], cfg: dict) -> str:
    x, y, w, h = bbox
    yc, xc = y + h / 2, x + w / 2
    if yc < cfg["footerYCenter"]:
        return "footer"
    if yc > cfg["headerYCenter"]:
        return "header"
    if xc > cfg["sidebarXCenter"]:
        return "sidebar"
    return "main"


def ocr_page(png: Path, lang: str) -> list[tuple[str, float, list[float]]]:
    with Image.open(png) as img:
        return OCR(img, language_preference=[lang]).recognize()


def parse_chapter(ch: dict, pdf: Path, source: str) -> dict:
    cfg = CONFIG["ocr"]
    first, last = ch["physicalStart"], ch["physicalEnd"]
    with tempfile.TemporaryDirectory(prefix="ariadne-ocr-") as td:
        pages = render_pages(pdf, first, last, cfg["dpi"], Path(td))
        if len(pages) != last - first + 1:
            raise RuntimeError(f"expected {last - first + 1} pages, rendered {len(pages)}")
        blocks, page_texts = [], []
        for i, png in enumerate(pages):
            physical = first + i
            book = physical - ch["pageOffset"]
            raw = ocr_page(png, cfg["language"])
            per_page = []
            for text, conf, bbox in raw:
                text = text.strip()
                if not text:
                    continue
                region = classify(bbox, cfg)
                per_page.append(
                    {
                        "page": book if book > 0 else None,
                        "physicalPage": physical,
                        "region": region,
                        "bbox": [round(v, 4) for v in bbox],
                        "text": text,
                        "conf": round(conf, 2),
                    }
                )
            # reading order: main column top-to-bottom, then sidebar, then header/footer
            order = {"main": 0, "sidebar": 1, "header": 2, "footer": 3}
            per_page.sort(key=lambda b: (order[b["region"]], -b["bbox"][1], b["bbox"][0]))
            blocks.extend(per_page)
            page_texts.append(
                {
                    "page": book if book > 0 else None,
                    "physicalPage": physical,
                    "text": "\n".join(b["text"] for b in per_page if b["region"] == "main"),
                }
            )
            print(f"  p.{book} (phys {physical}): {len(per_page)} blocks", file=sys.stderr)

    return {
        "source": source,
        "book": "免疫学基础与病原生物学（第3版）",
        "chapter": {
            "id": ch["id"],
            "title": ch["title"],
            "pages": {"book": [max(1, ch["physicalStart"] - ch["pageOffset"]),
                               ch["physicalEnd"] - ch["pageOffset"]],
                      "physical": [ch["physicalStart"], ch["physicalEnd"]]},
        },
        "ocr": {"engine": cfg["engine"], "dpi": cfg["dpi"], "language": cfg["language"]},
        "pageOffset": ch["pageOffset"],
        "blocks": blocks,
        "pages": page_texts,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("chapters", nargs="*", help="章 id（缺省= config 全部章）")
    ap.add_argument(
        "--pdf",
        default=None,
        help="PDF 路径（相对仓库根或绝对；缺省回落 config/chapter.json 的 seed PDF）",
    )
    args = ap.parse_args()

    pdf = resolve_pdf(args.pdf)
    source = args.pdf if args.pdf is not None else CONFIG["pdf"]

    chapters = [c for c in CONFIG["chapters"] if not args.chapters or c["id"] in args.chapters]
    if not chapters:
        sys.exit(f"no chapter matched {args.chapters}; known: {[c['id'] for c in CONFIG['chapters']]}")
    if not pdf.exists():
        sys.exit(f"PDF not found: {pdf}（--pdf 相对仓库根或绝对路径）")
    outdir = ROOT / "data" / "chapters"
    outdir.mkdir(parents=True, exist_ok=True)
    for ch in chapters:
        print(f"parsing {ch['id']} ({ch['title']}) from {source} …", file=sys.stderr)
        doc = parse_chapter(ch, pdf, source)
        out = outdir / f"{ch['id']}.blocks.json"
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=1))
        n_main = sum(1 for b in doc["blocks"] if b["region"] == "main")
        print(f"wrote {out} ({len(doc['blocks'])} blocks, {n_main} main-region)", file=sys.stderr)


if __name__ == "__main__":
    main()
