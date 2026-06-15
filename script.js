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
const revealEls = document.querySelectorAll('.service-card, .exam-card, .figure-card, .trust-item, .contact-item, .benefit-item, .section-header, .howit-step, .review-card');
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

console.log('%c🏥 Abbraccio Cure Domiciliari', 'color:#2563eb;font-size:20px;font-weight:bold;');
console.log('%cAssistenza e diagnostica a domicilio', 'color:#06b6d4;font-size:13px;');
