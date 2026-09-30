// ─── Shop Abbraccio — catalogo, carrello, checkout, richieste noleggio/apnea ───
const SHOP_API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:4000/api/shop'
  : 'https://api.abbracciocuredomiciliari.it/api/shop';
const SHOP_IMG = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:4000'
  : 'https://api.abbracciocuredomiciliari.it';

let products = [];
let cart = JSON.parse(localStorage.getItem('shop-cart') || '[]');
let shopConfig = { paypalLink: '', iban: '', noteCheckout: '' };

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => `€${Number(n || 0).toFixed(2)}`;
const imgUrl = src => src?.startsWith('http') ? src : SHOP_IMG + src;

const CAT_LABELS = { vendita: 'Presidi in vendita', noleggio: 'Noleggio apparecchiature', apnea: 'Esami apnea del sonno' };

// ─── Init ────────────────────────────────────────────────────────────────────
async function initShop() {
  renderCartBadge();
  try {
    const [prods, cfg] = await Promise.all([
      fetch(`${SHOP_API}/products`).then(r => r.ok ? r.json() : []),
      fetch(`${SHOP_API}/config`).then(r => r.ok ? r.json() : {}),
    ]);
    products = Array.isArray(prods) ? prods : [];
    shopConfig = cfg || shopConfig;
  } catch (e) {
    console.warn('Shop API non raggiungibile:', e);
    $('#shopGrid').innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:40px;">Shop momentaneamente non disponibile. Riprova tra poco.</p>';
    return;
  }
  renderProducts('vendita');
  bindShopEvents();
}

// ─── Tab categorie ───────────────────────────────────────────────────────────
function bindShopEvents() {
  document.querySelectorAll('.shop-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.cat);
    });
  });
  $('#cartBtn').addEventListener('click', openCart);
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAllModals();
  });
}

