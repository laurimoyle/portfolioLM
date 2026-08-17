const load = () => fetch('/data/artworks.json').then(response => response.json()).then(data => data.artworks || []);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]));

function setBacklight(image, frame) {
  const measure = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let luminance = 0;
      let visible = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 24) continue;
        luminance += .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
        visible++;
      }

      const average = visible ? luminance / visible : 128;
      const darkness = Math.max(0, Math.min(1, 1 - average / 255));
      frame.style.setProperty('--glow-opacity', (.13 + darkness * .34).toFixed(3));
      frame.classList.toggle('is-dark', average < 118);
    } catch {
      frame.style.setProperty('--glow-opacity', '.25');
    }
  };

  image.complete ? measure() : image.addEventListener('load', measure, { once: true });
}

async function home() {
  const feed = document.querySelector('#work-feed');

  for (const work of await load()) {
    const panel = document.createElement('section');
    panel.className = 'work-panel snap-panel';
    panel.innerHTML = `<a class="art-link" href="/work.html?id=${encodeURIComponent(work.slug)}"><figure><div class="art-frame"><img class="art-glow" src="${esc(work.image)}" alt="" aria-hidden="true"><img class="art-image" src="${esc(work.image)}" alt="${esc(work.alt)}" loading="lazy"></div><figcaption><span class="art-title">${esc(work.title)}</span><span class="art-meta mono"><span class="art-year">${esc(work.year)}</span><span>${esc(work.medium)}</span></span></figcaption></figure></a>`;
    feed.append(panel);
    setBacklight(panel.querySelector('.art-image'), panel.querySelector('.art-frame'));
  }
}

async function detail() {
  const root = document.querySelector('#work-detail');
  const id = new URLSearchParams(location.search).get('id');
  const work = (await load()).find(item => item.slug === id);

  if (!work) {
    root.innerHTML = '<p>Work not found. <a href="/">Return to the portfolio.</a>';
    return;
  }

  document.title = `${work.title} — Lauri Moyle`;
  const documents = (work.documentation || []).map(item => `<li><a href="${esc(item.file)}" target="_blank" rel="noopener">${esc(item.label || 'Documentation')}</a></li>`).join('');
  root.innerHTML = `<article><div class="detail-image"><img src="${esc(work.image)}" alt="${esc(work.alt)}"></div><div class="detail-copy"><span class="mono">${esc(work.medium)} · ${esc(work.year)}</span><h1>${esc(work.title)}</h1>${work.series ? `<p class="series">${esc(work.series)}</p>` : ''}${work.statement ? `<div class="statement"><p>${esc(work.statement).replace(/\n\n/g, '</p><p>')}</p></div>` : '<p class="muted">Statement and documentation forthcoming.</p>'}${documents ? `<h2 class="mono">Documentation</h2><ul class="document-list">${documents}</ul>` : ''}</div></article>`;
}

function contact() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const status = document.querySelector('#form-status');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = 'Sending…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!response.ok) throw new Error();
      form.reset();
      status.textContent = 'Thank you. Your message has been sent.';
    } catch {
      status.innerHTML = 'The form could not send. Please email <a href="mailto:Lauri@claimworth.art">Lauri@claimworth.art</a>.';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'home') home();
  if (document.body.dataset.page === 'work') detail();
  contact();
});
