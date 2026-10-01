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
let searchQuery = '';
let activeCat = 'vendita';
const vetrinaTimers = [];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => `€${Number(n || 0).toFixed(2)}`;
const imgUrl = src => src?.startsWith('http') ? src : SHOP_IMG + src;

const CAT_LABELS = { vendita: 'Presidi in vendita', noleggio: 'Noleggio apparecchiature' };
const TARIFFA_LABELS = { giorno: 'giorno', settimana: 'settimana', mese: 'mese' };
const PAY_LABELS = { paypal: 'PayPal', carta: 'Carta di credito', bonifico: 'Bonifico bancario' };

// ─── Init ────────────────────────────────────────────────────────────────────
async function initShop() {
  setView('home');
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
  renderTicker();
  renderVetrine();
  renderProducts('vendita');
  bindShopEvents();
}

// ─── Vetrine immagini rotanti (vendita / offerte / noleggio) ─────────────────
function buildVetrina(elId, list) {
  const el = document.getElementById(elId);
  if (!el) return;
  const items = list.filter(p => p.immagini?.length).slice(0, 10);
  if (!items.length) {
    el.innerHTML = '<div class="vetrina-empty"><i class="fas fa-image"></i><span>Prossimamente</span></div>';
    return;
  }
  el.innerHTML = items.map((p, i) => {
    let price = '';
    if (p.categoria === 'vendita') price = (p.inOfferta && p.prezzoScontato > 0) ? `<b>${eur(p.prezzoScontato)}</b> <s>${eur(p.prezzo)}</s>` : `<b>${eur(p.prezzo)}</b>`;
    else { const n = p.prezzoNoleggio || {}; const t = n.giorno ? `da ${eur(n.giorno)}/giorno` : n.settimana ? `da ${eur(n.settimana)}/sett` : `da ${eur(n.mese)}/mese`; price = `<b>${t}</b>`; }
    return `<div class="vet-slide ${i === 0 ? 'show' : ''}" data-viewprod="${p._id}">
      <img src="${imgUrl(p.immagini[0])}" alt="${esc(p.nome)}" loading="lazy">
      <div class="vet-caption"><span>${esc(p.nome)}</span>${price}</div>
    </div>`;
  }).join('') + `
    ${items.length > 1 ? '<button class="vet-nav prev"><i class="fas fa-chevron-left"></i></button><button class="vet-nav next"><i class="fas fa-chevron-right"></i></button>' : ''}
    <div class="vet-dots">${items.map((_, i) => `<span class="vet-dot ${i === 0 ? 'on' : ''}"></span>`).join('')}</div>`;
  let cur = 0;
  const show = n => {
    cur = (n + items.length) % items.length;
    el.querySelectorAll('.vet-slide').forEach((s, i) => s.classList.toggle('show', i === cur));
    el.querySelectorAll('.vet-dot').forEach((d, i) => d.classList.toggle('on', i === cur));
  };
  const timer = items.length > 1 ? setInterval(() => show(cur + 1), 4200) : null;
  if (timer) vetrinaTimers.push(timer);
  el.querySelector('.vet-nav.prev')?.addEventListener('click', e => { e.stopPropagation(); clearInterval(timer); show(cur - 1); });
  el.querySelector('.vet-nav.next')?.addEventListener('click', e => { e.stopPropagation(); clearInterval(timer); show(cur + 1); });
  el.querySelectorAll('[data-viewprod]').forEach(s => s.addEventListener('click', () => openProduct(s.dataset.viewprod)));
}

function renderVetrine() {
  buildVetrina('vetrinaVendita', products.filter(p => p.categoria === 'vendita'));
  buildVetrina('vetrinaOfferte', products.filter(p => p.inOfferta));
  buildVetrina('vetrinaNoleggio', products.filter(p => p.categoria === 'noleggio'));
}

// ─── Viste: landing (home) ↔ pagina catalogo dedicata ────────────────────────
function setView(v) {
  document.body.classList.toggle('shop-view-catalog', v === 'catalog');
  if (v === 'catalog') window.scrollTo({ top: 0, behavior: 'auto' });
}

