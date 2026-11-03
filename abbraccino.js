/* Abbraccino — assistente virtuale Abbraccio (widget sito) */
(function () {
  var API = 'https://api.abbracciocuredomiciliari.it/api';
  var ICON = 'https://app.abbracciocuredomiciliari.it/abbraccino.jpg';
  if (window.__abbraccinoInit) return;
  window.__abbraccinoInit = true;

  var css = document.createElement('style');
  css.textContent = [
    '.ab-btn{position:fixed;bottom:18px;right:18px;width:62px;height:62px;border-radius:50%;border:none;background:#fff;box-shadow:0 6px 22px rgba(30,77,140,.4);z-index:99999;cursor:pointer;padding:4px;box-sizing:border-box}',
    '.ab-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}',
    '.ab-lbl{position:fixed;right:49px;transform:translateX(50%);z-index:99999;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,.12);cursor:pointer;border:none;font-family:inherit;white-space:nowrap}',
    '.ab-lbl-top{bottom:84px;background:#fff;color:#1e4d8c;border:1.5px solid #dbeafe}',
    '.ab-lbl-btm{bottom:2px;background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff}',
    '.ab-panel{position:fixed;bottom:90px;right:14px;width:min(360px,calc(100vw - 28px));max-height:70vh;background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.22);z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid #dbeafe;font-family:"Segoe UI",system-ui,sans-serif}',
    '.ab-head{background:linear-gradient(135deg,#1e3a5f,#1e4d8c);color:#fff;padding:12px 16px;font-weight:800;font-size:.95rem;display:flex;align-items:center;gap:8px}',
    '.ab-head img{width:26px;height:26px;border-radius:50%;object-fit:cover}',
    '.ab-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:46vh}',
    '.ab-msg{max-width:85%;border-radius:14px;padding:9px 12px;font-size:.85rem;line-height:1.45;white-space:pre-wrap}',
    '.ab-msg.bot{align-self:flex-start;background:#f1f5f9;color:#1e293b}',
    '.ab-msg.io{align-self:flex-end;background:#1e4d8c;color:#fff}',
    '.ab-cta{align-self:flex-start;margin-top:-2px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:.8rem;padding:8px 14px;border-radius:999px}',
    '.ab-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0}',
    '.ab-form input{flex:1;padding:10px 12px;border:1px solid #e2e8f0;border-radius:999px;font-size:.88rem;font-family:inherit}',
    '.ab-form button{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px}',
    '.ab-send{background:#1e4d8c;color:#fff}',
    '.ab-mic{background:#e2e8f0;color:#475569}',
    '.ab-mic.on{background:#dc2626;color:#fff;animation:abPulse 1.2s infinite}',
    '@keyframes abPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}'
  ].join('\n');
  document.head.appendChild(css);

  var open = false, busy = false, voci = null, msgsEl, inputEl, micBtn, panel, btn, lblTop, lblBtm;

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
          (c.voci || []).forEach(function (v) { voci.push({ id: v.id, descrizione: v.descrizione, prezzo: v.prezzo, categoria: c.nome }); });
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

  function toggle() {
    open = !open;
    panel.style.display = open ? 'flex' : 'none';
    lblTop.style.display = open ? 'none' : 'block';
    lblBtm.style.display = open ? 'none' : 'block';
    if (open) { loadVoci(); inputEl.focus(); }
  }

  function build() {
    lblTop = document.createElement('button');
    lblTop.className = 'ab-lbl ab-lbl-top';
    lblTop.textContent = 'Sono Abbraccino';
    lblTop.onclick = toggle;

    lblBtm = document.createElement('button');
    lblBtm.className = 'ab-lbl ab-lbl-btm';
    lblBtm.textContent = 'Chiedi aiuto';
    lblBtm.onclick = toggle;

    btn = document.createElement('button');
    btn.className = 'ab-btn';
    btn.setAttribute('aria-label', 'Chiedi ad Abbraccino');
    btn.innerHTML = '<img src="' + ICON + '" alt="Abbraccino">';
    btn.onclick = toggle;

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

    document.body.appendChild(lblTop);
    document.body.appendChild(lblBtm);
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    msgsEl = panel.querySelector('.ab-msgs');
    inputEl = panel.querySelector('input');
    micBtn = panel.querySelector('.ab-mic');

    panel.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); invia(); });

    addMsg('Ciao! Sono Abbraccino 💛 Posso aiutarti a trovare il servizio giusto, spiegarti come funziona e dirti i costi. Di cosa hai bisogno?', 'bot');

    // microfono
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
