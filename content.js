(() => {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey || !window.supabase) return;

    const client = window.supabase.createClient(url, publishableKey);
    const targets = {
        hero_badge: { selector: '.hero-badge span', type: 'text' },
        hero_location_title: { selector: '.hero-locality strong', type: 'text' },
        hero_location_subtitle: { selector: '.hero-locality span', type: 'text' },
        hero_title: { selector: '.hero-title', type: 'html' },
        hero_subtitle: { selector: '.hero-subtitle', type: 'html' },
        hero_call_label: { selector: '.hero-call-action', type: 'text' },
        services_title: { selector: '#servizi .section-header h2', type: 'text' },
        services_subtitle: { selector: '#servizi .section-header p', type: 'text' },
        exams_title: { selector: '#esami .section-header h2', type: 'text' },
        exams_subtitle: { selector: '#esami .section-header p', type: 'text' },
        exams_image: { selector: '.exams-feature-image img', type: 'image' },
        figures_title: { selector: '#figure .section-header h2', type: 'text' },
        figures_subtitle: { selector: '#figure .section-header p', type: 'text' },
        gallery_tag: { selector: '.gallery-section .section-tag', type: 'text' },
        gallery_title: { selector: '.gallery-section .section-header h2', type: 'text' },
        gallery_subtitle: { selector: '.gallery-section .section-header p', type: 'text' },
        faq_tag: { selector: '#faq .section-tag', type: 'text' },
        faq_title: { selector: '#faq .section-header h2', type: 'text' },
        faq_subtitle: { selector: '#faq .section-header p', type: 'text' },
        contact_phone: { selector: '.contact-details a[href^="tel:"]', type: 'text' }
    };

    for (let index = 0; index < 7; index += 1) {
        targets[`service_${index + 1}_title`] = { selector: `.service-card:nth-child(${index + 1}) h3`, type: 'text' };
        targets[`service_${index + 1}_description`] = { selector: `.service-card:nth-child(${index + 1}) .service-content > p`, type: 'text' };
        targets[`service_${index + 1}_image`] = { selector: `.service-card:nth-child(${index + 1}) .service-image img`, type: 'image' };
    }

    for (let index = 0; index < 5; index += 1) {
        targets[`gallery_${index + 1}_image`] = { selector: `.gallery-item:nth-child(${index + 1}) img`, type: 'image' };
    }

    for (let index = 0; index < 7; index += 1) {
        targets[`faq_${index + 1}_question`] = { selector: `.faq-item:nth-child(${index + 1}) .faq-q`, type: 'question' };
        targets[`faq_${index + 1}_answer`] = { selector: `.faq-item:nth-child(${index + 1}) .faq-a p`, type: 'text' };
    }

    for (let index = 0; index < 4; index += 1) {
        targets[`figure_${index + 1}_title`] = { selector: `.figure-card:nth-child(${index + 1}) h3`, type: 'text' };
        targets[`figure_${index + 1}_description`] = { selector: `.figure-card:nth-child(${index + 1}) .figure-info p`, type: 'text' };
        targets[`figure_${index + 1}_image`] = { selector: `.figure-card:nth-child(${index + 1}) .figure-img img`, type: 'image' };
    }

    async function loadContent() {
        const { data, error } = await client.from('site_content').select('content_key, content_value');
        if (error || !data) return;

        data.forEach(({ content_key: key, content_value: value }) => {
            const target = targets[key];
            const element = target && document.querySelector(target.selector);
            if (!element || !value) return;

            if (target.type === 'image') {
                element.src = value;
            } else if (target.type === 'html') {
                element.innerHTML = value;
            } else if (target.type === 'question') {
                const icon = document.createElement('i');
                icon.className = 'fas fa-chevron-down';
                element.replaceChildren(document.createTextNode(`${value} `), icon);
            } else {
                element.textContent = value;
            }
        });
    }

    loadContent();
})();
