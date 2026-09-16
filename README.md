# Lauri Moyle portfolio

Edit artwork from a phone or laptop at https://app.pagescms.org by signing in with GitHub and choosing this repository.

The contact form uses Formspree's free form backend. Form submissions are delivered to the private recipient configured in Formspree; the public contact address on the About page remains Lauri@claimworth.art. Its form ID is stored in the Vercel project as FORMSPREE_FORM_ID. No Resend integration or sending-domain verification is required.

## Site notes

- **Domain:** production is https://laurimoyle.art (Vercel project `portfolio-lm`). Canonical URLs, the sitemap and Open Graph tags all use that domain.
- **Sitemap:** `/sitemap.xml` is generated on request by `api/sitemap.js` from the live `data/artworks.json`, so works added through Pages CMS appear automatically. The rewrite lives in `vercel.json`.
- **Images:** the site serves whatever is uploaded to `assets/uploads`. Pages CMS uploads files at full size, so resize before uploading — around 2400px on the long edge, as WebP, is plenty for any screen and keeps pages fast. Every image the site has today follows that rule.
- **Sharing preview:** `assets/og-image.jpg` (1200×630) is the image shown when a link is pasted into Instagram, iMessage, LinkedIn and similar. Regenerate it if the opening work changes.
- **404:** `404.html` is served by Vercel for any missing path.