// ─── Navigazione categorie (pulsanti grandi) ─────────────────────────────────
function goCategory(cat) {
  document.querySelectorAll('.shop-tab').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  activeCat = cat;
  renderProducts(cat);
  setView('catalog');
}

// ─── Ticker offerte ───────────────────────────────────────────────────────────
function renderTicker() {
  const offerte = shopConfig.offerte || [];
  if (!offerte.length) return;
  const track = $('#offerTickerTrack');
  const items = offerte.map(o => `<span class="offer-item">${esc(o)}</span>`).join('<span class="offer-sep">•</span>');
  track.innerHTML = items + '<span class="offer-sep">•</span>' + items;
  $('#offerTicker').style.display = 'block';
}

// ─── Tab categorie ───────────────────────────────────────────────────────────
function bindShopEvents() {
  document.querySelectorAll('.shop-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      renderProducts(activeCat);
    });
  });
  const searchInput = $('#shopSearch');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    $('#shopSearchClear').style.display = searchQuery ? 'inline-flex' : 'none';
    renderProducts(activeCat);
  });
  $('#shopSearchClear').addEventListener('click', () => {
    searchInput.value = ''; searchQuery = '';
    $('#shopSearchClear').style.display = 'none';
    renderProducts(activeCat);
    searchInput.focus();
  });
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartFab')?.addEventListener('click', openCart);
  $('#backHome')?.addEventListener('click', () => setView('home'));
  $('#contactUsBtn')?.addEventListener('click', openContact);
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAllModals();
  });
}

// ─── Contattaci per info ────────────────────────────────────────────────────
function openContact() {
  const tel = shopConfig.telefonoAssistenza || '06 01905242';
  const telHref = tel.replace(/\s+/g, '');
  const wa = shopConfig.whatsappAssistenza || '393514175117';
  const email = shopConfig.emailAssistenza || 'shop@abbracciocuredomiciliari.it';
  $('#contactModal .modal-box').innerHTML = `
    <button class="modal-close" onclick="closeAllModals()"><i class="fas fa-times"></i></button>
    <h3><i class="fas fa-headset"></i> Contattaci per informazioni</h3>
    <p style="color:var(--text-light);">Il nostro team di assistenza è a disposizione per aiutarti nella scelta, chiarire dubbi su prezzi, noleggi, spedizioni e ritiro in magazzino.</p>
    <div class="contact-options">
      <a href="tel:${esc(telHref)}" class="contact-opt"><i class="fas fa-phone"></i><div><strong>Chiama</strong><span>${esc(tel)}</span></div></a>
      <a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" class="contact-opt"><i class="fab fa-whatsapp"></i><div><strong>WhatsApp</strong><span>Risposta rapida</span></div></a>
      <a href="mailto:${esc(email)}" class="contact-opt"><i class="fas fa-envelope"></i><div><strong>Email</strong><span>${esc(email)}</span></div></a>
    </div>
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:14px;">Chiudi</button>`;
  $('#contactModal').classList.add('open');
}

// ─── Render catalogo + ricerca ────────────────────────────────────────────────
function matchesSearch(p) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return p.nome.toLowerCase().includes(q) || (p.descrizione || '').toLowerCase().includes(q);
}

