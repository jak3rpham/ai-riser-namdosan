#!/usr/bin/env python3
"""
Deploy thư mục dist/ lên Firebase Hosting, dùng quyền gcloud sẵn có.

Vì sao không dùng `firebase deploy`: Firebase CLI đòi luồng đăng nhập riêng và
trả về một mã uỷ quyền phải dán tay. Máy đã đăng nhập gcloud rồi thì gọi thẳng
Firebase Hosting REST API bằng token đó — cùng kết quả, không phải cầm token.

Dùng:  npm run deploy
Cần:   đã `gcloud auth login`, và tài khoản có quyền trên project.
"""

import gzip
import hashlib
import io
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

PROJECT = os.environ.get("FIREBASE_PROJECT", "ai-riser-namdosan-fa737")
SITE = os.environ.get("FIREBASE_SITE", PROJECT)
DIST = "dist"
BASE = "https://firebasehosting.googleapis.com/v1beta1"


def token() -> str:
    try:
        return subprocess.check_output(
            ["gcloud", "auth", "print-access-token"], text=True, stderr=subprocess.PIPE
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        sys.exit("Chưa đăng nhập gcloud. Chạy:  gcloud auth login")


TOK = token()


def api(url, data=None, method=None, raw=None, ctype="application/json"):
    req = urllib.request.Request(
        url, method=method or ("POST" if (data is not None or raw is not None) else "GET")
    )
    req.add_header("Authorization", f"Bearer {TOK}")
    req.add_header("x-goog-user-project", PROJECT)
    req.add_header("Content-Type", ctype)
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    try:
        with urllib.request.urlopen(req, body) as r:
            text = r.read()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"\n✗ Lỗi {e.code} khi gọi {url.split('?')[0]}\n{e.read().decode()[:500]}")


def gzipped(path: str) -> bytes:
    buf = io.BytesIO()
    # mtime=0 để cùng nội dung luôn ra cùng hash — tránh upload lại file không đổi
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0) as g:
        g.write(open(path, "rb").read())
    return buf.getvalue()


def hosting_config() -> dict:
    """Lấy cấu hình hosting từ firebase.json để một nguồn sự thật duy nhất."""
    cfg = json.load(open("firebase.json")).get("hosting", {})
    out = {}
    if cfg.get("rewrites"):
        rw = []
        for r in cfg["rewrites"]:
            item = {"glob": r["source"]}
            if "destination" in r:
                item["path"] = r["destination"]
            elif "run" in r:
                item["run"] = r["run"]
            rw.append(item)
        out["rewrites"] = rw
    if cfg.get("headers"):
        out["headers"] = [
            {"glob": h["source"], "headers": {x["key"]: x["value"] for x in h["headers"]}}
            for h in cfg["headers"]
        ]
    return out


def main():
    if not os.path.isdir(DIST):
        sys.exit(f"Không thấy thư mục {DIST}/. Chạy `npm run build` trước.")

    files = {}
    for root, _, names in os.walk(DIST):
        for n in names:
            full = os.path.join(root, n)
            web = "/" + os.path.relpath(full, DIST).replace(os.sep, "/")
            files[web] = gzipped(full)

    if not files:
        sys.exit(f"{DIST}/ rỗng.")

    hashes = {p: hashlib.sha256(b).hexdigest() for p, b in files.items()}
    print(f"→ {len(files)} file trong {DIST}/")

    ver = api(f"{BASE}/sites/{SITE}/versions", {"config": hosting_config()})
    vname = ver["name"]

    pop = api(f"{BASE}/{vname}:populateFiles", {"files": hashes})
    need = pop.get("uploadRequiredHashes") or []
    upload_url = pop.get("uploadUrl")
    print(f"→ cần tải lên {len(need)}/{len(files)} file")

    by_hash = {}
    for p, h in hashes.items():
        by_hash.setdefault(h, p)

    for i, h in enumerate(need, 1):
        api(f"{upload_url}/{h}", raw=files[by_hash[h]], ctype="application/octet-stream")
        print(f"  [{i}/{len(need)}] {by_hash[h]}")

    api(f"{BASE}/{vname}?update_mask=status", {"status": "FINALIZED"}, method="PATCH")
    api(f"{BASE}/sites/{SITE}/releases?versionName={vname}", {})

    print(f"\n✓ Đã phát hành → https://{SITE}.web.app")


if __name__ == "__main__":
    main()
