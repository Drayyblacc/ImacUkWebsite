# IMAC UK Website

Static site for imacglobaluk.org. Plain HTML, CSS and JavaScript, no build step needed to host it.

## Files

1. `index.html` and 19 other pages, one per page of the current site, using the same page names so existing links keep working.
2. `assets/css/site.css` holds the shared styles. Some pages also have a short style block in their head for page specific layout.
3. `assets/js/site.js` runs the header menus, the scroll scenes (home hero, cross, 32 nations, seven lamps) and the scroll layer: section reveals, image reveals and parallax, the sticky header, the progress bar and number counters. Every page still shows its full content if JavaScript is off, and motion is switched off for visitors who ask for reduced motion.
4. `assets/js/lenis.min.js` is Lenis 1.1.13 (MIT licence), used for the smooth inertia scrolling.
5. `assets/img/` holds the illustrations used for portraits, book covers, flyers and the logo.
6. `.htaccess` gives clean URLs on Apache hosting (for example 20i), so `/who-we-are` serves `who-we-are.html`.

## Photos

The scene photos are free Unsplash stock images loaded from images.unsplash.com, for preview only. Swap them for real IMAC photos before launch: download each one into `assets/img/` and point the `src` at the local file.

## Before going live

1. Forms: the contact form and the newsletter form post to Formspree. Create the forms at formspree.io and replace `YOUR_CONTACT_FORM_ID` and `YOUR_NEWSLETTER_FORM_ID`.
2. Replace the text placeholders in square brackets, such as `[EVENT TITLE]` and `[YEAR]`.
3. Add the real social media links in the footer (currently `#`).
4. Add the IMAC logo and swap it into the header and footer.
5. Confirm the membership link (currently the Zeffy home page) and the Amazon book links.

## Hosting on Cloudflare Pages

1. The site is connected to Cloudflare Pages through its GitHub repository. Every push to the main branch goes live within about a minute.
2. Build settings: framework preset None, build command empty, output directory `/`.
3. Clean URLs work automatically on Cloudflare Pages, so `/who-we-are` serves `who-we-are.html`.
4. `_headers` sets caching and security headers. `.htaccess` is only used if the site is ever moved to Apache or cPanel hosting.
