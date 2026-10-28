const SB_URL = 'https://nxdrxhbpbcrefyxmuvsi.supabase.co';
const SB_KEY = 'sb_publishable_bJzQ8eVZ-GyQN1AYFGNKpA_mLID3o5W';
let defaultsData = null;
let remoteContent = null;
Promise.all([
  fetch('admin-defaults.json').then(r => r.json()).catch(() => null),
  fetch(SB_URL + '/rest/v1/site_content?content_key=eq.vetrina_content&select=content_value', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
  }).then(r => r.json()).then(d => (d && d[0] && d[0].content_value) ? JSON.parse(d[0].content_value) : null).catch(() => null)
]).then(([d, remote]) => {
  defaultsData = d;
  remoteContent = remote;
  // Sincronizza la copia in localStorage: mai contenuti stantii come fallback
  if (remote) try { localStorage.setItem('vetrina-content', JSON.stringify(remote)); } catch (e) {}
  applyEdits();
});

// WhatsApp flottante + barra azioni mobile (presenti su tutte le pagine)
(function injectCta() {
  if (!document.getElementById('waFloat')) {
    const wa = document.createElement('a');
    wa.id = 'waFloat';
    wa.className = 'whatsapp-float';
    wa.href = 'https://wa.me/393514175117';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'WhatsApp');
    wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
    document.body.appendChild(wa);
  }
  if (!document.getElementById('ctaBar')) {
    const bar = document.createElement('div');
    bar.id = 'ctaBar';
    bar.className = 'mobile-cta-bar';
    bar.innerHTML = '<a id="ctaCall" href="tel:0601905242"><i class="fas fa-phone"></i>Chiama</a>' +
      '<a id="ctaWa" class="cta-wa" href="https://wa.me/393514175117" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i>WhatsApp</a>' +
      '<a class="cta-req" href="https://app.abbracciocuredomiciliari.it/richiesta-assistenza"><i class="fas fa-paper-plane"></i>Richiedi</a>';
    document.body.appendChild(bar);
  }
})();

function deepMerge(base, over) {
  const r = JSON.parse(JSON.stringify(base));
  if (!over || typeof over !== 'object') return r;
  for (const k of Object.keys(over)) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && r[k] && typeof r[k] === 'object') {
      r[k] = deepMerge(r[k], over[k]);
    } else {
      r[k] = over[k];
    }
  }
  return r;
}

let siteData = null;

// Rotazione ciclica delle immagini (hero, telemedicina, lavora con noi, shop)
function startRotator(img, srcs) {
  if (!img || !Array.isArray(srcs) || !srcs.length) return;
  const tag = srcs.join('|');
  if (img.dataset.rotating === tag) return;
  img.dataset.rotating = tag;
  img.src = srcs[0];
  if (srcs.length < 2) return;
  let i = 0;
  img.style.transition = 'opacity .55s ease';
  setInterval(() => {
    i = (i + 1) % srcs.length;
    const next = srcs[i];
    img.style.opacity = '0';
    setTimeout(() => { img.src = next; img.style.opacity = '1'; }, 560);
  }, 3000);
}

// Modale news: al click sulla card si apre il testo completo
let newsBoxEl = null;
function openNewsModal(n) {
  if (!n) return;
  if (!newsBoxEl) {
    newsBoxEl = document.createElement('div');
    newsBoxEl.id = 'newsModal';
    newsBoxEl.className = 'news-modal';
    newsBoxEl.innerHTML = '<div class="news-modal-card"><button type="button" class="news-modal-close" aria-label="Chiudi">&times;</button><img class="news-modal-img" alt=""><div class="news-modal-body"><span class="news-modal-cat"></span><h3></h3><small class="news-modal-date"></small><div class="news-modal-text"></div></div></div>';
    document.body.appendChild(newsBoxEl);
    newsBoxEl.addEventListener('click', e => {
      if (e.target === newsBoxEl || e.target.closest('.news-modal-close')) newsBoxEl.classList.remove('open');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && newsBoxEl) newsBoxEl.classList.remove('open'); });
  }
  const img = newsBoxEl.querySelector('.news-modal-img');
  if (n.image) { img.style.display = 'block'; img.src = n.image; }
  else { img.style.display = 'none'; img.removeAttribute('src'); }
  newsBoxEl.querySelector('.news-modal-cat').textContent = n.category || 'News';
  newsBoxEl.querySelector('h3').textContent = n.title || '';
  newsBoxEl.querySelector('.news-modal-date').textContent = n.date || '';
  newsBoxEl.querySelector('.news-modal-text').innerHTML = String(n.fullText || n.body || '').split(/\n+/).map(l => '<p>' + l + '</p>').join('');
  newsBoxEl.classList.add('open');
}