function renderProducts(cat) {
  const grid = $('#shopGrid');
  let list = cat === '_offerte' ? products.filter(p => p.inOfferta) : products.filter(p => p.categoria === cat);
  // Con ricerca attiva: cerca in TUTTE le sezioni (vendita + noleggio), indipendentemente dal tab
  if (searchQuery) list = products.filter(p => ['vendita', 'noleggio'].includes(p.categoria) && matchesSearch(p));
  if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:40px;">${searchQuery ? `Nessun prodotto trovato per "<strong>${esc(searchQuery)}</strong>".` : cat === '_offerte' ? 'Nessuna offerta attiva al momento.' : 'Nessun prodotto in questa sezione al momento.'}</p>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const img = p.immagini?.[0] ? `<img src="${imgUrl(p.immagini[0])}" alt="${esc(p.nome)}" loading="lazy">` : '<div class="shop-noimg"><i class="fas fa-box-open"></i></div>';
    const stars = p.rating ? `<span class="shop-stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span> <small>(${p.reviewsCount})</small>` : '<small class="shop-norev">Nessuna recensione</small>';
    const hasOffer = p.inOfferta && p.prezzoScontato > 0 && p.categoria === 'vendita';
    let price = '';
    if (p.categoria === 'vendita') {
      price = hasOffer
        ? `<div class="shop-price"><span class="price-old">${eur(p.prezzo)}</span> <span class="price-offer">${eur(p.prezzoScontato)}</span></div>`
        : `<div class="shop-price">${eur(p.prezzo)}</div>`;
    } else if (p.categoria === 'noleggio') {
      const n = p.prezzoNoleggio || {};
      const parts = [n.giorno && `${eur(n.giorno)}/giorno`, n.settimana && `${eur(n.settimana)}/sett`, n.mese && `${eur(n.mese)}/mese`].filter(Boolean);
      price = `<div class="shop-price">${parts.join(' · ') || 'Su preventivo'}</div>`;
    } else price = `<div class="shop-price">${p.prezzo ? eur(p.prezzo) : 'Su richiesta'}</div>`;
    const btn = `<button class="btn btn-primary shop-btn" data-add="${p._id}" ${p.disponibile ? '' : 'disabled'}><i class="fas fa-cart-plus"></i> ${p.disponibile ? 'Aggiungi al carrello' : 'Non disponibile'}</button>`;
    const ribbon = hasOffer ? `<span class="shop-ribbon offer"><i class="fas fa-fire"></i> Offerta</span>` : p.badge ? `<span class="shop-ribbon">${esc(p.badge)}</span>` : '';
    const meta = [
      p.tempoSpedizione ? `<span class="shop-meta-item"><i class="fas fa-truck-fast"></i> ${esc(p.tempoSpedizione)}</span>` : '',
      p.ritiroMagazzino ? `<span class="shop-meta-item"><i class="fas fa-warehouse"></i> Ritiro disponibile</span>` : '',
    ].filter(Boolean).join('');
    return `<div class="shop-card">
      ${ribbon}
      <div class="shop-card-img" data-view="${p._id}">${img}</div>
      <div class="shop-card-body">
        ${searchQuery ? `<span class="shop-cat-chip">${CAT_LABELS[p.categoria] || p.categoria}</span>` : ''}
        <h3>${esc(p.nome)}</h3>
        <div class="shop-rating">${stars}</div>
        ${price}
        ${meta ? `<div class="shop-card-meta">${meta}</div>` : ''}
        <div class="shop-card-actions">
          <button class="btn-link" data-view="${p._id}">Dettagli</button>
          ${btn}
        </div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
  grid.querySelectorAll('[data-view]').forEach(b => b.onclick = () => openProduct(b.dataset.view));
}

// ─── Carrello ────────────────────────────────────────────────────────────────
function saveCart() { localStorage.setItem('shop-cart', JSON.stringify(cart)); renderCartBadge(); }
function renderCartBadge() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = n;
  const fab = $('#cartFabCount');
  if (fab) fab.textContent = n;
}
function noleggioDefaultTariffa(p) {
  const n = p.prezzoNoleggio || {};
  if (n.giorno > 0) return 'giorno';
  if (n.settimana > 0) return 'settimana';
  if (n.mese > 0) return 'mese';
  return 'giorno';
}
function itemKey(i) { return i.productId + '|' + (i.tariffa || ''); }

function addToCart(id) {
  const p = products.find(x => x._id === id);
  if (!p || !p.disponibile) return;
  let item;
  if (p.categoria === 'noleggio') {
    const tariffa = noleggioDefaultTariffa(p);
    const prezzo = Number(p.prezzoNoleggio?.[tariffa]) || 0;
    item = { productId: id, nome: p.nome, prezzo, qty: 1, categoria: 'noleggio', tariffa };
  } else {
    const prezzoEff = (p.inOfferta && p.prezzoScontato > 0) ? p.prezzoScontato : (p.prezzo || 0);
    item = { productId: id, nome: p.nome, prezzo: prezzoEff, qty: 1, categoria: 'vendita' };
  }
  const ex = cart.find(i => itemKey(i) === itemKey(item));
  if (ex) ex.qty = Math.min(50, ex.qty + 1); else cart.push(item);
  saveCart(); openCart();
}
function cartTotal() { return cart.reduce((s, i) => s + i.prezzo * i.qty, 0); }

function openCart() {
  const items = cart.map(i => {
    const p = products.find(x => x._id === i.productId);
    const isNol = i.categoria === 'noleggio';
    const tariffaSel = isNol && p
      ? `<select class="cart-tariffa" data-tariffa="${itemKey(i)}">
          ${['giorno', 'settimana', 'mese'].filter(t => Number(p.prezzoNoleggio?.[t]) > 0).map(t =>
            `<option value="${t}" ${i.tariffa === t ? 'selected' : ''}>${eur(p.prezzoNoleggio[t])}/${TARIFFA_LABELS[t]}</option>`).join('')}
        </select><span class="cart-period">${i.qty} ${TARIFFA_LABELS[i.tariffa] === 'giorno' ? 'giorni' : TARIFFA_LABELS[i.tariffa] === 'settimana' ? 'settimane' : 'mesi'}</span>`
      : '';
    return `<div class="cart-row">
      <span class="cart-nome">${esc(i.nome)}${isNol ? ' <small class="cart-cat">noleggio</small>' : ''}${tariffaSel}</span>
      <span class="cart-qty"><button data-dec="${itemKey(i)}">−</button> ${i.qty} <button data-inc="${itemKey(i)}">+</button></span>
      <span class="cart-prezzo">${eur(i.prezzo * i.qty)}</span>
      <button class="cart-del" data-del="${itemKey(i)}"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join('') || '<p style="text-align:center;color:var(--text-light);">Carrello vuoto</p>';
  $('#cartModal .modal-box').innerHTML = `
    <h3><i class="fas fa-shopping-cart"></i> Carrello</h3>
    <div class="cart-list">${items}</div>
    <div class="cart-totale">Totale: <strong>${eur(cartTotal())}</strong></div>
    ${cart.length ? `<button class="btn btn-primary" id="toCheckout" style="width:100%;"><i class="fas fa-credit-card"></i> Procedi all'ordine</button>
    <button class="btn btn-danger" id="clearCart" style="width:100%;margin-top:8px;"><i class="fas fa-trash-can"></i> Svuota carrello</button>` : ''}
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:10px;">Chiudi</button>`;
  $('#cartModal').classList.add('open');
  $('#cartModal').querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { cart.find(i => itemKey(i) === b.dataset.inc).qty = Math.min(50, cart.find(i => itemKey(i) === b.dataset.inc).qty + 1); saveCart(); openCart(); });
  $('#cartModal').querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const it = cart.find(i => itemKey(i) === b.dataset.dec); if (--it.qty <= 0) cart = cart.filter(i => itemKey(i) !== b.dataset.dec); saveCart(); openCart(); });
  $('#cartModal').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { cart = cart.filter(i => itemKey(i) !== b.dataset.del); saveCart(); openCart(); });
  $('#cartModal').querySelectorAll('[data-tariffa]').forEach(s => s.onchange = () => {
    const it = cart.find(i => itemKey(i) === s.dataset.tariffa);
    const p = products.find(x => x._id === it?.productId);
    if (!it || !p) return;
    const oldKey = itemKey(it);
    it.tariffa = s.value;
    it.prezzo = Number(p.prezzoNoleggio?.[s.value]) || 0;
    it.nome = it.nome;
    const merged = cart.find(i => itemKey(i) === itemKey(it) && i !== it);
    if (merged) { merged.qty = Math.min(50, merged.qty + it.qty); cart = cart.filter(i => i !== it); }
    void oldKey;
    saveCart(); openCart();
  });
  const co = $('#toCheckout'); if (co) co.onclick = openCheckout;
  const cc = $('#clearCart');
  if (cc) cc.onclick = () => { if (confirm('Vuoi eliminare tutti i prodotti dal carrello?')) { cart = []; saveCart(); openCart(); } };
}

