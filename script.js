// ===== Mobile Navigation =====

const hamburger = document.getElementById('hamburger');

const navMenu = document.getElementById('navMenu');

const navLinks = document.querySelectorAll('.nav-link');



hamburger.addEventListener('click', () => {

    hamburger.classList.toggle('active');

    navMenu.classList.toggle('active');

    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';

});



navLinks.forEach(link => {

    link.addEventListener('click', () => {

        hamburger.classList.remove('active');

        navMenu.classList.remove('active');

        document.body.style.overflow = '';

    });

});



// ===== Header scroll effect =====

const header = document.getElementById('header');

window.addEventListener('scroll', () => {

    if (window.scrollY > 40) header.classList.add('scrolled');

    else header.classList.remove('scrolled');

});



// ===== Smooth scroll for anchor links =====

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener('click', function (e) {

        const target = document.querySelector(this.getAttribute('href'));

        if (target) {

            e.preventDefault();

            const offset = 80;

            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({ top, behavior: 'smooth' });

        }

    });

});



// ===== Scroll reveal animations =====

const revealEls = document.querySelectorAll('.service-card, .exam-card, .figure-card, .trust-item, .contact-item, .benefit-item, .section-header, .howit-step, .review-card, .faq-item, .rating-summary');

revealEls.forEach(el => el.classList.add('reveal'));



const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach((entry, i) => {

        if (entry.isIntersecting) {

            setTimeout(() => entry.target.classList.add('visible'), (i % 4) * 80);

            revealObserver.unobserve(entry.target);

        }

    });

}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });



revealEls.forEach(el => revealObserver.observe(el));



// ===== Animated counters =====

function animateCounter(el, target, duration = 1800) {

    let start = 0;

    const stepTime = 16;

    const increment = target / (duration / stepTime);

    function update() {

        start += increment;

        if (start < target) {

            el.textContent = Math.floor(start);

            requestAnimationFrame(update);

        } else {

            el.textContent = target;

        }

    }

    update();

}



const counters = document.querySelectorAll('.stat-number');

const counterObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            const target = parseInt(entry.target.dataset.target, 10);

            animateCounter(entry.target, target);

            counterObserver.unobserve(entry.target);

        }

    });

}, { threshold: 0.5 });



counters.forEach(c => counterObserver.observe(c));



// ===== Form submission via WhatsApp =====

const WHATSAPP_NUMBER = '393514175117';

const form = document.querySelector('.form');