// Lightbox galleria: click su una finestra → sfoglia tutte le foto
let galBoxEl = null;
let galSrcs = [];
let galIdx = 0;
function galShow() {
  const img = galBoxEl.querySelector('.gal-img');
  img.src = galSrcs[galIdx];
  galBoxEl.querySelector('.gal-counter').textContent = (galIdx + 1) + ' / ' + galSrcs.length;
}
function galStep(d) { galIdx = (galIdx + d + galSrcs.length) % galSrcs.length; galShow(); }
function openGalleryModal(srcs, idx) {
  if (!srcs || !srcs.length) return;
  galSrcs = srcs;
  galIdx = Math.max(0, Math.min(idx || 0, srcs.length - 1));
  if (!galBoxEl) {
    galBoxEl = document.createElement('div');
    galBoxEl.id = 'galleryModal';
    galBoxEl.className = 'gal-modal';
    galBoxEl.innerHTML = '<button type="button" class="gal-close" aria-label="Chiudi">&times;</button>' +
      '<button type="button" class="gal-nav gal-prev" aria-label="Precedente">&#10094;</button>' +
      '<div class="gal-stage"><img class="gal-img" alt="Foto galleria Abbraccio"></div>' +
      '<button type="button" class="gal-nav gal-next" aria-label="Successiva">&#10095;</button>' +
      '<div class="gal-counter"></div>';
    document.body.appendChild(galBoxEl);
    galBoxEl.addEventListener('click', e => {
      if (e.target === galBoxEl || e.target.classList.contains('gal-stage') || e.target.closest('.gal-close')) { galBoxEl.classList.remove('open'); return; }
      if (e.target.closest('.gal-prev')) galStep(-1);
      else if (e.target.closest('.gal-next')) galStep(1);
    });
    document.addEventListener('keydown', e => {
      if (!galBoxEl || !galBoxEl.classList.contains('open')) return;
      if (e.key === 'Escape') galBoxEl.classList.remove('open');
      if (e.key === 'ArrowLeft') galStep(-1);
      if (e.key === 'ArrowRight') galStep(1);
    });
  }
  galShow();
  galBoxEl.classList.add('open');
}

document.addEventListener('click', e => {
  const card = e.target && e.target.closest ? e.target.closest('[data-news]') : null;
  if (!card || !siteData) return;
  const n = (siteData.news || [])[parseInt(card.dataset.news, 10)];
  openNewsModal(n);
});

