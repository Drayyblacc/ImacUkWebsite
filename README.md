# IMAC UK Website

Static site for imacglobaluk.org. Plain HTML, CSS and JavaScript, hosted on Cloudflare Pages.

## Files

1. `index.html` and 19 other pages, one per page of the current site, with the same page names so existing links keep working. `404.html` is the not found page.
2. `assets/css/site.css` holds the shared styles. Some pages also have a short style block in their head for page specific layout.
3. `assets/js/site.js` runs the header menus, the scroll scenes (home hero, cross, 32 nations, seven lamps), the scroll layer (smooth scrolling, reveals, image parallax, sticky header, progress bar, counters) and the forms. Every page still shows its full content if JavaScript is off, and motion is switched off for visitors who ask for reduced motion.
4. `assets/js/lenis.min.js` is Lenis 1.1.13 (MIT licence), used for the smooth scrolling.
5. `assets/img/` holds the illustrations used for portraits, book covers, flyers and the logo.
6. `sitemap.xml` and `robots.txt` for search engines. Submit the sitemap in Google Search Console once the domain points here.
7. `_headers` and `_redirects` are Cloudflare Pages settings. `.htaccess` is only used if the site ever moves to Apache or cPanel hosting.

## Search engine setup

1. Every page has its own title, description, canonical link, social sharing tags and structured data (organisation details on the home page, breadcrumbs on the others).
2. Links use clean addresses such as `/who-we-are`. To preview locally run `npx serve` in this folder rather than opening the files directly.

## Photos and speed

1. The scene photos are free Unsplash stock images for preview. Each one loads at the right size for the screen (480 to 1440 pixels wide, WebP or AVIF where the browser supports it) and only when it scrolls near view.
2. Before launch, replace them with real IMAC photos. Export each at 1600 pixels wide as WebP, around 150 KB, put it in `assets/img/`, and point the `src` at it.
3. CSS and JavaScript links carry a version number, so browsers cache them for a year but always fetch the new file after a change.

## Before going live

1. Forms: the contact and newsletter forms post to Formspree. Create the forms at formspree.io and replace `YOUR_CONTACT_FORM_ID` and `YOUR_NEWSLETTER_FORM_ID`. Until then the forms show a message asking people to email instead.
2. Replace the text placeholders in square brackets, such as `[EVENT TITLE]` and `[YEAR]`.
3. Add the real social media links in the footer (currently `#`).
4. Add the IMAC logo and swap it into the header and footer.
5. Confirm the membership link (currently the Zeffy home page) and the Amazon book links.

## Hosting on Cloudflare Pages

1. The GitHub repository is connected to Cloudflare Pages. Every push to the main branch goes live within about a minute.
2. Build settings: framework preset None, build command empty, output directory `/`.
3. When moving the domain, copy the existing email (MX, SPF, DKIM) records first so email keeps working.
