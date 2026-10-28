// Injects FAQ accordion (native details/summary) + FAQPage JSON-LD on service pages.
const fs = require('fs');
const defaults = require('./admin-defaults.json');
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const PAGES = ['infermiere-a-domicilio','fisioterapia-a-domicilio','assistenza-anziani','cure-pazienti-cronici','assistenza-notturna','cure-palliative','psicologia-a-domicilio','visite-specialistiche','servizio-ambulanza','holter-pressorio','holter-ecg','apnee-sonno','screening-cardiaci','saturimetria-spirometria','prelievi-ematici','emogasanalisi','rx-domiciliare','ecografia-domiciliare','intermediazione','servizi','esami-strumentali'];
const ITALIA = new Set(['intermediazione']);

for (const slug of PAGES) {
  const f = slug + '.html';
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('faq-section')) { console.log('skip', f); continue; }
  const nome = strip(defaults.pages[slug]?.label || defaults.pages[slug]?.h1 || 'questo servizio');
  const italia = ITALIA.has(slug);
  const zona = italia
    ? 'In tutta Italia. Badanti, colf e assistenti familiari vengono selezionati e attivati a livello nazionale.'
    : 'A Roma e in tutta la provincia, direttamente al tuo domicilio.';
  const chiEroga = italia
    ? 'Badanti, colf e assistenti familiari verificati, selezionati insieme ai nostri partner (tra cui Salus Group).'
    : 'Infermieri, OSS, fisioterapisti e professionisti sanitari qualificati e selezionati.';

  const faqs = [
    [`In quali zone è disponibile ${nome}?`, zona],
    ['Come posso richiedere il servizio?', 'Ci chiami allo 06 01905242 (reperibili H24), ci scrivi su WhatsApp al 351 4175117, oppure compili il modulo online: ti ricontattiamo noi per organizzare tutto.'],
    ['Come funziona il preventivo?', 'Puoi calcolare subito un preventivo online gratuito con il nostro strumento, oppure richiederci un preventivo personalizzato: sempre chiaro e senza impegno.'],
    ['Chi eroga il servizio?', chiEroga],
  ];

  const details = faqs.map(([q, a]) =>
    `        <details class="faq-item"><summary>${q}<i class="fas fa-chevron-down"></i></summary><p>${a}</p></details>`
  ).join('\n');
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    'mainEntity': faqs.map(([q, a]) => ({ '@type': 'Question', 'name': q, 'acceptedAnswer': { '@type': 'Answer', 'text': a } })),
  };

  const block = `
  <!-- FAQ -->
  <section class="faq-section" id="faq" style="padding:56px 0;background:var(--bg-soft);">
    <div class="container" style="max-width:820px;">
      <div class="section-header center">
        <span class="eyebrow">Domande frequenti</span>
        <h2>FAQ — ${nome}</h2>
      </div>
      <div class="faq-list">
${details}
      </div>
    </div>
  </section>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
`;
  h = h.replace(/\s*<footer/, block + '\n<footer');
  fs.writeFileSync(f, h);
  console.log('faq', f);
}
console.log('done');
