"""Copies images from the old Hostinger site (or any full https address) into assets/img/legacy as compressed WebP.
Runs in GitHub Actions. Files that already exist are skipped."""
import io, os, sys, urllib.request
from PIL import Image, ImageFilter

BASE = "https://assets.zyrosite.com/iM8n7XyRyKS8W1W4/"
OUT = "assets/img/legacy"
os.makedirs(OUT, exist_ok=True)
failed = 0
for line in open("scripts/legacy-images.txt", encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    dest, src = line.split()
    path = os.path.join(OUT, dest)
    if os.path.exists(path):
        continue
    try:
        im = None
        for s in src.split("|"):
            url = s if s.startswith("http") else BASE + s
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/jpeg,image/png,*/*"})
                data = urllib.request.urlopen(req, timeout=60).read()
                im = Image.open(io.BytesIO(data)).convert("RGB")
                break
            except Exception as e:
                print("try failed", url, e)
        if im is None:
            raise RuntimeError("no source worked")
        # remove black bars that YouTube adds around vertical videos
        box = im.convert("L").point(lambda v: 255 if v > 24 else 0).getbbox()
        if box and (box[2] - box[0]) < im.width * 0.95:
            im = im.crop(box)
        if im.width > 1400:
            im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=40, threshold=4))
        im.save(path, "WEBP", quality=72, method=6)
        print("saved", dest, os.path.getsize(path))
    except Exception as e:
        failed += 1
        print("FAILED", dest, e)
sys.exit(1 if failed else 0)