// ─── Render catalogo ─────────────────────────────────────────────────────────
function renderProducts(cat) {
  const grid = $('#shopGrid');
  const list = products.filter(p => p.categoria === cat);
  if (!list.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:40px;">Nessun prodotto in questa sezione al momento.</p>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const img = p.immagini?.[0] ? `<img src="${imgUrl(p.immagini[0])}" alt="${esc(p.nome)}" loading="lazy">` : '<div class="shop-noimg"><i class="fas fa-box-open"></i></div>';
    const stars = p.rating ? `<span class="shop-stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span> <small>(${p.reviewsCount})</small>` : '<small class="shop-norev">Nessuna recensione</small>';
    let price = '';
    if (p.categoria === 'vendita') price = `<div class="shop-price">${eur(p.prezzo)}</div>`;
    else if (p.categoria === 'noleggio') {
      const n = p.prezzoNoleggio || {};
      const parts = [n.giorno && `${eur(n.giorno)}/giorno`, n.settimana && `${eur(n.settimana)}/sett`, n.mese && `${eur(n.mese)}/mese`].filter(Boolean);
      price = `<div class="shop-price">${parts.join(' · ') || 'Su preventivo'}</div>`;
    } else price = `<div class="shop-price">${p.prezzo ? eur(p.prezzo) : 'Su richiesta'}</div>`;
    const btn = p.categoria === 'vendita'
      ? `<button class="btn btn-primary shop-btn" data-add="${p._id}" ${p.disponibile ? '' : 'disabled'}><i class="fas fa-cart-plus"></i> ${p.disponibile ? 'Aggiungi' : 'Non disponibile'}</button>`
      : p.categoria === 'noleggio'
        ? `<button class="btn btn-outline shop-btn" data-rent="${p._id}" ${p.disponibile ? '' : 'disabled'}><i class="fas fa-handshake"></i> ${p.disponibile ? 'Richiedi noleggio' : 'Non disponibile'}</button>`
        : `<button class="btn btn-outline shop-btn" data-apnea="${p._id}"><i class="fas fa-calendar-check"></i> Prenota esame</button>`;
    return `<div class="shop-card">
      <div class="shop-card-img" data-view="${p._id}">${img}</div>
      <div class="shop-card-body">
        <h3>${esc(p.nome)}</h3>
        <div class="shop-rating">${stars}</div>
        ${price}
        <div class="shop-card-actions">
          <button class="btn-link" data-view="${p._id}">Dettagli</button>
          ${btn}
        </div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
  grid.querySelectorAll('[data-view]').forEach(b => b.onclick = () => openProduct(b.dataset.view));
  grid.querySelectorAll('[data-rent]').forEach(b => b.onclick = () => openRequest('noleggio', b.dataset.rent));
  grid.querySelectorAll('[data-apnea]').forEach(b => b.onclick = () => openRequest('apnea', b.dataset.apnea));
}

// ─── Carrello ────────────────────────────────────────────────────────────────
function saveCart() { localStorage.setItem('shop-cart', JSON.stringify(cart)); renderCartBadge(); }
function renderCartBadge() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = n;
  $('#cartBtn').style.display = 'inline-flex';
}
function addToCart(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  const ex = cart.find(i => i.productId === id);
  if (ex) ex.qty = Math.min(50, ex.qty + 1); else cart.push({ productId: id, nome: p.nome, prezzo: p.prezzo || 0, qty: 1 });
  saveCart(); openCart();
}
function cartTotal() { return cart.reduce((s, i) => s + i.prezzo * i.qty, 0); }

function openCart() {
  const items = cart.map(i => `<div class="cart-row">
      <span class="cart-nome">${esc(i.nome)}</span>
      <span class="cart-qty"><button data-dec="${i.productId}">−</button> ${i.qty} <button data-inc="${i.productId}">+</button></span>
      <span class="cart-prezzo">${eur(i.prezzo * i.qty)}</span>
      <button class="cart-del" data-del="${i.productId}"><i class="fas fa-trash"></i></button>
    </div>`).join('') || '<p style="text-align:center;color:var(--text-light);">Carrello vuoto</p>';
  $('#cartModal .modal-box').innerHTML = `
    <h3><i class="fas fa-shopping-cart"></i> Carrello</h3>
    <div class="cart-list">${items}</div>
    <div class="cart-totale">Totale: <strong>${eur(cartTotal())}</strong></div>
    ${cart.length ? `<button class="btn btn-primary" id="toCheckout" style="width:100%;"><i class="fas fa-credit-card"></i> Procedi all'ordine</button>` : ''}
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:10px;">Chiudi</button>`;
  $('#cartModal').classList.add('open');
  $('#cartModal').querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { cart.find(i => i.productId === b.dataset.inc).qty++; saveCart(); openCart(); });
  $('#cartModal').querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const it = cart.find(i => i.productId === b.dataset.dec); if (--it.qty <= 0) cart = cart.filter(i => i.productId !== b.dataset.dec); saveCart(); openCart(); });
  $('#cartModal').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { cart = cart.filter(i => i.productId !== b.dataset.del); saveCart(); openCart(); });
  const co = $('#toCheckout'); if (co) co.onclick = openCheckout;
}

// ─── Checkout ────────────────────────────────────────────────────────────────
function openCheckout() {
  $('#cartModal').classList.remove('open');
  $('#checkoutModal .modal-box').innerHTML = `
    <h3><i class="fas fa-file-invoice"></i> Completa l'ordine</h3>
    <div class="cart-totale" style="margin-bottom:16px;">Totale: <strong>${eur(cartTotal())}</strong></div>
    <form id="checkoutForm" class="shop-form">
      <input name="nome" placeholder="Nome e cognome *" required>
      <input name="email" type="email" placeholder="Email *" required>
      <input name="telefono" type="tel" placeholder="Telefono *" required>
      <input name="indirizzo" placeholder="Indirizzo consegna">
      <textarea name="note" placeholder="Note (opzionale)" rows="2"></textarea>
      <button class="btn btn-primary" type="submit" style="width:100%;"><i class="fas fa-check"></i> Conferma ordine</button>
    </form>
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:10px;">Annulla</button>`;
  $('#checkoutModal').classList.add('open');
  $('#checkoutForm').onsubmit = submitOrder;
}

