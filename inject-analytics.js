// Injects Vercel Web Analytics + contact click tracking into all public pages.
// Run once: node inject-analytics.js  (idempotent — skips pages already tagged)
const fs = require('fs');
const SKIP = new Set(['admin.html', 'shop-admin.html']);

const block = `  <!-- Vercel Web Analytics (privacy-friendly, no cookies) -->
  <script>window.va=window.va||function(){(window.va.q=window.va.q||[]).push(arguments);};</script>
  <script defer src="https://va.vercel-scripts.com/v1/script.js"></script>
  <script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a||!window.va)return;var h=a.getAttribute('href')||'';if(h.indexOf('tel:')===0)window.va('event',{name:'click_telefono',data:{numero:h.slice(4)}});else if(h.indexOf('https://wa.me/')===0)window.va('event',{name:'click_whatsapp'});else if(h.indexOf('app.abbracciocuredomiciliari.it/richiesta')>-1)window.va('event',{name:'click_richiesta'});else if(h.indexOf('app.abbracciocuredomiciliari.it/preventivo')>-1)window.va('event',{name:'click_preventivo'});else if(h.indexOf('app.abbracciocuredomiciliari.it/badante')>-1)window.va('event',{name:'click_calcola_badante'});});</script>`;

let n = 0;
for (const f of fs.readdirSync('.')) {
  if (!f.endsWith('.html') || SKIP.has(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('va.vercel-scripts.com')) { console.log('skip', f); continue; }
  html = html.replace(/\s*<\/body>/, '\n' + block + '\n</body>');
  fs.writeFileSync(f, html);
  n++; console.log('tagged', f);
}
console.log('done:', n, 'pages');
