/* Production CMS bridge con content-guard.
   Campi assenti/nulli/vuoti NON toccano i contenuti statici approvati:
   testi solo se non vuoti, foto solo dopo caricamento riuscito,
   video solo da URL media validi (errore → ripristina sorgente precedente). */
(async () => {
  const config = window.AbbraccioConfig;
  if (!config?.apiBase) return;
  const api = config.apiBase;
  const blank = v => typeof v !== 'string' || v.trim() === '';
  const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
  const VID_EXT = /\.(mp4|webm|mov|m4v)$/i;
  const safeURL = (value, extRe) => {
    if (blank(value)) return '';
    try {
      const u = new URL(value.trim(), location.href);
      const okProto = u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname));
      if (!okProto || !extRe.test(u.pathname)) return '';
      return u.href;
    } catch { return ''; }
  };
  try {
    const response = await fetch(api + '/api/public');
    if (!response.ok) throw Error('Contenuti non disponibili');
    const data = await response.json();
    const site = (Array.isArray(data.content) ? data.content : []).find(c => c && c.id === config.site);
    if (site && document.querySelector('.hero,.shop-hero')) {
      const title = document.querySelector('.hero h1,.shop-hero h1');
      if (title && !blank(site.title)) title.textContent = site.title.trim();
      const intro = document.querySelector('.hero .intro,.hero .lead,.hero .hero-intro,.shop-hero>div>p:not(.eyebrow)');
      if (intro && !blank(site.subtitle)) intro.textContent = site.subtitle.trim();
      const photo = safeURL(site.photo, IMG_EXT);
      if (photo) {
        const probe = new Image();
        probe.onload = () => {
          const style = document.createElement('style');
          style.textContent = '.hero-copy::before,.shop-hero::before{background-image:url(' + JSON.stringify(photo) + ')!important}@media(min-width:761px){body .lux-hero{background-image:url(' + JSON.stringify(photo) + ')!important}}';
          document.head.append(style);
        };
        probe.src = photo;
      }
      const video = safeURL(site.video, VID_EXT);
      if (video) {
        const targets = document.querySelectorAll('#heroVideo,.lux-frame.central video');
        const vids = targets.length ? targets : document.querySelectorAll('.hero video');
        vids.forEach(v => {
          const prev = v.currentSrc || v.src || v.dataset.src || '';
          v.addEventListener('error', () => { if (prev) { v.src = prev; v.load(); } }, { once: true });
          v.src = video; v.dataset.src = video; v.load(); v.play().catch(() => {});
        });
      }
    }
    // Blocchi liberi gestiti dal gestionale: data-cms="chiave" per i testi,
    // data-cms-img per le <img>, data-cms-bg per sfondi CSS, data-cms-video per <video>.
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const items = site && site.items && typeof site.items === 'object' ? site.items : {};
    // Esposti alle gallerie costruite in JS (app.js): sostituiscono i media di default.
    window.__cmsItems = items;
    window.__cmsMedia = (k, fallback) => {
      const it = items[k];
      if (!it || blank(String(it.v))) return fallback;
      const url = it.t === 'video' ? safeURL(it.v, VID_EXT) : it.t === 'foto' ? safeURL(it.v, IMG_EXT) : '';
      return url || fallback;
    };
    window.__cmsText = (k, fallback) => {
      const it = items[k];
      return it && it.t === 'testo' && !blank(String(it.v)) ? String(it.v).trim() : fallback;
    };
    Object.keys(items).forEach(k => {
      const it = items[k]; if (!it || blank(String(it.v))) return;
      if (it.t === 'testo') {
        document.querySelectorAll('[data-cms="' + k + '"]').forEach(el => { el.innerHTML = esc(String(it.v).trim()).replace(/\r?\n/g, '<br>'); });
      } else if (it.t === 'foto') {
        const url = safeURL(it.v, IMG_EXT); if (!url) return;
        const probe = new Image();
        probe.onload = () => {
          document.querySelectorAll('[data-cms-img="' + k + '"]').forEach(el => { el.src = url; });
          document.querySelectorAll('[data-cms-bg="' + k + '"]').forEach(el => { el.style.backgroundImage = 'url(' + url + ')'; });
        };
        probe.src = url;
      } else if (it.t === 'video') {
        const url = safeURL(it.v, VID_EXT); if (!url) return;
        document.querySelectorAll('[data-cms-video="' + k + '"]').forEach(v => {
          const prev = v.currentSrc || v.src || v.dataset.src || '';
          v.addEventListener('error', () => { if (prev) { v.src = prev; v.load(); } }, { once: true });
          v.src = url; v.dataset.src = url; v.load(); v.play().catch(() => {});
        });
      }
    });
    // Recensioni del sito (approvate nel gestionale). Sezione nascosta se vuota.
    const revBox = document.querySelector('[data-cms-reviews]');
    if (revBox) {
      const revs = (Array.isArray(data.reviews) ? data.reviews : []).filter(r => r && r.site === config.site && !blank(r.testo) && !blank(r.nome));
      if (revs.length) {
        const stars = n => '★★★★★☆☆☆☆☆'.slice(5 - Math.max(1, Math.min(5, Math.round(n) || 5)), 10 - Math.max(1, Math.min(5, Math.round(n) || 5)));
        revBox.innerHTML = revs.slice(0, 12).map(r =>
          '<article class="cms-review"><div class="cms-review-stars" aria-label="' + esc(String(r.rating)) + ' su 5">' + stars(r.rating) + '</div><p class="cms-review-text">' + esc(r.testo) + '</p><footer><b>' + esc(r.nome) + '</b>' + (r.ruolo ? '<span>' + esc(r.ruolo) + '</span>' : '') + '</footer></article>'
        ).join('');
        const sec0 = revBox.closest('section');
        if (sec0) sec0.hidden = false;
        const st = document.createElement('style');
        st.textContent = '.cms-review{background:#fff;border:1px solid #d7e6ee;border-radius:20px;padding:26px;display:flex;flex-direction:column;gap:12px;box-shadow:0 14px 34px -22px rgba(7,91,150,.28)}.cms-review-stars{color:#e8a33d;font-size:18px;letter-spacing:2px}.cms-review-text{margin:0;font:400 15px/1.65 Poppins,sans-serif;color:#33566d;font-style:italic}.cms-review footer{margin-top:auto;display:flex;flex-direction:column;gap:2px}.cms-review footer b{font:700 14px Poppins,sans-serif;color:#0e3a5a}.cms-review footer span{font:500 12px Poppins,sans-serif;color:#7fa0b3}[data-cms-reviews]{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1100px;margin:0 auto}@media(max-width:720px){[data-cms-reviews]{grid-template-columns:1fr}}';
        document.head.append(st);
      } else {
        const sec = revBox.closest('section');
        if (sec) sec.style.display = 'none';
      }
    }
    if (config.site === 'shop' && typeof products !== 'undefined') {
      const valid = p => p && p.id && !blank(p.name) && (p.active === undefined || p.active === true);
      const list = (Array.isArray(data.products) ? data.products : []).filter(valid);
      products.splice(0, products.length, ...list.map(p => ({ ...p, id: p.id, name: esc(p.name), category: esc(p.category), desc: esc(p.desc), image: esc(p.image) })));
      const category = document.getElementById('category');
      if (category) {
        category.replaceChildren();
        for (const name of ['Tutte le categorie', ...new Set(products.map(p => p.category))]) {
          const opt = document.createElement('option'); opt.textContent = name; category.append(opt);
        }
      }
      loadCart(); renderProducts();
      document.querySelectorAll('.demo-price,.demo-note').forEach(el => { if (el.classList.contains('demo-price')) el.textContent = 'Prezzo del catalogo' });
      window.simulateOrder = () => {
        document.getElementById('cartHeading').textContent = 'I dati per il tuo ordine.';
        cartContent.innerHTML = '<form id="liveOrderForm" class="live-order"><label>Nome e cognome<input name="customer" required maxlength="160" autocomplete="name"></label><label>Email<input name="email" required type="email" maxlength="160" autocomplete="email"></label><label>Telefono<input name="phone" required type="tel" maxlength="30" autocomplete="tel"></label><label>Indirizzo di consegna (o scrivi Ritiro al centro)<textarea name="address" required maxlength="500" autocomplete="street-address"></textarea></label><p>Totale articoli: <strong>' + money(totals().subtotal) + '</strong>' + (totals().deliveryKnown === false && shipping === 'consegna' ? ' + consegna da confermare con il centro' : ' · Totale: <strong>' + money(totals().total) + '</strong>') + '. Il server verifica prezzi e disponibilità prima di confermare.</p><p>Metodo: ' + ({ carta: 'Carta (da concordare con il centro)', bonifico: 'Bonifico', paypal: 'PayPal non ancora attivo' })[payment] + '</p><label><input name="terms" type="checkbox" required>Ho letto e accetto le condizioni di vendita/noleggio e l’informativa privacy.</label><p><a href="condizioni.html" target="_blank" rel="noopener">Leggi condizioni e privacy</a></p><button class="primary">' + (payment === 'bonifico' ? 'Conferma ordine con obbligo di pagamento' : 'Invia ordine') + '</button><p id="liveOrderError" role="alert"></p></form>';
        document.getElementById('liveOrderForm').onsubmit = async e => {
          e.preventDefault();
          const form = e.target, button = form.querySelector('button');
          button.disabled = true;
          try {
            if (window.AbbraccioCheckoutBlock) throw Error(window.AbbraccioCheckoutBlock);
            if (payment === 'paypal') throw Error('PayPal non ancora disponibile. Scegli Carta o Bonifico.');
            const fields = Object.fromEntries(new FormData(form));
            const res = await fetch(api + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, items: cart, delivery: shipping, method: payment }) });
            const order = await res.json();
            if (!res.ok) throw Error(order.error || 'Ordine non riuscito');
            if (order.checkout_url) {
              const url = new URL(order.checkout_url);
              if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw Error('Indirizzo pagamento non valido');
              location.assign(url.href);
            } else {
              cartContent.textContent = order.beneficiary ? 'Ordine ' + order.id + ' ricevuto. Bonifico a ' + order.beneficiary + ' · IBAN ' + order.iban + ' · Causale ' + order.reference + '. Pagamento in attesa di verifica.' : 'Ordine ' + String(order.id || '').slice(-6) + ' registrato. Il centro Abbraccio ti contatterà per conferma e modalità di pagamento.';
              cart = []; saveCart();
            }
          } catch (error) { document.getElementById('liveOrderError').textContent = error.message; button.disabled = false; }
        };
      };
      const style = document.createElement('style');
      style.textContent = '.live-order label{display:grid;gap:8px;margin:18px 0;font-size:16px}.live-order input,.live-order textarea{min-height:48px;border:1px solid #91b3c4;border-radius:8px;padding:12px;font:inherit}.live-order input[type=checkbox]{width:22px;min-height:22px}';
      document.head.append(style);
    }
  } catch (error) { console.error('Abbraccio CMS:', error.message); }
})();
