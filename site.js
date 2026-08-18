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
    sectionLabel: 'How the work is made',
    sections: [
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
    galleryLabel: 'The pair',
    galleryCopy: 'Move between the painted image and its constructed counterpart.',
    noteLabel: 'Installation note',
    note: 'The angle, distance, and focus of the light determine the scale and sharpness of the projected face. The work should be encountered—and documented—both as a physical construction and under its intended light.'
  },
  'Split Fields': {
    eyebrow: 'Divided color · joined likeness · unstable symmetry',
    statement: 'Split Fields uses color as a structural force. Warm and cool planes divide the face, but the portrait remains held together by the gaze, the dark contour, and small passages where one side leaks into the other. Each work is less a stable likeness than a negotiation between competing versions of the same person.',
    sectionLabel: 'Chromatic structure',
    sections: [
      {
        title: 'Divide',
        text: 'A central break establishes two distinct color climates within one face.'
      },
      {
        title: 'Temperature',
        text: 'Warm and cool passages carry mood as strongly as the drawn features.'
      },
      {
        title: 'Rejoin',
        text: 'Contour, gaze, and repeated marks pull the divided portrait back into a single presence.'
      }
    ],
    galleryLabel: 'Works in the series',
    galleryCopy: 'Three portraits testing how much division a face can hold without losing its identity.'
  },
  Inversions: {
    eyebrow: 'Turned image · displaced anatomy · interior pressure',
    statement: 'Inversions begins by turning the portrait away from its expected orientation. Eyes, mouths, hair, and surrounding marks are then allowed to reorganize into another kind of figure. The works hover between mask, body, and interior landscape; recognition arrives, breaks apart, and returns in a changed form.',
    sectionLabel: 'Formal structure',
    sections: [
      {
        title: 'Turn',
        text: 'Rotation interrupts the viewer’s first, habitual reading of the face.'
      },
      {
        title: 'Reconstruct',
        text: 'Facial features become independent shapes that can migrate, double, or exchange roles.'
      },
      {
        title: 'Pressure',
        text: 'Dense color and line make the portrait feel compressed from both inside and outside.'
      }
    ],
    galleryLabel: 'Published work',
    galleryCopy: 'The first published work from a larger group of turned and reconstructed heads.'
  },
  Witnesses: {
    eyebrow: 'Frontal address · vigilance · encounter',
    statement: 'Witnesses gathers figures whose gaze is the primary event. Their faces are exaggerated, guarded, comic, or severe, yet each insists on looking back. The viewer is not given a neutral subject to observe; the encounter remains reciprocal, and sometimes uncomfortable.',
    sectionLabel: 'Ways of looking',
    sections: [
      {
        title: 'Gaze',
        text: 'Eyes hold the composition and establish an immediate relationship with the viewer.'
      },
      {
        title: 'Distance',
        text: 'The close framing removes most context and makes looking itself the subject.'
      },
      {
        title: 'Character',
        text: 'Line, color, and distortion create presence without resolving the figure into biography.'
      }
    ],
    galleryLabel: 'Works in the series',
    galleryCopy: 'Portraits united by their insistence on returning the viewer’s attention.'
  }
};

const homepageSeries = [
  {
    name: 'Faces and Shadows',
    number: '01',
    line: 'One face becomes image, object, and projected double.'
  },
  {
    name: 'Split Fields',
    number: '02',
    line: 'Portraits held together across competing fields of color.'
  },
  {
    name: 'Inversions',
    number: '03',
    line: 'Faces turned until anatomy becomes an interior landscape.'
  },
  {
    name: 'Witnesses',
    number: '04',
    line: 'Figures whose gaze makes looking a reciprocal act.'
  }
];