// ─── Checkout: step 1 dati + metodo pagamento → step 2 istruzioni pagamento ───
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

      <div class="pay-title"><i class="fas fa-credit-card"></i> Scegli il metodo di pagamento *</div>
      <div class="pay-methods">
        <label class="pay-opt"><input type="radio" name="pagamento" value="paypal" required>
          <span class="pay-card"><i class="fab fa-paypal"></i><strong>PayPal</strong><small>Pagamento immediato e sicuro</small></span></label>
        <label class="pay-opt"><input type="radio" name="pagamento" value="carta">
          <span class="pay-card"><i class="fas fa-credit-card"></i><strong>Carta di credito</strong><small>Visa, Mastercard, Amex</small></span></label>
        <label class="pay-opt"><input type="radio" name="pagamento" value="bonifico">
          <span class="pay-card"><i class="fas fa-building-columns"></i><strong>Bonifico bancario</strong><small>Ordine evaso a ricezione del pagamento</small></span></label>
      </div>

      <button class="btn btn-primary" type="submit" style="width:100%;margin-top:6px;"><i class="fas fa-lock"></i> Conferma e procedi al pagamento</button>
    </form>
    <button class="btn-link" onclick="closeAllModals()" style="margin-top:10px;">Annulla</button>`;
  $('#checkoutModal').classList.add('open');
  $('#checkoutForm').onsubmit = submitOrder;
}

async function submitOrder(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const metodoPagamento = fd.get('pagamento');
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Invio in corso…';
  try {
    const r = await fetch(`${SHOP_API}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ productId: i.productId, qty: i.qty, tariffa: i.tariffa || undefined })),
        cliente: { nome: fd.get('nome'), email: fd.get('email'), telefono: fd.get('telefono'), indirizzo: fd.get('indirizzo'), note: fd.get('note') },
        metodoPagamento,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Errore ordine');
    cart = []; saveCart();
    $('#checkoutModal .modal-box').innerHTML = orderSuccessHtml(data, metodoPagamento);
  } catch (err) {
    alert(err.message);
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Conferma e procedi al pagamento';
  }
}

