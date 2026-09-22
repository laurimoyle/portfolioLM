const SITE = 'https://laurimoyle.art';
const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));

// Built from the live artworks.json so it stays in sync with Pages CMS edits
// without a build step. Served at /sitemap.xml via the rewrite in vercel.json.
export default async function handler(req, res) {
  try {
    const response = await fetch(`${SITE}/data/artworks.json`);
    if (!response.ok) throw new Error(`artworks.json ${response.status}`);
    const works = (await response.json()).artworks || [];
    const urls = [`${SITE}/`, `${SITE}/about.html`]
      .concat(works.filter(work => work.slug).map(work => `${SITE}/work.html?id=${encodeURIComponent(work.slug)}`));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch {
    return res.status(503).send('Sitemap temporarily unavailable');
  }
}
