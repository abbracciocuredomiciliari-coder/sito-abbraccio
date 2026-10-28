// Injects a territory badge after the first </h1> on service pages.
const fs = require('fs');
const ROMA = new Set(['infermiere-a-domicilio','fisioterapia-a-domicilio','assistenza-anziani','cure-pazienti-cronici','assistenza-notturna','cure-palliative','psicologia-a-domicilio','visite-specialistiche','servizio-ambulanza','holter-pressorio','holter-ecg','apnee-sonno','screening-cardiaci','saturimetria-spirometria','prelievi-ematici','emogasanalisi','rx-domiciliare','ecografia-domiciliare','servizi','esami-strumentali']);
const ITALIA = new Set(['intermediazione']);

for (const slug of ROMA) {
  const f = slug + '.html';
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('zone-badge')) { console.log('skip', f); continue; }
  h = h.replace('</h1>', '</h1>\n          <div class="zone-badge"><i class="fas fa-location-dot"></i> Disponibile a Roma e Provincia</div>');
  fs.writeFileSync(f, h);
  console.log('roma', f);
}
for (const slug of ITALIA) {
  const f = slug + '.html';
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('zone-badge')) { console.log('skip', f); continue; }
  h = h.replace('</h1>', '</h1>\n          <div class="zone-badge zone-badge-it"><i class="fas fa-map"></i> Disponibile in tutta Italia</div>');
  fs.writeFileSync(f, h);
  console.log('italia', f);
}
console.log('done');