function orderSuccessHtml(data, metodo) {
  const num = String(data.orderId).slice(-6);
  const base = `
    <div style="text-align:center;">
      <i class="fas fa-circle-check" style="font-size:3rem;color:#16a34a;"></i>
      <h3>Ordine ricevuto!</h3>
      <p>Numero ordine: <strong>#${num}</strong><br>Totale: <strong>${eur(data.totale)}</strong><br>
      Metodo scelto: <strong>${PAY_LABELS[metodo] || metodo}</strong></p>`;
  let payment = '';
  if (metodo === 'paypal') {
    payment = shopConfig.paypalLink
      ? `<a class="btn btn-primary" href="${esc(shopConfig.paypalLink)}" target="_blank" rel="noopener" style="width:100%;margin-top:12px;"><i class="fab fa-paypal"></i> Paga ${eur(data.totale)} con PayPal</a>`
      : `<p style="font-size:.85rem;color:var(--text-light);margin-top:10px;">Ti contatteremo a breve con il link per il pagamento PayPal.</p>`;
  } else if (metodo === 'carta') {
    const linkCarta = shopConfig.linkCarta || shopConfig.paypalLink;
    payment = linkCarta
      ? `<a class="btn btn-primary" href="${esc(linkCarta)}" target="_blank" rel="noopener" style="width:100%;margin-top:12px;"><i class="fas fa-credit-card"></i> Paga ${eur(data.totale)} con carta</a>
         <p style="font-size:.8rem;color:var(--text-light);margin-top:8px;">Pagamento sicuro — potrai inserire i dati della carta nella pagina seguente.</p>`
      : `<p style="font-size:.85rem;color:var(--text-light);margin-top:10px;">Ti contatteremo a breve con il link per il pagamento con carta.</p>`;
  } else if (metodo === 'bonifico') {
    payment = `
      <div class="pay-bonifico">
        <i class="fas fa-building-columns"></i>
        <p><strong>Bonifico bancario</strong></p>
        ${shopConfig.iban ? `<p>IBAN: <strong>${esc(shopConfig.iban)}</strong><br>Causale: <strong>Ordine #${num} — Abbraccio Shop</strong></p>` : '<p>Ti invieremo via email le coordinate per il bonifico.</p>'}
        <p class="pay-note"><i class="fas fa-info-circle"></i> L'ordine sarà evaso a ricezione del pagamento.</p>
      </div>`;
  }
  return `${base}${payment}
      ${shopConfig.noteCheckout ? `<p style="font-size:.85rem;color:var(--text-light);margin-top:10px;">${esc(shopConfig.noteCheckout)}</p>` : ''}
      <button class="btn-link" onclick="closeAllModals()" style="margin-top:12px;">Chiudi</button>
    </div>`;
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
  const hasOffer = p.inOfferta && p.prezzoScontato > 0 && p.categoria === 'vendita';
  let priceHtml = '';
  if (p.categoria === 'vendita') {
    priceHtml = hasOffer
      ? `<div class="shop-price big"><span class="price-old">${eur(p.prezzo)}</span> <span class="price-offer">${eur(p.prezzoScontato)}</span></div>`
      : `<div class="shop-price big">${eur(p.prezzo)}</div>`;
  }
  else if (p.categoria === 'noleggio') {
    const n = p.prezzoNoleggio || {};
    priceHtml = `<table class="noleggio-prices">${n.giorno ? `<tr><td>Giornata</td><td>${eur(n.giorno)}</td></tr>` : ''}${n.settimana ? `<tr><td>Settimana</td><td>${eur(n.settimana)}</td></tr>` : ''}${n.mese ? `<tr><td>Mese</td><td>${eur(n.mese)}</td></tr>` : ''}${p.cauzione ? `<tr><td>Cauzione</td><td>${eur(p.cauzione)}</td></tr>` : ''}</table>`;
  } else priceHtml = `<div class="shop-price big">${p.prezzo ? eur(p.prezzo) : 'Su richiesta'}</div>`;
  const action = `<button class="btn btn-primary" onclick="addToCart('${p._id}')" ${p.disponibile ? '' : 'disabled'}><i class="fas fa-cart-plus"></i> ${p.disponibile ? 'Aggiungi al carrello' : 'Non disponibile'}</button>`;
  const metaDetail = [
    p.tempoSpedizione ? `<span class="shop-meta-item"><i class="fas fa-truck-fast"></i> Spedizione: ${esc(p.tempoSpedizione)}</span>` : '',
    p.ritiroMagazzino ? `<span class="shop-meta-item"><i class="fas fa-warehouse"></i> Ritiro in magazzino disponibile</span>` : '',
  ].filter(Boolean).join('');
  modal.querySelector('.modal-box').innerHTML = `
    <button class="modal-close" onclick="closeAllModals()"><i class="fas fa-times"></i></button>
    <div class="product-detail">
      <div class="pimgs">${imgs}</div>
      <div class="pinfo">
        <span class="shop-cat">${CAT_LABELS[p.categoria]}</span>${p.badge && !hasOffer ? ` <span class="shop-ribbon inline">${esc(p.badge)}</span>` : ''}${hasOffer ? ' <span class="shop-ribbon offer inline"><i class="fas fa-fire"></i> Offerta</span>' : ''}
        <h3>${esc(p.nome)}</h3>
        ${priceHtml}
        <p class="pdesc">${esc(p.descrizione)}</p>
        ${metaDetail ? `<div class="shop-card-meta big">${metaDetail}</div>` : ''}
        ${action}
        <button class="btn-link" onclick="closeAllModals();openContact();" style="margin-top:10px;"><i class="fas fa-headset"></i> Hai domande? Contattaci</button>
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

function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

document.addEventListener('DOMContentLoaded', initShop);