async function submitOrder(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Invio in corso…';
  try {
    const r = await fetch(`${SHOP_API}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ productId: i.productId, qty: i.qty })),
        cliente: { nome: fd.get('nome'), email: fd.get('email'), telefono: fd.get('telefono'), indirizzo: fd.get('indirizzo'), note: fd.get('note') },
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Errore ordine');
    cart = []; saveCart();
    const pp = shopConfig.paypalLink
      ? `<a class="btn btn-primary" href="${esc(shopConfig.paypalLink)}" target="_blank" rel="noopener" style="width:100%;margin-top:12px;"><i class="fab fa-paypal"></i> Paga ${eur(data.totale)} con PayPal</a>`
      : '';
    const iban = shopConfig.iban ? `<p style="font-size:.85rem;color:var(--text-light);margin-top:10px;">Oppure bonifico a IBAN: <strong>${esc(shopConfig.iban)}</strong></p>` : '';
    $('#checkoutModal .modal-box').innerHTML = `
      <div style="text-align:center;">
        <i class="fas fa-circle-check" style="font-size:3rem;color:#16a34a;"></i>
        <h3>Ordine ricevuto!</h3>
        <p>Numero ordine: <strong>#${String(data.orderId).slice(-6)}</strong><br>Totale: <strong>${eur(data.totale)}</strong></p>
        ${pp}${iban}
        ${esc(shopConfig.noteCheckout) ? `<p style="font-size:.85rem;color:var(--text-light);">${esc(shopConfig.noteCheckout)}</p>` : ''}
        <button class="btn-link" onclick="closeAllModals()" style="margin-top:12px;">Chiudi</button>
      </div>`;
  } catch (err) {
    alert(err.message);
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Conferma ordine';
  }
}

// ─── Dettaglio prodotto + recensioni ────────────────────────────────────────
async function openProduct(id) {
  const modal = $('#productModal');
  modal.querySelector('.modal-box').innerHTML = '<p style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Caricamento…</p>';
  modal.classList.add('open');
  const r = await fetch(`${SHOP_API}/products/${id}`);
  if (!r.ok) { modal.querySelector('.modal-box').innerHTML = '<p>Prodotto non trovato.</p>'; return; }
  const { product: p, reviews } = await r.json();
  const imgs = p.immagini?.length
    ? p.immagini.map((s, i) => `<img src="${imgUrl(s)}" class="pimg ${i === 0 ? 'show' : ''}" alt="">`).join('') +
      (p.immagini.length > 1 ? `<button class="pnav prev" onclick="shiftImg(-1)">‹</button><button class="pnav next" onclick="shiftImg(1)">›</button>` : '')
    : '<div class="shop-noimg big"><i class="fas fa-box-open"></i></div>';
  const revs = reviews.map(rv => `<div class="review"><div class="rev-head"><strong>${esc(rv.nome)}</strong><span class="shop-stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</span></div><p>${esc(rv.testo)}</p></div>`).join('') || '<p style="color:var(--text-light);">Nessuna recensione ancora.</p>';
  let priceHtml = '';
  if (p.categoria === 'vendita') priceHtml = `<div class="shop-price big">${eur(p.prezzo)}</div>`;
  else if (p.categoria === 'noleggio') {
    const n = p.prezzoNoleggio || {};
    priceHtml = `<table class="noleggio-prices">${n.giorno ? `<tr><td>Giornata</td><td>${eur(n.giorno)}</td></tr>` : ''}${n.settimana ? `<tr><td>Settimana</td><td>${eur(n.settimana)}</td></tr>` : ''}${n.mese ? `<tr><td>Mese</td><td>${eur(n.mese)}</td></tr>` : ''}${p.cauzione ? `<tr><td>Cauzione</td><td>${eur(p.cauzione)}</td></tr>` : ''}</table>`;
  } else priceHtml = `<div class="shop-price big">${p.prezzo ? eur(p.prezzo) : 'Su richiesta'}</div>`;
  const action = p.categoria === 'vendita'
    ? `<button class="btn btn-primary" onclick="addToCart('${p._id}')" ${p.disponibile ? '' : 'disabled'}><i class="fas fa-cart-plus"></i> Aggiungi al carrello</button>`
    : `<button class="btn btn-primary" onclick="openRequest('${p.categoria === 'noleggio' ? 'noleggio' : 'apnea'}','${p._id}')"><i class="fas fa-handshake"></i> ${p.categoria === 'noleggio' ? 'Richiedi noleggio' : 'Prenota esame'}</button>`;
  modal.querySelector('.modal-box').innerHTML = `
    <button class="modal-close" onclick="closeAllModals()"><i class="fas fa-times"></i></button>
    <div class="product-detail">
      <div class="pimgs">${imgs}</div>
      <div class="pinfo">
        <span class="shop-cat">${CAT_LABELS[p.categoria]}</span>
        <h3>${esc(p.nome)}</h3>
        ${priceHtml}
        <p class="pdesc">${esc(p.descrizione)}</p>
        ${action}
      </div>
    </div>
    <div class="reviews-sec">
      <h4>Recensioni (${reviews.length})</h4>
      ${revs}
      <form class="shop-form rev-form" id="revForm">
        <h4>Lascia una recensione</h4>
        <input name="nome" placeholder="Il tuo nome *" required>
        <div class="star-input">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}">☆</button>`).join('')}<input type="hidden" name="rating" value=""></div>
        <textarea name="testo" placeholder="La tua recensione" rows="3"></textarea>
        <button class="btn btn-outline" type="submit">Invia recensione</button>
      </form>
    </div>`;
  const form = $('#revForm');
  form.querySelectorAll('.star-input button').forEach(b => b.onclick = () => {
    form.querySelector('input[name=rating]').value = b.dataset.star;
    form.querySelectorAll('.star-input button').forEach(x => x.textContent = x.dataset.star <= b.dataset.star ? '★' : '☆');
  });
  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const rr = await fetch(`${SHOP_API}/products/${p._id}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: fd.get('nome'), rating: fd.get('rating'), testo: fd.get('testo') }),
    });
    const d = await rr.json();
    alert(d.message || (rr.ok ? 'Grazie!' : 'Errore'));
  };
}

