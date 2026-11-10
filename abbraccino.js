/* Abbraccino — assistente virtuale Abbraccio (widget sito) */
(function () {
  var API = 'https://api.abbracciocuredomiciliari.it/api';
  var ICON = 'https://app.abbracciocuredomiciliari.it/abbraccino.jpg';
  if (window.__abbraccinoInit) return;
  window.__abbraccinoInit = true;

  var css = document.createElement('style');
  css.textContent = [
    '@keyframes abHeartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.18)}28%{transform:scale(1)}42%{transform:scale(1.18)}70%{transform:scale(1)}}',
    '@keyframes abGlow{0%,100%{box-shadow:0 4px 16px rgba(242,181,42,.3),0 0 0 0 rgba(242,181,42,.45)}50%{box-shadow:0 4px 20px rgba(242,181,42,.7),0 0 0 10px rgba(242,181,42,0)}}',
    /* colonna ancorata sopra la barra di navigazione mobile (~60px) */
    '.ab-col{position:fixed;right:14px;bottom:92px;z-index:99998;display:flex;flex-direction:column;align-items:center;gap:5px}',
    '.ab-x{position:absolute;top:-8px;right:-6px;width:22px;height:22px;border-radius:50%;border:none;background:#1e3a5f;color:#fff;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)}',
    '.ab-btn{width:62px;height:62px;border-radius:50%;border:none;background:#fff;cursor:pointer;padding:5px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;animation:abGlow 1.8s ease-in-out infinite}',
    '.ab-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;animation:abHeartBeat 1.8s ease-in-out infinite;transform-origin:center}',
    '.ab-lbl{border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,.12);cursor:pointer;border:none;font-family:inherit;white-space:nowrap}',
    '.ab-lbl-top{background:#fff;color:#1e4d8c;border:1.5px solid #dbeafe}',
    '.ab-lbl-btm{background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff}',
    '.ab-panel{position:fixed;bottom:212px;right:14px;width:min(360px,calc(100vw - 28px));max-height:62vh;background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.22);z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid #dbeafe;font-family:"Segoe UI",system-ui,sans-serif}',
    '.ab-head{background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff;padding:12px 16px;font-weight:800;font-size:.95rem;display:flex;align-items:center;gap:8px}',
    '.ab-head img{width:26px;height:26px;border-radius:50%;object-fit:cover}',
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
    /* Su smartphone il lanciatore e' compatto: una sola pill + icona piccola */
    '@media (max-width:640px){.ab-col{right:10px;bottom:88px;gap:4px}.ab-lbl-top{display:none}.ab-btn{width:46px;height:46px}.ab-lbl-btm{font-size:11px;padding:4px 10px}}'
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

  function setOpen(v) {
    open = v;
    panel.style.display = open ? 'flex' : 'none';
    col.style.display = open ? 'none' : 'flex';
    closeBtn.style.display = open ? 'flex' : 'none';
    if (open) { loadVoci(); inputEl.focus(); }
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
      '<button class="ab-btn" aria-label="Chiedi ad Abbraccino"><img src="' + ICON + '" alt="Abbraccino"></button>' +
      '<button class="ab-lbl ab-lbl-btm">Abbraccino Aiutino</button>';
    col.querySelectorAll('.ab-btn, .ab-lbl').forEach(function (b) { b.onclick = function () { setOpen(true); }; });
    col.querySelector('.ab-x').onclick = function (e) { e.stopPropagation(); chiudi(); };

    closeBtn = document.createElement('button');
    closeBtn.className = 'ab-btn';
    closeBtn.style.cssText += ';position:fixed;right:14px;bottom:92px;z-index:99999;display:none;background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff;font-size:24px;animation:none';
    closeBtn.textContent = '✕';
    closeBtn.onclick = function () { setOpen(false); };

    panel = document.createElement('div');
    panel.className = 'ab-panel';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="ab-head"><img src="' + ICON + '" alt=""> Abbraccino — assistente</div>' +
      '<div class="ab-msgs"></div>' +
      '<form class="ab-form">' +
      '<input type="text" placeholder="Scrivi o detta cosa ti serve…">' +
      '<button type="button" class="ab-mic" title="Parla" style="display:none">🎤</button>' +
      '<button type="submit" class="ab-send" title="Invia">➤</button>' +
      '</form>';

    document.body.appendChild(col);
    document.body.appendChild(closeBtn);
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('.ab-msgs');
    inputEl = panel.querySelector('input');
    micBtn = panel.querySelector('.ab-mic');

    panel.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); invia(); });

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
        rec.onresult = function (e) { inputEl.value = (inputEl.value + ' ' + e.results[0][0].transcript).trim(); };
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
