// Injects canonical + Open Graph + Twitter card + JSON-LD into all public pages.
// Run once with: node inject-seo.js  (idempotent — skips pages already tagged)
const fs = require('fs');
const defaults = require('./admin-defaults.json');

const BASE = 'https://www.abbracciocuredomiciliari.it';
const SKIP = new Set(['admin.html', 'shop-admin.html', 'app.html']);
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const biz = {
  '@type': 'MedicalBusiness',
  '@id': BASE + '/#business',
  'name': 'Abbraccio Cure Domiciliari',
  'url': BASE + '/',
  'telephone': '+39 06 01905242',
  'email': 'info@abbracciocuredomiciliari.it',
  'address': { '@type': 'PostalAddress', 'streetAddress': 'Via di S. Maria Ausiliatrice 4/B', 'addressLocality': 'Roma', 'postalCode': '00181', 'addressCountry': 'IT' },
  'areaServed': ['Roma', 'Provincia di Roma', 'Lazio'],
  'image': BASE + '/images/IMG-20260616-WA0026.jpg',
  'logo': BASE + '/logo-abbraccio.png'
};

for (const f of fs.readdirSync('.')) {
  if (!f.endsWith('.html') || SKIP.has(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('property="og:title"')) { console.log('skip', f); continue; }

  const slug = f.replace(/\.html$/, '');
  const url = BASE + '/' + (slug === 'index' ? '' : f);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Abbraccio Cure Domiciliari';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || strip(title);
  const pageDef = defaults.pages[slug];
  const img = (pageDef && pageDef.image) || defaults.global.heroImage || 'images/IMG-20260616-WA0026.jpg';
  const imgAbs = img.startsWith('http') ? img : BASE + '/' + img;

  const meta = [
    `  <link rel="canonical" href="${url}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:locale" content="it_IT">`,
    `  <meta property="og:site_name" content="Abbraccio Cure Domiciliari">`,
    `  <meta property="og:title" content="${esc(title)}">`,
    `  <meta property="og:description" content="${esc(desc)}">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${imgAbs}">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${esc(title)}">`,
    `  <meta name="twitter:description" content="${esc(desc)}">`,
    `  <meta name="twitter:image" content="${imgAbs}">`
  ];

  // JSON-LD
  const graphs = [];
  if (slug === 'index') {
    graphs.push(biz);
    graphs.push({ '@type': 'WebSite', 'name': 'Abbraccio Cure Domiciliari', 'url': BASE + '/' });
  } else if (pageDef && (pageDef.h1 || pageDef.label)) {
    graphs.push({
      '@type': 'MedicalWebPage',
      'name': strip(pageDef.h1 || pageDef.label),
      'description': strip(desc),
      'url': url,
      'about': {
        '@type': 'MedicalTherapy',
        'name': strip(pageDef.label || pageDef.h1),
        'provider': { '@type': 'MedicalBusiness', '@id': BASE + '/#business', 'name': 'Abbraccio Cure Domiciliari' },
        'relevantSpecialty': 'Nursing'
      },
      'specialty': 'HomeHealthCare',
      'provider': { '@type': 'MedicalBusiness', '@id': BASE + '/#business', 'name': 'Abbraccio Cure Domiciliari' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE + '/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Servizi', 'item': BASE + '/servizi.html' },
          { '@type': 'ListItem', 'position': 3, 'name': strip(pageDef.label || pageDef.h1), 'item': url }
        ]
      }
    });
    graphs.push({
      '@type': 'Service',
      'name': strip(pageDef.label || pageDef.h1),
      'serviceType': 'Assistenza domiciliare',
      'provider': { '@type': 'MedicalBusiness', '@id': BASE + '/#business', 'name': 'Abbraccio Cure Domiciliari' },
      'areaServed': ['Roma', 'Provincia di Roma']
    });
  }
  if (graphs.length) meta.push(`  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graphs })}</script>`);

  html = html.replace(/(\s*)<\/head>/, '\n' + meta.join('\n') + '\n</head>');
  fs.writeFileSync(f, html);
  console.log('tagged', f);
}
console.log('done');