if (form) {

    form.addEventListener('submit', (e) => {

        e.preventDefault();



        const nome = document.getElementById('name').value.trim();

        const email = document.getElementById('email').value.trim();

        const telefono = document.getElementById('phone').value.trim();

        const select = document.getElementById('service');

        const servizio = select.options[select.selectedIndex]?.text || '';

        const messaggio = document.getElementById('message').value.trim();



        const testo =

            `*Nuova richiesta dal sito Abbraccio*%0A%0A` +

            `*Nome:* ${nome}%0A` +

            `*Email:* ${email}%0A` +

            `*Telefono:* ${telefono}%0A` +

            `*Servizio:* ${servizio}%0A` +

            `*Messaggio:* ${messaggio}`;



        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${testo}`;

        window.open(url, '_blank');



        showMessage('Ti stiamo reindirizzando su WhatsApp per inviare la richiesta!', 'success');

        form.reset();

        if (serviceSelect) serviceSelect.style.color = 'var(--text-light)';

    });

}



function showMessage(message, type) {

    const existing = form.parentNode.querySelector('.success-message, .error-message');

    if (existing) existing.remove();

    const div = document.createElement('div');

    div.className = `${type}-message`;

    div.textContent = message;

    form.parentNode.insertBefore(div, form);

    setTimeout(() => div.remove(), 5000);

}



// ===== Phone formatting =====

const phoneInput = document.getElementById('phone');

if (phoneInput) {

    phoneInput.addEventListener('input', (e) => {

        let v = e.target.value.replace(/\D/g, '');

        if (v.length > 3 && v.length <= 6) v = `${v.slice(0,3)} ${v.slice(3)}`;

        else if (v.length > 6) v = `${v.slice(0,3)} ${v.slice(3,6)} ${v.slice(6,10)}`;

        e.target.value = v;

    });

}



// ===== Select label color =====

const serviceSelect = document.getElementById('service');

if (serviceSelect) {

    serviceSelect.addEventListener('change', () => {

        serviceSelect.style.color = serviceSelect.value ? 'var(--text-dark)' : 'var(--text-light)';

    });

}



// ===== Current year in footer =====

const year = new Date().getFullYear();

document.querySelectorAll('.footer-bottom p').forEach(p => {

    p.textContent = p.textContent.replace('2024', year);

});



// ===== Hero parallax on mouse move (desktop) =====

const heroVisual = document.querySelector('.hero-visual');

if (heroVisual && window.innerWidth > 992) {

    document.querySelector('.hero').addEventListener('mousemove', (e) => {

        const { innerWidth, innerHeight } = window;

        const x = (e.clientX - innerWidth / 2) / 50;

        const y = (e.clientY - innerHeight / 2) / 50;

        heroVisual.style.transform = `translate(${x}px, ${y}px)`;

    });

}



// ===== Scroll to top button =====

const scrollTopBtn = document.getElementById('scrollTop');

if (scrollTopBtn) {

    window.addEventListener('scroll', () => {

        if (window.scrollY > 500) scrollTopBtn.classList.add('visible');

        else scrollTopBtn.classList.remove('visible');

    });

    scrollTopBtn.addEventListener('click', () => {

        window.scrollTo({ top: 0, behavior: 'smooth' });

    });

}



// ===== Cookie banner =====

const cookieBanner = document.getElementById('cookieBanner');

const cookieAccept = document.getElementById('cookieAccept');

if (cookieBanner && cookieAccept) {

    if (!localStorage.getItem('cookieAccepted')) {

        setTimeout(() => cookieBanner.classList.add('visible'), 1200);

    }

    cookieAccept.addEventListener('click', () => {

        localStorage.setItem('cookieAccepted', 'true');

        cookieBanner.classList.remove('visible');

    });

}



// ===== Floating cards carosello hero =====

const heroItems = [

    { icon: 'fas fa-user-nurse',       color: 'fc-icon-green',  title: 'Infermiere',          sub: 'In arrivo a casa' },

    { icon: 'fas fa-heart-pulse',      color: '',               title: 'Holter Pressorio',    sub: 'Monitoraggio 24h' },

    { icon: 'fas fa-moon',             color: 'fc-icon-purple', title: 'Apnee del Sonno',     sub: 'Screening notturno' },

    { icon: 'fas fa-wave-square',      color: '',               title: 'Holter ECG',          sub: 'ECG dinamico 48h' },

    { icon: 'fas fa-hand-holding-heart', color: 'fc-icon-green', title: 'Assistenza OSS',     sub: 'Supporto quotidiano' },

    { icon: 'fas fa-droplet',          color: '',               title: 'Prelievi Ematici',    sub: 'A domicilio' },

    { icon: 'fas fa-x-ray',            color: 'fc-icon-purple', title: 'RX Domiciliare',      sub: 'Radiografia portatile' },

    { icon: 'fas fa-stethoscope',      color: 'fc-icon-green',  title: 'Medico Specialista',  sub: 'Visita a domicilio' },

    { icon: 'fas fa-lungs',            color: '',               title: 'Spirometria',         sub: 'Funzione respiratoria' },

    { icon: 'fas fa-ambulance',        color: 'fc-icon-purple', title: 'Servizio Ambulanza',  sub: 'Trasporto sanitario' },

    { icon: 'fas fa-brain',            color: 'fc-icon-green',  title: 'Assistenza Anziani',  sub: 'Cura personalizzata' },

    { icon: 'fas fa-syringe',          color: '',               title: 'Terapie Infusionali', sub: 'A casa tua' },

];



function updateCard(cardEl, iconEl, titleEl, subEl, item) {

    cardEl.style.opacity = '0';

    cardEl.style.transform = cardEl.id === 'heroCard1'

        ? 'translateY(8px)' : 'translateY(8px)';

    setTimeout(() => {

        iconEl.className = 'fc-icon' + (item.color ? ' ' + item.color : '');

        iconEl.innerHTML = `<i class="${item.icon}"></i>`;

        titleEl.textContent = item.title;

        subEl.textContent = item.sub;

        cardEl.style.opacity = '1';

        cardEl.style.transform = 'translateY(0)';

    }, 350);

}



const card1 = document.getElementById('heroCard1');

const card2 = document.getElementById('heroCard2');

if (card1 && card2) {

    [card1, card2].forEach(c => {

        c.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

    });



    let idx1 = 0;

    let idx2 = Math.floor(heroItems.length / 2);



    setInterval(() => {

        idx1 = (idx1 + 1) % heroItems.length;

        updateCard(

            card1,

            document.getElementById('heroCard1Icon'),

            document.getElementById('heroCard1Title'),

            document.getElementById('heroCard1Sub'),

            heroItems[idx1]

        );

    }, 3000);



    setInterval(() => {

        idx2 = (idx2 + 1) % heroItems.length;

        updateCard(

            card2,

            document.getElementById('heroCard2Icon'),

            document.getElementById('heroCard2Title'),

            document.getElementById('heroCard2Sub'),

            heroItems[idx2]

        );

    }, 4200);

}



// ===== FAQ Accordion =====

document.querySelectorAll('.faq-q').forEach(btn => {

    btn.addEventListener('click', () => {

        const item = btn.closest('.faq-item');

        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

        if (!isOpen) item.classList.add('open');

    });

});



console.log('%c🏥 Abbraccio Cure Domiciliari', 'color:#1a2e5a;font-size:20px;font-weight:bold;');

console.log('%cAssistenza e diagnostica a domicilio', 'color:#c9a227;font-size:13px;');

