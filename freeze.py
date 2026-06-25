"""Render the Flask dashboard to a fully static site under public/ for Firebase Hosting.

The app's output depends only on the `ehr` / `slot` query params (no real server
state), so every page can be pre-rendered and the dynamic URLs rewritten to flat
file paths.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from app import EHRS, PHARMACY_SYSTEMS, app
from exports import list_test_user_previews
from platform_guide import resolve_download_path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "public"

# Export files referenced by /download/<sys>/<slot> links, copied to public/downloads/.
DOWNLOADS: dict[str, Path] = {}


def _download_sub(m: "re.Match[str]") -> str:
    system_id, slot = m.group(1), m.group(2)
    src = resolve_download_path(system_id, slot)
    if not src or not src.is_file():
        return m.group(0)
    DOWNLOADS[src.name] = src
    return "/downloads/" + src.name


def rewrite_links(html: str) -> str:
    """Turn Flask query-string URLs into static file paths."""
    # /workspace?ehr=X&slot=Y  (handle both raw & and escaped &amp;)
    html = re.sub(r"/workspace\?ehr=(\w+)(?:&amp;|&)slot=(\w+)", r"/workspace/\1/\2.html", html)
    # bare /workspace?ehr=X  -> default (master) page
    html = re.sub(r"/workspace\?ehr=(\w+)", r"/workspace/\1.html", html)
    # /pharmacy?system=X -> static pharmacy page
    html = re.sub(r"/pharmacy\?system=(\w+)", r"/pharmacy/\1.html", html)
    # /download/<sys>/<slot> -> static export file under /downloads/
    html = re.sub(r"/download/([\w-]+)/([\w-]+)", _download_sub, html)
    # /guide -> static guide page
    html = html.replace('"/guide"', '"/guide.html"')
    # logout just returns home on a static site
    html = html.replace("/logout-session", "/")
    return html


def write(path: Path, html: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(rewrite_links(html), encoding="utf-8")
    print(f"  wrote {path.relative_to(OUT)}")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    client = app.test_client()

    # Home
    resp = client.get("/")
    assert resp.status_code == 200, resp.status_code
    write(OUT / "index.html", resp.get_data(as_text=True))

    # Login page (auth gate target)
    resp = client.get("/login")
    assert resp.status_code == 200, resp.status_code
    write(OUT / "login.html", resp.get_data(as_text=True))

    # Platform guide
    resp = client.get("/guide")
    assert resp.status_code == 200, resp.status_code
    write(OUT / "guide.html", resp.get_data(as_text=True))

    # Workspace pages: one per ehr x slot, plus a bare default (master) page per ehr.
    for ehr in EHRS:
        resp = client.get(f"/workspace?ehr={ehr}")
        assert resp.status_code == 200, (ehr, resp.status_code)
        write(OUT / "workspace" / f"{ehr}.html", resp.get_data(as_text=True))

        for u in list_test_user_previews(ehr):
            slot = u["slot"]
            resp = client.get(f"/workspace?ehr={ehr}&slot={slot}")
            assert resp.status_code == 200, (ehr, slot, resp.status_code)
            write(OUT / "workspace" / ehr / f"{slot}.html", resp.get_data(as_text=True))

    # Pharmacy platforms: /pharmacy?system=X
    for system in PHARMACY_SYSTEMS:
        resp = client.get(f"/pharmacy?system={system}")
        assert resp.status_code == 200, (system, resp.status_code)
        write(OUT / "pharmacy" / f"{system}.html", resp.get_data(as_text=True))

    # Static assets (css/js/logos) served at /static/...
    shutil.copytree(ROOT / "static", OUT / "static")
    print("  copied static/ -> public/static/")

    # Export files referenced by download links (collected during link rewriting).
    if DOWNLOADS:
        dl_dir = OUT / "downloads"
        dl_dir.mkdir(parents=True, exist_ok=True)
        for name, src in DOWNLOADS.items():
            shutil.copy2(src, dl_dir / name)
        print(f"  copied {len(DOWNLOADS)} export file(s) -> public/downloads/")

    print(f"\nDone. Static site in {OUT}")


if __name__ == "__main__":
    main()
