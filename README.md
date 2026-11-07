# IMAC UK Website

The website of the International Ministerial Alliance of Churches UK, imacglobaluk.org. It is a static site written in plain HTML, CSS and JavaScript, with no framework and no build step, hosted on Cloudflare Pages.

## How updates go live

1. This repository is connected to Cloudflare Pages (project `imacukwebsite`). Every push to the main branch is live in about a minute.
2. Cloudflare build settings: framework preset None, build command empty, output directory `/`.
3. Always run `git pull` before pushing. The image workflow below can add commits on GitHub.

## Files

1. `index.html` plus 18 other pages, one for each page of the original site, using the same page names so old links keep working. `404.html` is the page not found screen.
2. `assets/css/site.css` holds the shared styles. Some pages carry a short style block in their head for page specific layout.
3. `assets/js/site.js` runs the header menus, the mobile menu, the scroll scenes on the home and about pages, smooth scrolling, reveal animations, the sticky header, counters, the back to top button and the YouTube video players. Every page still shows its full content with JavaScript switched off, and motion is reduced for visitors who ask for it in their device settings.
4. `assets/js/lenis.min.js` is Lenis 1.1.13 (MIT licence), used for smooth scrolling.
5. `assets/img/photos/` holds the IMAC photos and team portraits as WebP, each with a smaller copy ending in `sm` for phones.
6. `assets/img/legacy/` holds the event flyers, book covers and ordination photos taken from the original site.
7. `assets/img/` also holds the logo and the small illustrations.
8. `assets/docs/` holds the IMAC magazine and training manual PDFs.
9. `sitemap.xml` and `robots.txt` are for search engines.
10. `_headers` sets the security headers and caching. `_redirects` sends retired addresses (such as `/awards`) to the right page.

## Images from the original site

1. `scripts/legacy-images.txt` lists image addresses from the original site, each with the file name to save it as.
2. `.github/workflows/fetch-legacy-images.yml` runs `scripts/fetch_legacy_images.py` when that list changes. It downloads the images into `assets/img/legacy/` and commits them.
3. To add more, add lines to the list, push, then `git pull` once the workflow has finished.

## Editing content

1. Text lives directly in each page file. Open the page, change the text, commit and push.
2. Event flyers are on `upcoming-events.html` and the home page. To add one, put the image in `assets/img/legacy/` or `assets/img/photos/` and copy an existing flyer block.
3. New photos: export at about 1600 pixels wide as WebP, around 150 KB, plus an 800 pixel copy for phones.
4. CSS and JavaScript links carry a version number (`?v=`). Browsers cache those files for a year, so change the number whenever the file changes.
5. If you add an inline script, its hash must be added to the Content Security Policy in `_headers`, or browsers will block it.

## Security and search

1. `_headers` sets a strict Content Security Policy, HSTS, frame blocking and a locked down permissions policy.
2. Every page has its own title, description, canonical link, social sharing tags and structured data. The sitemap includes image entries.
3. Clean addresses are used, such as `/who-we-are`. To preview locally run `npx serve` in this folder rather than opening the files directly.

## Still to do

1. Point imacglobaluk.org at Cloudflare Pages. Copy the existing email records (MX, SPF, DKIM) first so email keeps working.
2. Submit `https://imacglobaluk.org/sitemap.xml` in Google Search Console once the domain is live.
3. Contact and newsletter forms are not on the site yet. Visitors get email and call buttons instead. To add forms, create them at formspree.io and send the form IDs to the developer. `_headers` already allows Formspree.
4. IMAC to approve the wording of the safeguarding statement.
5. Add social media links to the footer once the official accounts are confirmed.
