const load = () => fetch('/data/artworks.json').then(response => response.json()).then(data => data.artworks || []);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]));

const normalizeSeries = (value = '') => String(value).trim();
const paragraphs = (value = '') => esc(value)
  .split(/\n{2,}/)
  .filter(Boolean)
  .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
  .join('');

const seriesStories = {
  'Faces and Shadows': {
    eyebrow: 'Painted image · suspended drawing · projected shadow',
    statement: 'Faces and Shadows begins with a drawn or painted face and a second drawing made as a transparent filament construction. Suspended from the wall and lit from a deliberate angle, the construction throws another portrait onto the receiving surface. One origin produces two images that remain related but do not entirely agree. The light is not presentation around the work; it is one of its materials.',
    process: [
      {
        title: 'Image',
        text: 'A painted face establishes the first reading: direct, physical, and held on the surface.'
      },
      {
        title: 'Object',
        text: 'A second drawing is built by hand in transparent filament and suspended away from the wall.'
      },
      {
        title: 'Light',
        text: 'A precisely placed light completes the work by projecting a second, altered face.'
      }
    ],
    installation: 'The angle, distance, and focus of the light determine the scale and sharpness of the projected face. The work should be encountered—and documented—both as a physical construction and under its intended light.'
  }
};

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

function lazyGlow(panel, feed) {
  const glow = panel.querySelector('.art-glow');
  const reveal = () => {
    if (!glow.dataset.src || glow.src) return;
    glow.src = glow.dataset.src;
    glow.removeAttribute('data-src');
  };

  if (navigator.connection?.saveData) return;
  if (!('IntersectionObserver' in window)) {
    panel.querySelector('.art-image').addEventListener('load', reveal, { once: true });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    reveal();
    observer.disconnect();
  }, { root: feed, rootMargin: '125% 0px' });

  observer.observe(panel);
}

async function home() {
  const feed = document.querySelector('#work-feed');
  const works = await load();

  works.forEach((work, index) => {
    const panel = document.createElement('section');
    panel.className = 'work-panel snap-panel';
    const priority = index === 0 ? 'eager' : 'lazy';
    const fetchPriority = index === 0 ? ' fetchpriority="high"' : '';
    panel.innerHTML = `<a class="art-link" href="/work.html?id=${encodeURIComponent(work.slug)}"><figure><div class="art-frame"><img class="art-glow" data-src="${esc(work.image)}" alt="" aria-hidden="true" loading="lazy" decoding="async"><img class="art-image" src="${esc(work.image)}" alt="${esc(work.alt)}" loading="${priority}" decoding="async"${fetchPriority}></div><figcaption><span class="art-title">${esc(work.title)}</span><span class="art-meta mono"><span class="art-year">${esc(work.year)}</span><span>${esc(work.medium)}</span></span></figcaption></figure></a>`;
    feed.append(panel);
    setBacklight(panel.querySelector('.art-image'), panel.querySelector('.art-frame'));
    lazyGlow(panel, feed);
  });
}

function documentationItem(item) {
  const file = String(item.file || '');
  const label = item.label || 'Documentation';
  const extension = file.split('?')[0].split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension)) {
    return `<figure class="document-card"><a href="${esc(file)}" target="_blank" rel="noopener"><img src="${esc(file)}" alt="${esc(label)}" loading="lazy" decoding="async"></a><figcaption>${esc(label)}</figcaption></figure>`;
  }

  if (['mp4', 'webm', 'mov'].includes(extension)) {
    return `<figure class="document-card"><video controls preload="metadata" playsinline><source src="${esc(file)}"></video><figcaption>${esc(label)}</figcaption></figure>`;
  }

  return `<a class="document-link mono" href="${esc(file)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
}

function seriesStory(work, works) {
  const seriesName = normalizeSeries(work.series);
  const story = seriesStories[seriesName];
  if (!story) return '';

  const related = works.filter(item => normalizeSeries(item.series) === seriesName);
  const process = story.process.map((step, index) => `<div class="process-step"><span class="mono">0${index + 1}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div>`).join('');
  const pair = related.map(item => `<a class="series-card${item.slug === work.slug ? ' current-work' : ''}" href="/work.html?id=${encodeURIComponent(item.slug)}"${item.slug === work.slug ? ' aria-current="page"' : ''}><span class="series-card-image"><img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy" decoding="async"></span><span class="series-card-copy"><strong>${esc(item.title)}</strong><span class="mono">${esc(item.medium)} · ${esc(item.year)}</span></span></a>`).join('');

  return `<section class="series-story" aria-labelledby="series-story-title"><div class="series-intro"><div><span class="mono">Series study</span><h2 id="series-story-title">${esc(seriesName)}</h2><p class="series-eyebrow">${esc(story.eyebrow)}</p></div><div class="series-statement">${paragraphs(story.statement)}</div></div><div class="process-grid" aria-label="How the work is made">${process}</div><div class="series-pair"><div class="section-heading"><span class="mono">The pair</span><p>Move between the painted image and its constructed counterpart.</p></div><div class="series-grid">${pair}</div></div><p class="installation-note"><span class="mono">Installation note</span>${esc(story.installation)}</p></section>`;
}

async function detail() {
  const root = document.querySelector('#work-detail');
  const id = new URLSearchParams(location.search).get('id');
  const works = await load();
  const work = works.find(item => item.slug === id);

  if (!work) {
    root.innerHTML = '<p>Work not found. <a href="/">Return to the portfolio.</a>';
    return;
  }

  document.title = `${work.title} — Lauri Moyle`;
  const documents = (work.documentation || []).filter(item => item.file).map(documentationItem).join('');
  const individualStatement = work.statement ? `<div class="statement">${paragraphs(work.statement)}</div>` : (seriesStories[normalizeSeries(work.series)] ? '' : '<p class="muted">Statement and documentation forthcoming.</p>');
  root.innerHTML = `<article><div class="detail-image"><img src="${esc(work.image)}" alt="${esc(work.alt)}" decoding="async" fetchpriority="high"></div><div class="detail-copy"><span class="mono">${esc(work.medium)} · ${esc(work.year)}</span><h1>${esc(work.title)}</h1>${work.series ? `<p class="series">${esc(normalizeSeries(work.series))}</p>` : ''}${individualStatement}</div></article>${seriesStory(work, works)}${documents ? `<section class="documentation" aria-labelledby="documentation-title"><div class="section-heading"><h2 id="documentation-title">Documentation</h2><p>Process, installation, and supporting material.</p></div><div class="documentation-grid">${documents}</div></section>` : ''}`;
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