// ─── Carosello news in home: una news alla volta, foto intera, rotazione auto ─
function startNewsCarousel(container, news) {
  if (!container || !news || !news.length) return;
  let idx = 0;
  const colors = ['#c9a227', '#1a2e5a', '#2a7a4e', '#8b5cf6', '#0e7490'];
  const esc = s => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  container.classList.add('news-carousel');
  container.innerHTML =
    '<button type="button" class="news-car-btn news-car-prev" aria-label="News precedente">&#10094;</button>' +
    '<div class="news-car-stage"><article class="blog-card news-car-card" data-news="0"></article></div>' +
    '<button type="button" class="news-car-btn news-car-next" aria-label="News successiva">&#10095;</button>' +
    '<div class="news-car-dots"></div>';

  const card = container.querySelector('.news-car-card');
  const dotsBox = container.querySelector('.news-car-dots');

  const renderDots = () => {
    dotsBox.innerHTML = news.map((_, i) =>
      `<button type="button" class="news-car-dot${i === idx ? ' active' : ''}" data-idx="${i}" aria-label="Vai alla news ${i + 1}"></button>`).join('');
  };

  const render = (i, dir) => {
    idx = (i + news.length) % news.length;
    const n = news[idx];
    card.style.opacity = '0';
    setTimeout(() => {
      card.dataset.news = idx;
      const color = colors[idx % colors.length];
      card.innerHTML =
        (n.image
          ? `<div class="news-car-img"><img src="${n.image}" alt="${esc(n.title)}" loading="lazy"></div>`
          : `<div class="blog-img" style="background:${color};"></div>`) +
        `<div class="blog-body"><span class="blog-cat">${esc(n.category) || 'News'}</span>` +
        `<h3>${esc(n.title)}</h3><small>${esc(n.date)}</small>` +
        `<p>${esc(n.body ? n.body.slice(0, 160) : '')}${n.body && n.body.length > 160 ? '…' : ''}</p>` +
        '<span class="news-more">Leggi tutto →</span></div>';
      card.style.opacity = '1';
      renderDots();
    }, dir === undefined ? 0 : 180);
  };

  const step = d => render(idx + d, d);
  container.querySelector('.news-car-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
  container.querySelector('.news-car-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
  dotsBox.addEventListener('click', e => {
    const dot = e.target.closest('.news-car-dot');
    if (dot) render(parseInt(dot.dataset.idx, 10), 0);
  });

  // Rotazione automatica ogni 6s — in pausa quando il mouse è sopra
  let timer = news.length > 1 ? setInterval(() => step(1), 6000) : null;
  container.addEventListener('mouseenter', () => { if (timer) { clearInterval(timer); timer = null; } });
  container.addEventListener('mouseleave', () => { if (!timer && news.length > 1) timer = setInterval(() => step(1), 6000); });

  render(0);
}

function applyEdits() {
  const saved = localStorage.getItem('vetrina-content');
  const source = remoteContent || (saved ? JSON.parse(saved) : null);
  if (!source && !defaultsData) return;
  try {
    const c = source ? deepMerge(defaultsData || {}, source) : defaultsData;
    siteData = c;
    const path = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
    const key = path.split('/').pop();

    // global
    const g = c.global || {};
    const h1 = document.querySelector('.hero h1');
    if (g.heroTitle && h1) h1.innerHTML = g.heroTitle;
    const heroP = document.querySelector('.hero p');
    if (g.heroSubtitle && heroP) heroP.innerHTML = g.heroSubtitle;
    const eyeb = document.querySelector('.hero .eyebrow');
    if (g.eyebrow && eyeb) eyeb.innerHTML = g.eyebrow;
    // Immagini rotanti: SOLO da Supabase fresco o dai defaults locali —
    // mai dal localStorage (copia potenzialmente stantia con vecchie locandine)
    const gi = (remoteContent && remoteContent.global) || (defaultsData && defaultsData.global) || {};
    const heroImg = document.querySelector('.hero-image-wrap img') || document.querySelector('.hero-image img');
    startRotator(heroImg, (gi.heroImages && gi.heroImages.length) ? gi.heroImages : (gi.heroImage ? [gi.heroImage] : []));
    const logo = document.querySelector('.logo img');
    if (g.logo && logo) logo.src = g.logo;
    if (g.phone) {
      document.querySelectorAll('.topbar .fa-phone').forEach(el => { el.parentNode.innerHTML = `<i class="fas fa-phone"></i> ${g.phone}`; });
      const heroBtn = document.querySelector('.hero-ctas .btn-primary');
      if (heroBtn) heroBtn.innerHTML = `<i class="fas fa-phone"></i> Chiama ora: ${g.phone}`;
      document.querySelectorAll('a[href^="tel:"]').forEach(a => a.href = 'tel:' + g.phone.replace(/\s/g,''));
    }
    const wa = document.querySelector('.topbar .fa-whatsapp');
    if (g.whatsapp && wa) wa.parentNode.innerHTML = `<i class="fab fa-whatsapp"></i> ${g.whatsapp}`;
    const email = document.querySelector('.footer .fa-envelope');
    const emailP = email && email.closest('p');
    if (g.email && email) email.parentNode.innerHTML = `<i class="fas fa-envelope"></i> ${g.email}`;
    if (g.email) document.querySelectorAll('a[href^="mailto:"]').forEach(a => { if (!a.classList.contains('email2-link')) a.href = 'mailto:' + g.email; });
    // Seconda email (es. gmail storica) mostrata accanto alla principale
    if (emailP) {
      let a2 = emailP.querySelector('a.email2-link');
      if (g.email2) {
        if (!a2) {
          a2 = document.createElement('a');
          a2.className = 'email2-link';
          emailP.appendChild(a2);
        }
        a2.href = 'mailto:' + g.email2;
        a2.innerHTML = `<i class="fas fa-envelope"></i> ${g.email2}`;
      } else if (a2) a2.remove();
    }
    const addr = document.querySelector('.footer .fa-map-marker-alt');
    if (g.address && addr) addr.parentNode.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${g.address}`;
    const waNum = (g.whatsappNumber || '').replace(/\D/g, '');
    if (waNum) document.querySelectorAll('a[href*="wa.me/"]').forEach(a => a.href = 'https://wa.me/' + waNum);
    if (g.address) {
      const map = document.getElementById('sedeMap');
      if (map) map.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(g.address) + '&z=14&output=embed';
      const sa = document.getElementById('sedeAddr');
      if (sa) sa.textContent = g.address;
      const addrLink = document.querySelector('.footer-contacts a[href*="maps.google"]');
      if (addrLink) addrLink.href = 'https://maps.google.com/?q=' + encodeURIComponent(g.address);
    }
    const jobsImg = document.getElementById('jobsImage');
    startRotator(jobsImg, (gi.jobsImages && gi.jobsImages.length) ? gi.jobsImages : (gi.jobsImage ? [gi.jobsImage] : []));
    const shopImg = document.getElementById('shopImage');
    startRotator(shopImg, (gi.shopImages && gi.shopImages.length) ? gi.shopImages : (gi.shopImage ? [gi.shopImage] : []));
    const teleImg = document.querySelector('.tele-img img') || document.getElementById('teleImage');
    startRotator(teleImg, (gi.telemedicinaImages && gi.telemedicinaImages.length) ? gi.telemedicinaImages : (gi.telemedicinaImage ? [gi.telemedicinaImage] : []));
    const intermImg = document.getElementById('intermImage');
    startRotator(intermImg, (gi.intermediazioneImages && gi.intermediazioneImages.length) ? gi.intermediazioneImages : (gi.intermediazioneImage ? [gi.intermediazioneImage] : []));

    // pages
    const p = (c.pages || {})[key];
    if (p) {
      const h1el = document.querySelector('section.service-hero h1');
      if (h1el && p.h1) h1el.innerHTML = p.h1;
      const lead = document.querySelector('section.service-hero .lead');
      if (lead && p.lead) lead.innerHTML = p.lead;
      const txt = document.querySelector('section.service-hero .detail-text p:not(.lead)');
      if (txt && p.text) txt.innerHTML = p.text;
      const img = document.querySelector('section.service-hero .detail-image img');
      if (img && p.image) img.src = p.image;
      const actTitle = document.querySelector('section.service-activities h2');
      if (actTitle && p.activitiesTitle) actTitle.textContent = p.activitiesTitle;
      const ul = document.querySelector('section.service-activities .activities-list');
      if (ul && p.activities && p.activities.length) {
        ul.innerHTML = p.activities.map(a => `<li>${a}</li>`).join('');
      }
    }

    // overview pages
    if (key === 'servizi') {
      const sh = document.querySelector('#tutti-i-servizi .section-header h2');
      const sp = document.querySelector('#tutti-i-servizi .section-header p');
      const se = document.querySelector('#tutti-i-servizi .section-header .eyebrow');
      const data = c.pages && c.pages.servizi ? c.pages.servizi : {};
      if (sh && data.h2) sh.innerHTML = data.h2;
      if (sp && data.subtitle) sp.innerHTML = data.subtitle;
      if (se && data.eyebrow) se.innerHTML = data.eyebrow;
    }
    if (key === 'esami-strumentali') {
      const sh = document.querySelector('#tutti-gli-esami .section-header h2');
      const sp = document.querySelector('#tutti-gli-esami .section-header p');
      const se = document.querySelector('#tutti-gli-esami .section-header .eyebrow');
      const data = c.pages && c.pages['esami-strumentali'] ? c.pages['esami-strumentali'] : {};
      if (sh && data.h2) sh.innerHTML = data.h2;
      if (sp && data.subtitle) sp.innerHTML = data.subtitle;
      if (se && data.eyebrow) se.innerHTML = data.eyebrow;
    }

    // foto card servizi/esami sincronizzate con le immagini scelte nell'admin
    document.querySelectorAll('.service-thumb[data-page], .service-item[data-page]').forEach(el => {
      const pg = (c.pages || {})[el.getAttribute('data-page')];
      const img = el.querySelector('.thumb-media img');
      if (pg && pg.image && img) img.src = pg.image;
    });

    // news
    if (c.news && c.news.length) {
      const list = document.getElementById('newsList');
      if (list) {
        list.innerHTML = c.news.map((n, i) => `<div class="news-card" data-news="${i}">${n.image ? `<div class="news-img" style="background-image:url('${n.image}')"></div>` : ''}<h3>${n.title || ''}</h3><small>${n.date || ''} ${n.category ? '- '+n.category : ''}</small><p>${n.body || ''}</p><span class="news-more">Leggi tutto →</span></div>`).join('');
      }
      const blog = document.querySelector('.blog-grid');
      if (blog) {
        startNewsCarousel(blog, c.news);
        let allLink = blog.parentElement && blog.parentElement.querySelector('.news-all-link');
        if (!allLink && blog.parentElement) {
          allLink = document.createElement('div');
          allLink.className = 'news-all-link';
          allLink.innerHTML = '<a href="news.html" class="btn btn-outline"><i class="fas fa-newspaper"></i> Vedi tutte le news</a>';
          blog.after(allLink);
        }
      }
    }

    // gallery
    if (c.gallery && c.gallery.length && document.getElementById('galleryGrid')) {
      const grid = document.getElementById('galleryGrid');
      grid.innerHTML = '';
      grid.classList.add('gallery-duo');
      const srcs = c.gallery.map(name => /^(data:|https?:)/.test(name) ? name : 'images/' + name);
      // 2 finestre che ruotano tutte le foto della galleria, sfalsate tra loro
      const tiles = srcs.length > 1 ? 2 : 1;
      for (let k = 0; k < tiles; k++) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        const img = document.createElement('img');
        img.alt = 'Abbraccio Cure Domiciliari';
        img.loading = 'lazy';
        div.appendChild(img);
        grid.appendChild(div);
        startRotator(img, srcs.slice(k).concat(srcs.slice(0, k)));
        div.addEventListener('click', () => {
          const idx = srcs.indexOf(img.getAttribute('src'));
          openGalleryModal(srcs, idx >= 0 ? idx : 0);
        });
      }
    }

    // modifiche libere (admin → Modifica libera): valgono per qualsiasi elemento
    const pageFile = location.pathname.split('/').pop() || 'index.html';
    const ov = (c.overrides || {})[pageFile];
    if (ov) ov.forEach(o => {
      try {
        const el = document.querySelector(o.sel);
        if (!el) return;
        if (o.type === 'src') el.src = o.value; else el.innerHTML = o.value;
      } catch (e) {}
    });
  } catch (err) {}
}
applyEdits();

// ===== Recensioni pubbliche (approvate dall'admin) =====
(function initReviews() {
  const list = document.getElementById('reviewsList');
  if (!list) return;
  const form = document.getElementById('reviewForm');
  const openBtn = document.getElementById('reviewOpenBtn');
  const msg = document.getElementById('reviewMsg');
  const starsBox = document.getElementById('reviewStars');
  let rating = 5;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function starRow(n) {
    let out = '';
    for (let i = 0; i < 5; i++) out += i < n ? '★' : '<span style="opacity:.25">★</span>';
    return out;
  }
  function paintStars() {
    if (!starsBox) return;
    starsBox.querySelectorAll('i').forEach((s, i) => { s.style.opacity = i < rating ? '1' : '.25'; });
  }

  fetch(SB_URL + '/rest/v1/reviews?status=eq.approved&order=created_at.desc&limit=12&select=reviewer_name,location,rating,review_text', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
  }).then(r => r.ok ? r.json() : []).then(rows => {
    if (!rows || !rows.length) {
      list.innerHTML = '<div class="reviews-empty">Nessuna recensione ancora: racconta tu per primo la tua esperienza.</div>';
      return;
    }
    list.innerHTML = rows.map(r =>
      `<div class="review-card"><div class="review-stars">${starRow(r.rating)}</div><h4>${esc(r.reviewer_name)}${r.location ? ' — ' + esc(r.location) : ''}</h4><p>${esc(r.review_text)}</p></div>`
    ).join('');
  }).catch(() => { list.innerHTML = ''; });

  if (openBtn && form) openBtn.addEventListener('click', () => form.classList.toggle('hidden'));

  // ===== QR recensione: condivisione via WhatsApp / Email / download =====
  const shareBox = document.getElementById('reviewShare');
  const qrBtn = document.getElementById('reviewQrBtn');
  const qrImg = document.getElementById('reviewQrImg');
  const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJXxB42PRhLxMRBtzjoDcNbhA';
  const pageBase = location.origin + (location.pathname.endsWith('/') ? location.pathname + 'index.html' : location.pathname);
  // Link/QR unico: punta al modulo del sito, che salva la recensione e propone la pubblicazione su Google
  const reviewUrl = pageBase + '?recensione=1#recensioni';
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=' + encodeURIComponent(reviewUrl);
  const shareText = '⭐ Lascia una recensione ad Abbraccio Cure Domiciliari!\nInquadra il QR code oppure apri questo link:\n' + reviewUrl
    + '\n\nLa recensione verrà pubblicata sul sito e ti sarà proposta anche la pubblicazione su Google.';

  if (qrBtn && shareBox) {
    let qrLoaded = false;
    qrBtn.addEventListener('click', () => {
      shareBox.classList.toggle('hidden');
      if (!qrLoaded && qrImg) { qrImg.src = qrUrl; qrLoaded = true; }
    });
  }
  const waShareBtn = document.getElementById('reviewShareWa');
  if (waShareBtn) waShareBtn.addEventListener('click', async () => {
    // Su mobile prova ad allegare l'immagine QR vera e propria; altrimenti testo + link
    try {
      const resp = await fetch(qrUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'qr-recensione-abbraccio.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, title: 'QR Recensione Abbraccio' });
        return;
      }
    } catch (e) { /* fallback wa.me sotto */ }
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
  });
  const mailLink = document.getElementById('reviewShareMail');
  const qrDownload = document.getElementById('reviewQrDownload');
  if (mailLink) mailLink.href = 'mailto:?subject=' + encodeURIComponent('Lascia una recensione ad Abbraccio Cure Domiciliari')
    + '&body=' + encodeURIComponent(shareText + '\n\nQR code da allegare o stampare: ' + qrUrl);
  if (qrDownload) qrDownload.href = qrUrl;

  // Apertura diretta del modulo quando si arriva dal QR / link (?recensione=1 o #scrivi-recensione)
  if (form && (new URLSearchParams(location.search).get('recensione') === '1' || location.hash === '#scrivi-recensione')) {
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (starsBox) {
    starsBox.querySelectorAll('i').forEach((s, i) => s.addEventListener('click', () => { rating = i + 1; paintStars(); }));
    paintStars();
  }
  // Copia il testo negli appunti: prova l'API clipboard, altrimenti execCommand.
  function copiaTesto(t) {
    const legacy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = t;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return Promise.resolve(!!ok);
      } catch (e) { return Promise.resolve(false); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(t).then(() => true, legacy);
      }
      return legacy();
    } catch (e) { return legacy(); }
  }

  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = document.getElementById('reviewNome').value.trim();
    const zona = document.getElementById('reviewZona').value.trim();
    const testo = document.getElementById('reviewTesto').value.trim();
    function fail(t) { msg.textContent = t; msg.style.color = '#b42318'; }
    if (nome.length < 2 || zona.length < 2) return fail('Inserisci nome e zona (almeno 2 caratteri).');
    if (testo.length < 10) return fail('La recensione deve contenere almeno 10 caratteri.');
    // La copia va avviata ORA, mentre il gesto utente e' ancora attivo:
    // dopo il fetch l'attivazione scade e la writeText puo' essere negata.
    const copiaPromise = copiaTesto(testo);
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    msg.textContent = 'Invio in corso...'; msg.style.color = 'var(--text-light)';
    fetch(SB_URL + '/rest/v1/reviews', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ reviewer_name: nome, location: zona, rating: rating, review_text: testo, status: 'pending' })
    }).then(async r => {
      if (!r.ok) {
        let detail = '';
        try { detail = (await r.json()).message || ''; } catch (_) {}
        console.error('[recensioni] invio fallito:', r.status, detail);
        throw new Error('insert failed');
      }
      msg.textContent = 'Grazie! La recensione sarà visibile dopo l\'approvazione.';
      msg.style.color = 'var(--green)';
      // Pubblica anche su Google: Google non accetta testo precompilato nel link,
      // quindi il testo e' stato copiato negli appunti al click di invio e resta
      // comunque visibile nel prompt come backup per la copia manuale.
      const testoCopiato = await copiaPromise;
      const prompt = document.getElementById('reviewGooglePrompt');
      if (prompt) {
        const box = document.getElementById('reviewGoogleTesto');
        if (box) box.value = testo;
        const p = prompt.querySelector('p');
        if (p) p.innerHTML = testoCopiato
          ? '<strong>Grazie per la tua recensione!</strong><br>La pagina di Google si è aperta in una nuova scheda: il testo della recensione è già stato copiato, basta incollarlo lì. Se la scheda non si è aperta, usa il pulsante qui sotto.'
          : '<strong>Grazie per la tua recensione!</strong><br>La pagina di Google si è aperta in una nuova scheda: seleziona e copia il testo qui sotto e incollalo lì, poi conferma su Google.';
        prompt.classList.remove('hidden');
        prompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener');
      form.reset(); rating = 5; paintStars();
    }).catch(() => {
      fail('Errore durante l\'invio. Riprova più tardi.');
    }).finally(() => {
      if (submitBtn) submitBtn.disabled = false;
    });
  });
})();
// ─── Mappa "Operatori attivi" in home: rete reale (oro) + copertura (turchese) ─
(function opsMap() {
  const btn = document.getElementById('opsBtn');
  const wrap = document.getElementById('opsWrap');
  if (!btn || !wrap) return;

  let initialized = false;
  let opsMapObj = null;
  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  const init = () => {
    const map = opsMapObj = L.map('opsMap', {
      zoomControl: true, scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    map.fitBounds([[36.3, 6.4], [47.2, 18.9]], { padding: [14, 14] });

    // Punti illustrativi: densità della rete (turchese)
    const clusters = [
      [45.3, 7.9, 9, .5], [45.6, 9.7, 13, .55], [46.1, 11.1, 5, .4], [45.6, 11.9, 9, .5],
      [46.1, 13.1, 5, .4], [44.4, 8.9, 4, .3], [44.5, 10.8, 11, .5],
      [43.5, 11.1, 9, .5], [43.0, 12.5, 4, .3], [43.4, 13.2, 6, .35],
      [42.3, 13.8, 6, .35], [41.7, 14.6, 4, .3],
      [40.9, 14.7, 8, .4], [41.1, 16.5, 9, .5], [40.4, 16.0, 4, .35], [39.1, 16.6, 6, .5],
      [37.6, 14.0, 8, .5], [40.0, 9.0, 6, .5],
    ];
    let n = 0;
    const rand = seed => { const x = Math.sin(seed * 9973) * 43758.5453; return x - Math.floor(x); };
    clusters.forEach(([lat, lng, count, r]) => {
      for (let i = 0; i < count; i++) {
        n++;
        const a = rand(n * 7.13) * Math.PI * 2;
        const d = Math.sqrt(rand(n * 3.71)) * r;
        L.circleMarker([lat + Math.cos(a) * d, lng + Math.sin(a) * d], {
          radius: 4, color: '#ffffff', weight: 1.2,
          fillColor: '#0e7490', fillOpacity: .9,
        }).addTo(map);
      }
    });

    // Sede Roma
    L.circleMarker([41.9028, 12.4964], {
      radius: 9, color: '#fff', weight: 2.5, fillColor: '#e8c46a', fillOpacity: .9,
    }).bindTooltip('Sede Abbraccio - Roma', { direction: 'top' }).addTo(map);

    // Professionisti reali dal gestionale (oro) — posizione sfalsata ~1-2 km per privacy
    fetch('https://api.abbracciocuredomiciliari.it/api/albo/mappa')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !Array.isArray(d.marker)) return;
        d.marker.forEach(m => {
          L.circleMarker([m.lat, m.lng], {
            radius: 6, color: '#ffffff', weight: 1.6,
            fillColor: '#c9a227', fillOpacity: 1,
          }).bindTooltip(m.cat || 'Professionista', { direction: 'top' }).addTo(map);
        });
        // niente conteggio pubblico finché la rete non è più numerosa
      })
      .catch(() => {});
  };

  btn.addEventListener('click', () => {
    const opening = wrap.hidden;
    wrap.hidden = !opening;
    btn.innerHTML = opening
      ? '<i class="fas fa-eye-slash"></i> Nascondi operatori'
      : '<i class="fas fa-user-nurse"></i> Vedi operatori attivi';
    if (opening) {
      if (!initialized) {
        initialized = true;
        loadLeaflet().then(init).catch(() => {
          wrap.hidden = true;
          btn.innerHTML = '<i class="fas fa-user-nurse"></i> Vedi operatori attivi';
        });
      } else if (opsMapObj) {
        // la mappa in un div nascosto va ridisegnata quando torna visibile
        setTimeout(() => opsMapObj.invalidateSize(), 60);
      }
    }
  });
})();

// ─── Barra mobile fissa: Chiama / WhatsApp / Preventivo ─────────────────────
(function mobileCtaBar() {
  if (/admin\.html|app\.html|lavora-con-noi\.html/.test(location.pathname)) return;
  if (document.querySelector('.mobile-cta-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'mobile-cta-bar';
  bar.innerHTML =
    '<a href="tel:0601905242" aria-label="Chiama Abbraccio"><i class="fas fa-phone"></i>Chiama</a>' +
    '<a class="cta-wa" href="https://wa.me/393514175117" target="_blank" rel="noopener" aria-label="Scrivici su WhatsApp"><i class="fab fa-whatsapp"></i>WhatsApp</a>' +
    '<a class="cta-req" href="https://app.abbracciocuredomiciliari.it/preventivo" target="_blank" rel="noopener" aria-label="Calcola il tuo preventivo"><i class="fas fa-calculator"></i>Preventivo</a>';
  document.body.appendChild(bar);
  document.body.classList.add('has-cta-bar');
})();
