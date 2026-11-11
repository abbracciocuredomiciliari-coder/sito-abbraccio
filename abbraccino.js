/* Abbraccino — assistente virtuale Abbraccio (widget sito) */

/* ═══ ABABRACCINO FACE — mascotte animata SVG ═══
   Occhi che seguono il puntatore e sbattono, sorriso che si allarga,
   braccia che si aprono in un abbraccio, bocca che si muove quando parla.
   Uso: AbbraccinoFace.mount(el) -> { el, hug(), setSmile(big), setTalking(on) }
*/
(function () {
  'use strict';
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var faces = [];
  var cssInjected = false;

  function injectCss() {
    if (cssInjected) return; cssInjected = true;
    var s = document.createElement('style');
    s.textContent =
      '.abf-svg{display:block;width:100%;height:100%;overflow:visible}' +
      '.abf-lid{transform-box:fill-box;transform-origin:center top;transform:scaleY(0);transition:transform .11s ease-in}' +
      '.abf-look{transition:transform .12s ease-out}' +
      '.abf-arm{transform-box:fill-box;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}' +
      '.abf-al{transform-origin:100% 100%}' +
      '.abf-ar{transform-origin:0% 100%}' +
      '.abf-svg.abf-hug .abf-al{transform:rotate(-42deg) translate(-2px,-6px)}' +
      '.abf-svg.abf-hug .abf-ar{transform:rotate(42deg) translate(2px,-6px)}' +
      '.abf-mouth-open{transform-box:fill-box;transform-origin:center top;opacity:0;transition:opacity .12s}' +
      '.abf-svg.abf-talk .abf-mouth-smile{opacity:0}' +
      '.abf-svg.abf-talk .abf-mouth-open{opacity:1;animation:abfTalk .26s ease-in-out infinite alternate}' +
      '@keyframes abfTalk{from{transform:scaleY(.35)}to{transform:scaleY(1.05)}}' +
      '@media (prefers-reduced-motion:reduce){.abf-lid,.abf-look,.abf-arm,.abf-mouth-open{transition:none}.abf-svg.abf-talk .abf-mouth-open{animation:none}}';
    document.head.appendChild(s);
  }

  var SVG_INNER =
    '<path class="abf-arm abf-al" d="M31 82 Q15 78 11 64" stroke="#e8a93e" stroke-width="8.5" stroke-linecap="round" fill="none"/>' +
    '<path class="abf-arm abf-ar" d="M89 82 Q105 78 109 64" stroke="#e8a93e" stroke-width="8.5" stroke-linecap="round" fill="none"/>' +
    '<circle class="abf-hand" cx="10" cy="62" r="7.5" fill="#ffd98e" stroke="#e8a93e" stroke-width="2.5"/>' +
    '<circle class="abf-hand" cx="110" cy="62" r="7.5" fill="#ffd98e" stroke="#e8a93e" stroke-width="2.5"/>' +
    '<circle cx="60" cy="62" r="40" fill="#ffd98e" stroke="#e8a93e" stroke-width="3"/>' +
    '<circle cx="39" cy="71" r="7" fill="#ffa6a6" opacity=".7"/>' +
    '<circle cx="81" cy="71" r="7" fill="#ffa6a6" opacity=".7"/>' +
    '<g class="abf-look">' +
    '<circle cx="44" cy="54" r="7.6" fill="#fff"/>' +
    '<circle cx="76" cy="54" r="7.6" fill="#fff"/>' +
    '<circle cx="44" cy="55.5" r="3.6" fill="#3d2e1e"/>' +
    '<circle cx="76" cy="55.5" r="3.6" fill="#3d2e1e"/>' +
    '<circle cx="45.3" cy="54" r="1.15" fill="#fff"/>' +
    '<circle cx="77.3" cy="54" r="1.15" fill="#fff"/>' +
    '</g>' +
    '<ellipse class="abf-lid" cx="44" cy="54" rx="8.2" ry="8.6" fill="#ffd98e"/>' +
    '<ellipse class="abf-lid" cx="76" cy="54" rx="8.2" ry="8.6" fill="#ffd98e"/>' +
    '<path class="abf-mouth-smile" d="M45 74 Q60 83 75 74" stroke="#8a5420" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="abf-mouth-open" cx="60" cy="78" rx="7" ry="4.6" fill="#8a5420"/>';

  function mount(container) {
    injectCss();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'abf-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = SVG_INNER;
    container.appendChild(svg);

    var look = svg.querySelector('.abf-look');
    var lids = svg.querySelectorAll('.abf-lid');
    var mouth = svg.querySelector('.abf-mouth-smile');
    var face = { svg: svg };

    /* occhi che seguono il puntatore (o vagano dolcemente su touch) */
    var tx = 0, ty = 0, idleT = 0;
    function onPointer(e) {
      if (reduce) return;
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height * .46;
      var dx = (e.clientX - cx) / 160, dy = (e.clientY - cy) / 160;
      tx = Math.max(-3, Math.min(3, dx * 3));
      ty = Math.max(-2.2, Math.min(2.2, dy * 2.2));
      look.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
    }
    document.addEventListener('pointermove', onPointer, { passive: true });

    /* deriva degli occhi quando nessuno muove il mouse (touch) */
    function idleEyes() {
      if (reduce) return;
      var now = Date.now();
      if (now - idleT > 2600) {
        idleT = now;
        look.style.transform = 'translate(' + (Math.random() * 4 - 2) + 'px,' + (Math.random() * 2 - 1) + 'px)';
      }
    }
    var idleInt = setInterval(idleEyes, 2400);

    /* battito di ciglia casuale */
    function blink() {
      if (reduce || !svg.isConnected) return;
      lids.forEach(function (l) { l.style.transform = 'scaleY(1)'; });
      setTimeout(function () { lids.forEach(function (l) { l.style.transform = 'scaleY(0)'; }); }, 150);
    }
    var blinkInt = setInterval(function () { if (Math.random() < .8) blink(); }, 3400);
    setTimeout(blink, 700);

    /* abbraccio: braccia che si aprono — ogni tanto da solo + al passaggio del mouse */
    function hug() {
      if (reduce || !svg.isConnected) return;
      svg.classList.add('abf-hug');
      setTimeout(function () { svg.classList.remove('abf-hug'); }, 1100);
    }
    var hugInt = setInterval(hug, 9000);
    container.addEventListener('pointerenter', hug);
    setTimeout(hug, 1200);

    face.hug = hug;
    face.setSmile = function (big) {
      mouth.setAttribute('d', big ? 'M41 72 Q60 92 79 72' : 'M45 74 Q60 83 75 74');
      if (big) hug();
    };
    face.setTalking = function (on) { svg.classList.toggle('abf-talk', !!on); };
    face.destroy = function () {
      document.removeEventListener('pointermove', onPointer);
      clearInterval(idleInt); clearInterval(blinkInt); clearInterval(hugInt);
      svg.remove();
      var i = faces.indexOf(face); if (i > -1) faces.splice(i, 1);
    };
    faces.push(face);
    return face;
  }

  window.AbbraccinoFace = {
    mount: mount,
    setTalking: function (on) { faces.forEach(function (f) { f.setTalking(on); }); },
    hug: function () { faces.forEach(function (f) { f.hug(); }); },
    setSmile: function (big) { faces.forEach(function (f) { f.setSmile(big); }); }
  };
})();

