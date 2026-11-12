/* Verifica disponibilità informativa. Non redige né certifica il testo legale.
   Caricare PRIMA di recruitment.js. Ripubblicare l'informativa reale mancante. */
(function(){
 'use strict';
 const form=document.getElementById('application');if(!form)return;
 const button=document.getElementById('submitApplication'),result=document.getElementById('applicationResult');
 const target=new URL('/privacy-candidature.html',location.origin);
 let available=false;
 form.addEventListener('submit',event=>{if(!available){event.preventDefault();event.stopImmediatePropagation();if(result)result.textContent='Informativa candidature non disponibile. Contatta il centro; il modulo non è stato inviato.';}},true);
 if(button)button.disabled=true;
 const consent=document.getElementById('consentText');
 if(consent){const link=document.createElement('a');link.href=target.href;link.target='_blank';link.rel='noopener';link.textContent='informativa candidature';consent.replaceChildren(document.createTextNode('Ho letto l’'),link,document.createTextNode(' e chiedo di essere ricontattato/a per la selezione.'));}
 fetch(target.href,{method:'GET',cache:'no-store',credentials:'same-origin'}).then(response=>{
  available=response.ok&&(response.headers.get('Content-Type')||'').includes('text/html')&&new URL(response.url).pathname===target.pathname;
  if(!available)throw Error('Informativa non disponibile');if(button)button.disabled=false;
 }).catch(()=>{if(result)result.textContent='Il modulo è temporaneamente sospeso: manca l’informativa candidature. Per informazioni: 06 01905242.';});
})();
