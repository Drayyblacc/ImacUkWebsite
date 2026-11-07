"""Copies images from the old Hostinger site into assets/img/legacy as compressed WebP.
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
        req = urllib.request.Request(BASE + src, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/jpeg,image/png,*/*"})
        data = urllib.request.urlopen(req, timeout=60).read()
        im = Image.open(io.BytesIO(data)).convert("RGB")
        if im.width > 1400:
            im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=40, threshold=4))
        im.save(path, "WEBP", quality=72, method=6)
        print("saved", dest, os.path.getsize(path))
    except Exception as e:
        failed += 1
        print("FAILED", dest, e)
sys.exit(1 if failed else 0)