const idForSeries = (series = '') => `series-${normalizeSeries(series).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

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
  const works = (await load()).filter(work => work.featured !== false);

  const configured = homepageSeries
    .map(series => ({ ...series, works: works.filter(work => normalizeSeries(work.series) === series.name) }))
    .filter(series => series.works.length);
  const configuredNames = new Set(configured.map(series => series.name));
  const additionalNames = [...new Set(works.map(work => normalizeSeries(work.series)).filter(name => name && !configuredNames.has(name)))];
  const groups = configured.concat(additionalNames.map((name, index) => ({
    name,
    number: String(configured.length + index + 1).padStart(2, '0'),
    line: 'A current group of related works.',
    works: works.filter(work => normalizeSeries(work.series) === name)
  })));
  const ungrouped = works.filter(work => !normalizeSeries(work.series));
  if (ungrouped.length) groups.push({
    name: 'Current Works',
    number: String(groups.length + 1).padStart(2, '0'),
    line: 'Individual works and studies.',
    works: ungrouped
  });

  let artworkIndex = 0;
  groups.forEach(group => {
    const story = seriesStories[group.name];
    const panel = document.createElement('section');
    const panelId = idForSeries(group.name);
    const previews = group.works.slice(0, 3).map((work, index) => `<span class="series-preview-card" style="--preview-index:${index}"><img src="${esc(work.image)}" alt="" loading="lazy" decoding="async"></span>`).join('');
    panel.className = 'series-panel snap-panel';
    panel.id = panelId;
    panel.dataset.seriesNumber = group.number;
    panel.setAttribute('aria-labelledby', `${panelId}-title`);
    panel.innerHTML = `<div class="series-home-copy"><span class="mono series-number">Series ${esc(group.number)} · ${group.works.length} ${group.works.length === 1 ? 'work' : 'works'}</span><h2 id="${panelId}-title">${esc(group.name)}</h2><p class="series-home-line">${esc(group.line)}</p>${story ? `<div class="series-home-statement">${paragraphs(story.statement)}</div>` : ''}<span class="mono series-continue">Continue into the series ↓</span></div><div class="series-preview" aria-hidden="true">${previews}</div>`;
    feed.append(panel);

    group.works.forEach((work, groupIndex) => {
      const workPanel = document.createElement('section');
      workPanel.className = 'work-panel snap-panel';
      const priority = artworkIndex === 0 ? 'eager' : 'lazy';
      const fetchPriority = artworkIndex === 0 ? ' fetchpriority="high"' : '';
      workPanel.innerHTML = `<a class="art-link" href="/work.html?id=${encodeURIComponent(work.slug)}"><figure><div class="art-frame"><img class="art-glow" data-src="${esc(work.image)}" alt="" aria-hidden="true" loading="lazy" decoding="async"><img class="art-image" src="${esc(work.image)}" alt="${esc(work.alt)}" loading="${priority}" decoding="async"${fetchPriority}></div><figcaption><span class="art-title">${esc(work.title)}</span><span class="art-meta mono"><span class="art-series">${esc(group.name)} · ${String(groupIndex + 1).padStart(2, '0')} / ${String(group.works.length).padStart(2, '0')}</span><span class="art-year">${esc(work.year)}</span><span>${esc(work.medium)}</span><span class="art-open">Open work ↗</span></span></figcaption></figure></a>`;
      feed.append(workPanel);
      setBacklight(workPanel.querySelector('.art-image'), workPanel.querySelector('.art-frame'));
      lazyGlow(workPanel, feed);
      artworkIndex++;
    });
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
  const sections = story.sections.map((step, index) => `<div class="process-step"><span class="mono">0${index + 1}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div>`).join('');
  const seriesWorks = related.map(item => `<a class="series-card${item.slug === work.slug ? ' current-work' : ''}" href="/work.html?id=${encodeURIComponent(item.slug)}"${item.slug === work.slug ? ' aria-current="page"' : ''}><span class="series-card-image"><img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy" decoding="async"></span><span class="series-card-copy"><strong>${esc(item.title)}</strong><span class="mono">${esc(item.medium)} · ${esc(item.year)}</span></span></a>`).join('');
  const note = story.note ? `<p class="installation-note"><span class="mono">${esc(story.noteLabel)}</span>${esc(story.note)}</p>` : '';

  return `<section class="series-story" aria-labelledby="series-story-title"><div class="series-intro"><div><span class="mono">Series study</span><h2 id="series-story-title">${esc(seriesName)}</h2><p class="series-eyebrow">${esc(story.eyebrow)}</p></div><div class="series-statement">${paragraphs(story.statement)}</div></div><div class="process-grid" aria-label="${esc(story.sectionLabel)}">${sections}</div><div class="series-pair"><div class="section-heading"><span class="mono">${esc(story.galleryLabel)}</span><p>${esc(story.galleryCopy)}</p></div><div class="series-grid">${seriesWorks}</div></div>${note}</section>`;
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