let curImg = 0;
function shiftImg(d) {
  const imgs = document.querySelectorAll('#productModal .pimg');
  if (!imgs.length) return;
  imgs[curImg].classList.remove('show');
  curImg = (curImg + d + imgs.length) % imgs.length;
  imgs[curImg].classList.add('show');
}

// ─── Richiesta noleggio / prenotazione apnea ─────────────────────────────────
function openRequest(tipo, id) {
  const p = products.find(x => x._id === id);
  const isRent = tipo === 'noleggio';
  $('#requestModal .modal-box').innerHTML = `
    <button class="modal-close" onclick="closeAllModals()"><i class="fas fa-times"></i></button>
    <h3>${isRent ? '<i class="fas fa-handshake"></i> Richiesta di noleggio' : '<i class="fas fa-calendar-check"></i> Prenota esame apnea'}</h3>
    <p style="color:var(--text-light);"><strong>${esc(p?.nome || '')}</strong>${isRent ? ' — lascia le date, ti confermiamo disponibilità e prezzo.' : ' — ti ricontatteremo per fissare data e dettagli.'}</p>
    <form class="shop-form" id="reqForm">
      <input name="nome" placeholder="Nome e cognome *" required>
      <input name="email" type="email" placeholder="Email *" required>
      <input name="telefono" type="tel" placeholder="Telefono *" required>
      ${isRent ? `<div class="req-dates"><label>Dal <input name="da" type="date" required></label><label>Al <input name="a" type="date" required></label></div>` : ''}
      <input name="indirizzo" placeholder="Indirizzo (per consegna)">
      <textarea name="note" placeholder="Note" rows="2"></textarea>
      <button class="btn btn-primary" type="submit" style="width:100%;"><i class="fas fa-paper-plane"></i> Invia richiesta</button>
    </form>
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:10px;">Annulla</button>`;
  closeAllModals();
  $('#requestModal').classList.add('open');
  $('#reqForm').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Invio…';
    try {
      const r = await fetch(`${SHOP_API}/requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id, tipo,
          cliente: { nome: fd.get('nome'), email: fd.get('email'), telefono: fd.get('telefono'), indirizzo: fd.get('indirizzo'), note: fd.get('note') },
          periodo: isRent ? { da: fd.get('da'), a: fd.get('a') } : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      $('#requestModal .modal-box').innerHTML = `<div style="text-align:center;"><i class="fas fa-circle-check" style="font-size:3rem;color:#16a34a;"></i><h3>Richiesta inviata!</h3><p>Ti contatteremo presto per confermare e indicarti le modalità di pagamento.</p><button class="btn-link" onclick="closeAllModals()">Chiudi</button></div>`;
    } catch (err) {
      alert(err.message); btn.disabled = false;
    }
  };
}

function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

document.addEventListener('DOMContentLoaded', initShop);