(function () {
  var API = 'https://api.abbracciocuredomiciliari.it/api';
  var ICON = 'https://app.abbracciocuredomiciliari.it/abbraccino.jpg';
  if (window.__abbraccinoInit) return;
  window.__abbraccinoInit = true;

  var css = document.createElement('style');
  css.textContent = [
    '@keyframes abHeartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.18)}28%{transform:scale(1)}42%{transform:scale(1.18)}70%{transform:scale(1)}}',
    '@keyframes abGlow{0%,100%{box-shadow:0 4px 16px rgba(242,181,42,.3),0 0 0 0 rgba(242,181,42,.45)}50%{box-shadow:0 4px 20px rgba(242,181,42,.7),0 0 0 10px rgba(242,181,42,0)}}',
    /* colonna mascotte: si sposta dolcemente sul sito (come LUX) */
    '.ab-col{position:fixed;left:0;top:0;z-index:99998;display:flex;flex-direction:column;align-items:center;gap:5px;will-change:transform;transform:translate3d(var(--abx,calc(100vw - 80px)),var(--aby,calc(100dvh - 205px)),0)}',
    '.ab-x{position:absolute;top:-8px;right:-6px;width:22px;height:22px;border-radius:50%;border:none;background:#1e3a5f;color:#fff;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)}',
    '.ab-btn{width:62px;height:62px;border-radius:50%;border:none;background:#fff;cursor:pointer;padding:5px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;animation:abGlow 1.8s ease-in-out infinite}',
    '.ab-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;animation:abHeartBeat 1.8s ease-in-out infinite;transform-origin:center}',
    '.ab-face-slot{display:block;width:100%;height:100%;animation:abHeartBeat 1.8s ease-in-out infinite;transform-origin:center}',
    '.ab-lbl{border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,.12);cursor:pointer;border:none;font-family:inherit;white-space:nowrap}',
    '.ab-lbl-top{background:#fff;color:#1e4d8c;border:1.5px solid #dbeafe}',
    '.ab-lbl-btm{background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff}',
    '.ab-panel{position:fixed;bottom:212px;right:14px;width:min(360px,calc(100vw - 28px));max-height:62vh;background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.22);z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid #dbeafe;font-family:"Segoe UI",system-ui,sans-serif}',
    '.ab-head{background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff;padding:12px 16px;font-weight:800;font-size:.95rem;display:flex;align-items:center;gap:8px}',
    '.ab-close{margin-left:auto;background:transparent;border:none;color:#fff;font-size:22px;line-height:1;padding:4px 8px;cursor:pointer;min-width:36px;min-height:36px;touch-action:manipulation}',
    '@media (max-width:640px){#ab-xfloat{display:none !important}}',
    '.ab-head img{width:26px;height:26px;border-radius:50%;object-fit:cover}',
    '.ab-head .ab-face-slot{width:30px;height:30px;flex:none;animation:none}',
    '.ab-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:160px;max-height:44vh}',
    '.ab-msg{max-width:85%;border-radius:14px;padding:9px 12px;font-size:.85rem;line-height:1.45;white-space:pre-wrap}',
    '.ab-msg.bot{align-self:flex-start;background:#f1f5f9;color:#1e293b}',
    '.ab-msg.io{align-self:flex-end;background:#1e4d8c;color:#fff}',
    '.ab-cta{align-self:flex-start;margin-top:-2px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:.8rem;padding:8px 14px;border-radius:999px}',
    '.ab-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0}',
    '.ab-form input{flex:1;padding:10px 12px;border:1px solid #e2e8f0;border-radius:999px;font-size:.88rem;font-family:inherit}',
    '.ab-form button{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px}',
    '.ab-send{background:#1e4d8c;color:#fff}',
    '.ab-mic{background:#e2e8f0;color:#475569}',
    '.ab-mic.on{background:#dc2626;color:#fff;animation:abHeartBeat 1.2s infinite}',
    '.ab-voice{margin-left:auto;background:transparent;border:none;color:#fff;font-size:18px;line-height:1;padding:4px 6px;cursor:pointer;opacity:.75}',
    '.ab-voice[aria-pressed=true]{opacity:1;color:#fbbf24}',
    '.ab-motion{border:none;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;padding:8px;cursor:pointer;font-family:inherit}',
    '.ab-motion:hover{background:#f1f5f9}',
    /* Su smartphone il lanciatore e' compatto: una sola pill + icona piccola;
       il pannello diventa bottom-sheet a tutta larghezza con la X in alto */
    '@media (max-width:640px){.ab-col{gap:4px;transform:translate3d(var(--abx,calc(100vw - 62px)),var(--aby,calc(100dvh - 190px)),0)}.ab-lbl-top{display:none}.ab-btn{width:46px;height:46px}.ab-lbl-btm{font-size:11px;padding:4px 10px}.ab-panel{left:0;right:0;bottom:0;width:100%;max-height:88vh;border-radius:18px 18px 0 0}}',
    '@media (prefers-reduced-motion:reduce){.ab-col{will-change:auto}}'
  ].join('\n');
  document.head.appendChild(css);

  var open = false, busy = false, voci = null, msgsEl, inputEl, micBtn, panel, col, closeBtn;

  function addMsg(text, who, link, labelLink) {
    var d = document.createElement('div');
    d.className = 'ab-msg ' + who;
    d.textContent = text;
    msgsEl.appendChild(d);
    if (link && who === 'bot') {
      var a = document.createElement('a');
      a.className = 'ab-cta';
      a.href = link;
      a.textContent = labelLink || 'Apri';
      msgsEl.appendChild(a);
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  /* ── voce TTS: attiva di default, si sospende dal tasto ♪ ── */
  var voiceOn = true;
  try { voiceOn = localStorage.getItem('ab-voice') !== '0'; } catch (e) {}
  function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); if (window.AbbraccinoFace) AbbraccinoFace.setTalking(false); }
  function speak(text) {
    if (!voiceOn || !('speechSynthesis' in window) || !text) return;
    stopSpeech();
    var u = new SpeechSynthesisUtterance(String(text).slice(0, 600));
    u.lang = 'it-IT';
    var it = speechSynthesis.getVoices().filter(function (v) { return v.lang.indexOf('it') === 0; });
    if (it.length) u.voice = it[0];
    u.rate = .97;
    u.onstart = function () { if (window.AbbraccinoFace) AbbraccinoFace.setTalking(true); };
    u.onend = u.onerror = function () { if (window.AbbraccinoFace) AbbraccinoFace.setTalking(false); };
    speechSynthesis.speak(u);
  }

  /* ── mascotte che si sposta dolcemente (port di lux-wander) ── */
  function startWander(host, isChatOpen, chatEl) {
    var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
    var ease = function (t) { return t < .5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2; };
    function overlap(a, b) { return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); }
    function bounds(w, h) {
      var v = { width: innerWidth, height: window.visualViewport ? window.visualViewport.height : innerHeight };
      var header = document.querySelector('.site-header,header,nav') ? document.querySelector('.site-header,header,nav').getBoundingClientRect() : null;
      var headerEnd = header && header.bottom > 0 && header.bottom < v.height / 3 ? header.bottom : 0;
      var bottom = 0;
      document.querySelectorAll('.mobilebar,.mobile-nav,.bottom-nav,nav.fixed-bottom,[data-lux-avoid-bottom]').forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.height && r.bottom >= v.height - 10 && r.top >= v.height * .65) bottom = Math.max(bottom, v.height - r.top);
      });
      var left = 8, right = Math.max(left, v.width - w - 8), top = Math.max(8, Math.min(headerEnd + 8, v.height - h - 8)), foot = Math.max(top, v.height - h - bottom - 10);
      return { left: left, right: right, top: top, bottom: foot, w: w, h: h };
    }
    function route(b) {
      var span = b.bottom - b.top;
      return [{ x: b.right, y: b.bottom }, { x: b.left, y: b.bottom }, { x: b.right, y: b.top + span * .15 }, { x: b.left, y: b.top + span * .45 }, { x: (b.left + b.right) / 2, y: b.bottom }];
    }
    function safePoint(point, b, obstacles) {
      var cands = [point].concat(route(b)).map(function (p) { return { x: clamp(p.x, b.left, b.right), y: clamp(p.y, b.top, b.bottom) }; });
      var best = cands[0], bestScore = Infinity;
      cands.forEach(function (p) {
        var s = 0;
        obstacles.forEach(function (o) { s += overlap({ x: p.x, y: p.y, w: b.w, h: b.h }, o); });
        if (s < bestScore) { bestScore = s; best = p; }
      });
      return best;
    }
    function obstacles() {
      var out = [], v = { height: window.visualViewport ? window.visualViewport.height : innerHeight };
      document.querySelectorAll('a,button,input,textarea,select,[data-lux-avoid]').forEach(function (e) {
        if (host.contains(e) || chatEl.contains(e)) return;
        var r = e.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.top > v.height) return;
        out.push({ x: r.left - 7, y: r.top - 7, w: r.width + 14, h: r.height + 14 });
      });
      return out;
    }
    var reduce = matchMedia('(prefers-reduced-motion: reduce)'), paused = false;
    try { paused = localStorage.getItem('ab-wander-paused') === '1'; } catch (e) {}
    var hover = false, focused = false, typing = false, scrollUntil = 0, last = performance.now(), wait = 4800, progress = 0, trip = null, index = 0, wasDocked = false, position = null;
    var rect0 = host.getBoundingClientRect();
    function draw() { host.style.setProperty('--abx', Math.round(position.x) + 'px'); host.style.setProperty('--aby', Math.round(position.y) + 'px'); }
    function place() { var b = bounds(rect0.width, rect0.height); position = safePoint(position || { x: b.right, y: b.bottom }, b, obstacles()); draw(); }
    var motionToggle = chatEl.querySelector('.ab-motion');
    function updateToggle() { if (motionToggle) { motionToggle.setAttribute('aria-pressed', String(paused)); motionToggle.textContent = paused ? 'Riattiva gli spostamenti di Abbraccino' : 'Ferma gli spostamenti di Abbraccino'; } }
    updateToggle();
    if (motionToggle) motionToggle.onclick = function () { paused = !paused; try { localStorage.setItem('ab-wander-paused', paused ? '1' : '0'); } catch (e) {} updateToggle(); trip = null; wait = 4800; };
    host.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    host.addEventListener('pointerleave', function () { hover = false; });
    host.addEventListener('focusin', function () { focused = true; });
    host.addEventListener('focusout', function () { focused = false; });
    document.addEventListener('focusin', function (e) { typing = !!(e.target.closest && e.target.closest('input,textarea,select')); });
    document.addEventListener('focusout', function () { typing = false; });
    window.addEventListener('scroll', function () { scrollUntil = performance.now() + 1200; }, { passive: true });
    function resized() { trip = null; wait = 1800; if (position) { rect0 = host.getBoundingClientRect(); place(); } }
    window.addEventListener('resize', resized);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resized);
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(1000, Math.max(0, now - last)); last = now;
      var docked = isChatOpen();
      if (!position) place();
      if (docked) {
        var r = chatEl.getBoundingClientRect(), cr = host.getBoundingClientRect();
        position = { x: Math.max(4, r.left + 4), y: Math.max(2, r.top - cr.height - 4) };
        draw(); trip = null; wait = 6000; wasDocked = true; return;
      }
      if (wasDocked) { wasDocked = false; trip = null; wait = 4500; place(); }
      if (document.hidden || paused || reduce.matches || hover || focused || typing || now < scrollUntil) return;
      if (!trip) {
        wait -= dt; if (wait > 0) return;
        var b = bounds(rect0.width, rect0.height), points = route(b), target = position;
        for (var n = 0; n < points.length; n++) { index = (index + 1) % points.length; target = safePoint(points[index], b, obstacles()); if (Math.hypot(target.x - position.x, target.y - position.y) > 35) break; }
        if (Math.hypot(target.x - position.x, target.y - position.y) < 20) { wait = 6000; return; }
        trip = { from: { x: position.x, y: position.y }, to: target, duration: Math.max(3000, Math.min(6500, Math.hypot(target.x - position.x, target.y - position.y) * 7)) };
        progress = 0;
      }
      progress += dt;
      var f = Math.min(1, progress / trip.duration), t = ease(f);
      position = { x: trip.from.x + (trip.to.x - trip.from.x) * t, y: trip.from.y + (trip.to.y - trip.from.y) * t };
      draw();
      if (f === 1) { trip = null; wait = 6500; }
    }
    place();
    requestAnimationFrame(frame);
  }

  function loadVoci() {
    if (voci) return;
    var x = new XMLHttpRequest();
    x.open('GET', API + '/landing-preventivo/listino');
    x.onload = function () {
      try {
        var d = JSON.parse(x.responseText);
        var cats = d.categorie || d || [];
        voci = [];
        (cats.categorie || cats).forEach(function (c) {
          (c.voci || []).forEach(function (v) { voci.push({ id: v.id, descrizione: v.nome || v.descrizione, prezzo: v.prezzo, categoria: c.label || c.nome }); });
        });
      } catch (e) { voci = []; }
    };
    x.send();
  }

  function invia() {
    var text = inputEl.value.trim();
    if (!text || busy) return;
    inputEl.value = '';
    addMsg(text, 'io');
    busy = true;
    var thinking = document.createElement('div');
    thinking.className = 'ab-msg bot';
    thinking.textContent = 'Abbraccino sta pensando…';
    thinking.style.color = '#94a3b8';
    msgsEl.appendChild(thinking);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    var x = new XMLHttpRequest();
    x.open('POST', API + '/abbraccino/chat');
    x.setRequestHeader('Content-Type', 'application/json');
    x.onload = function () {
      busy = false;
      thinking.remove();
      try {
        var d = JSON.parse(x.responseText);
        addMsg(d.risposta || 'Puoi chiamarci al 06 01905242.', 'bot', d.link, d.labelLink);
        speak(d.risposta);
      } catch (e) {
        addMsg('Ops, ho qualche difficoltà tecnica. Chiamaci al 06 01905242.', 'bot');
      }
    };
    x.onerror = function () {
      busy = false;
      thinking.remove();
      addMsg('Ops, ho qualche difficoltà tecnica. Chiamaci al 06 01905242.', 'bot');
    };
    x.send(JSON.stringify({
      messaggio: text,
      tipo: 'sito',
      contesto: { voci: voci || [], pagina: document.title + ' ' + location.pathname }
    }));
  }

  var greeted = false;
  function setOpen(v) {
    open = v;
    panel.style.display = open ? 'flex' : 'none';
    col.style.display = 'flex';
    closeBtn.style.display = open ? 'flex' : 'none';
    if (window.AbbraccinoFace) AbbraccinoFace.setSmile(open);
    // su touch non diamo il focus: la tastiera coprirebbe meta' pannello
    if (open) {
      loadVoci();
      if (!('ontouchstart' in window)) inputEl.focus();
      if (!greeted) { greeted = true; speak('Ciao! Sono Abbraccino. Posso aiutarti a trovare il servizio giusto e dirti i costi. Di cosa hai bisogno?'); }
    }
    else stopSpeech();
  }

  function chiudi() {
    // nasconde il lanciatore (e il pannello se aperto) per tutta la visita
    try { sessionStorage.setItem('ab-nascosto', '1'); } catch (e) {}
    col.style.display = 'none';
    closeBtn.style.display = 'none';
    panel.style.display = 'none';
    open = false;
  }

  function build() {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ab-nascosto')) return;
    col = document.createElement('div');
    col.className = 'ab-col';
    col.innerHTML =
      '<button class="ab-lbl ab-lbl-top">Sono Abbraccino 💛</button>' +
      '<button class="ab-x" aria-label="Chiudi Abbraccino">✕</button>' +
      '<button class="ab-btn" aria-label="Chiedi ad Abbraccino"><span class="ab-face-slot"></span></button>' +
      '<button class="ab-lbl ab-lbl-btm">Abbraccino Aiutino</button>';
    col.querySelectorAll('.ab-btn, .ab-lbl').forEach(function (b) { b.onclick = function () { setOpen(true); }; });
    col.querySelector('.ab-x').onclick = function (e) { e.stopPropagation(); chiudi(); };

    closeBtn = document.createElement('button');
    closeBtn.className = 'ab-btn';
    closeBtn.id = 'ab-xfloat';
    closeBtn.style.cssText += ';position:fixed;right:14px;bottom:92px;z-index:100001;display:none;background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff;font-size:24px;animation:none';
    closeBtn.textContent = '✕';

    panel = document.createElement('div');
    panel.className = 'ab-panel';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="ab-head"><span class="ab-face-slot"></span> Abbraccino — assistente' +
      '<button type="button" class="ab-voice" aria-pressed="' + voiceOn + '" aria-label="' + (voiceOn ? 'Sospendi risposte vocali' : 'Attiva risposte vocali') + '" title="Risposte vocali">♪</button>' +
      '<button type="button" class="ab-close" aria-label="Chiudi Abbraccino">✕</button></div>' +
      '<div class="ab-msgs"></div>' +
      '<form class="ab-form">' +
      '<input type="text" placeholder="Scrivi o detta cosa ti serve…">' +
      '<button type="button" class="ab-mic" title="Parla" style="display:none">🎤</button>' +
      '<button type="submit" class="ab-send" title="Invia">➤</button>' +
      '</form>' +
      '<button type="button" class="ab-motion" aria-pressed="false">Ferma gli spostamenti</button>';

    document.body.appendChild(col);
    document.body.appendChild(closeBtn);
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('.ab-msgs');
    inputEl = panel.querySelector('input');
    micBtn = panel.querySelector('.ab-mic');

    // mascotte animata: occhi che seguono, sorriso, braccia ad abbraccio
    if (window.AbbraccinoFace) {
      AbbraccinoFace.mount(col.querySelector('.ab-face-slot'));
      AbbraccinoFace.mount(panel.querySelector('.ab-face-slot'));
    }

    // chiusura robusta: click e touchend, sia sulla X dell'header sia sul bottone flottante
    function bindClose(el) {
      ['click', 'touchend'].forEach(function (ev) {
        el.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); setOpen(false); }, { passive: false });
      });
    }
    bindClose(panel.querySelector('.ab-close'));
    bindClose(closeBtn);
    // tocco fuori dal pannello (o tasto Esc) chiude la chat
    document.addEventListener('pointerdown', function (e) {
      if (!open) return;
      if (panel.contains(e.target) || closeBtn.contains(e.target)) return;
      setOpen(false);
    }, true);
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') setOpen(false); });

    panel.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); invia(); });

    // voce TTS: ♪ nell'header attiva/disattiva le risposte vocali
    var voiceBtn = panel.querySelector('.ab-voice');
    if (!('speechSynthesis' in window)) voiceBtn.style.display = 'none';
    voiceBtn.onclick = function () {
      if (!('speechSynthesis' in window)) { voiceBtn.style.display = 'none'; return; }
      voiceOn = !voiceOn;
      try { localStorage.setItem('ab-voice', voiceOn ? '1' : '0'); } catch (e) {}
      voiceBtn.setAttribute('aria-pressed', String(voiceOn));
      voiceBtn.setAttribute('aria-label', voiceOn ? 'Sospendi risposte vocali' : 'Attiva risposte vocali');
      if (voiceOn) speak('Voce attiva! Sono Abbraccino, il tuo aiutino.');
      else stopSpeech();
    };

    // la mascotte si sposta dolcemente sul sito (si ferma su hover, scrittura, scroll)
    startWander(col, function () { return open; }, panel);

    addMsg('Ciao! Sono Abbraccino 💛 Posso aiutarti a trovare il servizio giusto, spiegarti come funziona e dirti i costi. Di cosa hai bisogno?', 'bot');

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      micBtn.style.display = 'flex';
      var listening = false, rec;
      micBtn.onclick = function () {
        if (listening) { rec.stop(); return; }
        rec = new SR();
        rec.lang = 'it-IT';
        rec.interimResults = false;
        rec.onresult = function (e) { inputEl.value = (inputEl.value + ' ' + e.results[0][0].transcript).trim(); invia(); };
        rec.onend = function () { listening = false; micBtn.classList.remove('on'); };
        rec.onerror = function () { listening = false; micBtn.classList.remove('on'); };
        listening = true;
        micBtn.classList.add('on');
        rec.start();
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
