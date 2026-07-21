(() => {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey || !window.supabase) return;

    const client = window.supabase.createClient(url, publishableKey);
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const saveMessage = document.getElementById('saveMessage');
    const editorPanel = document.getElementById('editorPanel');
    const tabs = document.getElementById('editorTabs');

    const targetMap = {
        hero_badge: { selector: '.hero-badge span', type: 'text', label: 'Etichetta superiore' },
        hero_location_title: { selector: '.hero-locality strong', type: 'text', label: 'Zona operativa' },
        hero_location_subtitle: { selector: '.hero-locality span', type: 'text', label: 'Sottotitolo zona' },
        hero_title: { selector: '.hero-title', type: 'html', label: 'Titolo principale' },
        hero_subtitle: { selector: '.hero-subtitle', type: 'html', label: 'Descrizione principale' },
        hero_call_label: { selector: '.hero-call-action', type: 'text', label: 'Testo pulsante chiama' },
        services_title: { selector: '#servizi .section-header h2', type: 'text', label: 'Titolo sezione servizi' },
        services_subtitle: { selector: '#servizi .section-header p', type: 'text', label: 'Sottotitolo sezione servizi' },
        exams_title: { selector: '#esami .section-header h2', type: 'text', label: 'Titolo sezione esami' },
        exams_subtitle: { selector: '#esami .section-header p', type: 'text', label: 'Sottotitolo sezione esami' },
        exams_image: { selector: '.exams-feature-image img', type: 'image', label: 'Immagine principale esami' },
        figures_title: { selector: '#figure .section-header h2', type: 'text', label: 'Titolo figure assistenziali' },
        figures_subtitle: { selector: '#figure .section-header p', type: 'text', label: 'Sottotitolo figure assistenziali' },
        gallery_tag: { selector: '.gallery-section .section-tag', type: 'text', label: 'Etichetta sezione' },
        gallery_title: { selector: '.gallery-section .section-header h2', type: 'text', label: 'Titolo sezione' },
        gallery_subtitle: { selector: '.gallery-section .section-header p', type: 'text', label: 'Sottotitolo sezione' },
        faq_tag: { selector: '#faq .section-tag', type: 'text', label: 'Etichetta sezione' },
        faq_title: { selector: '#faq .section-header h2', type: 'text', label: 'Titolo sezione' },
        faq_subtitle: { selector: '#faq .section-header p', type: 'text', label: 'Sottotitolo sezione' }
    };

    const sections = {
        hero: { title: 'In evidenza', keys: ['hero_badge', 'hero_location_title', 'hero_location_subtitle', 'hero_title', 'hero_subtitle', 'hero_call_label'] },
        services: { title: 'Servizi', keys: ['services_title', 'services_subtitle'] },
        figures: { title: 'Figure assistenziali', keys: ['figures_title', 'figures_subtitle'] },
        exams: { title: 'Esami strumentali', keys: ['exams_title', 'exams_subtitle', 'exams_image'] },
        gallery: { title: 'Galleria', keys: ['gallery_tag', 'gallery_title', 'gallery_subtitle'] },
        faq: { title: 'Domande frequenti', keys: ['faq_tag', 'faq_title', 'faq_subtitle'] },
        events: { title: 'Eventi', keys: [] }
    };

    for (let index = 0; index < 7; index += 1) {
        targetMap[`service_${index + 1}_title`] = { selector: `.service-card:nth-child(${index + 1}) h3`, type: 'text', label: 'Titolo' };
        targetMap[`service_${index + 1}_description`] = { selector: `.service-card:nth-child(${index + 1}) .service-content > p`, type: 'text', label: 'Descrizione' };
        targetMap[`service_${index + 1}_image`] = { selector: `.service-card:nth-child(${index + 1}) .service-image img`, type: 'image', label: 'Foto' };
        sections.services.keys.push(`service_${index + 1}_title`, `service_${index + 1}_description`, `service_${index + 1}_image`);
    }

    for (let index = 0; index < 5; index += 1) {
        targetMap[`gallery_${index + 1}_image`] = { selector: `.gallery-item:nth-child(${index + 1}) img`, type: 'image', label: 'Foto galleria' };
        sections.gallery.keys.push(`gallery_${index + 1}_image`);
    }

    for (let index = 0; index < 7; index += 1) {
        targetMap[`faq_${index + 1}_question`] = { selector: `.faq-item:nth-child(${index + 1}) .faq-q`, type: 'question', label: 'Domanda' };
        targetMap[`faq_${index + 1}_answer`] = { selector: `.faq-item:nth-child(${index + 1}) .faq-a p`, type: 'text', label: 'Risposta' };
        sections.faq.keys.push(`faq_${index + 1}_question`, `faq_${index + 1}_answer`);
    }

    for (let index = 0; index < 4; index += 1) {
        targetMap[`figure_${index + 1}_title`] = { selector: `.figure-card:nth-child(${index + 1}) h3`, type: 'text', label: 'Titolo' };
        targetMap[`figure_${index + 1}_description`] = { selector: `.figure-card:nth-child(${index + 1}) .figure-info p`, type: 'text', label: 'Descrizione' };
        targetMap[`figure_${index + 1}_image`] = { selector: `.figure-card:nth-child(${index + 1}) .figure-img img`, type: 'image', label: 'Foto' };
        sections.figures.keys.push(`figure_${index + 1}_title`, `figure_${index + 1}_description`, `figure_${index + 1}_image`);
    }

    let defaults = {};
    let savedContent = {};
    let activeSection = 'hero';

    function setMessage(element, message, error = false) {
        element.textContent = message;
        element.style.color = error ? '#b42318' : '#15803d';
    }

    async function loadDefaults() {
        const response = await fetch('index.html', { cache: 'no-store' });
        const html = await response.text();
        const documentFromSite = new DOMParser().parseFromString(html, 'text/html');
        Object.entries(targetMap).forEach(([key, target]) => {
            const element = documentFromSite.querySelector(target.selector);
            if (!element) return;
            defaults[key] = target.type === 'image' ? element.getAttribute('src') : target.type === 'html' ? element.innerHTML.trim() : target.type === 'question' ? element.childNodes[0]?.textContent.trim() || '' : element.textContent.trim();
        });
    }

    async function loadSavedContent() {
        const { data, error } = await client.from('site_content').select('content_key, content_value');
        if (error) throw error;
        savedContent = Object.fromEntries((data || []).map(item => [item.content_key, item.content_value]));
    }

    function fieldValue(key) {
        return savedContent[key] || defaults[key] || '';
    }

    function cardName(key) {
        const match = key.match(/^(service|figure|faq)_(\d+)_/);
        if (!match) return sections[activeSection].title;
        if (match[1] === 'faq') return `Domanda ${match[2]}`;
        const titleKey = `${match[1]}_${match[2]}_title`;
        return fieldValue(titleKey) || `${match[1] === 'service' ? 'Servizio' : 'Figura'} ${match[2]}`;
    }

    function createField(key) {
        const target = targetMap[key];
        const wrapper = document.createElement('div');
        wrapper.className = 'editor-field';
        const label = document.createElement('label');
        label.textContent = target.label;
        wrapper.append(label);

        if (target.type === 'image') {
            const preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.src = fieldValue(key);
            preview.alt = 'Anteprima foto';
            const upload = document.createElement('div');
            upload.className = 'upload-row';
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp';
            input.dataset.key = key;
            input.addEventListener('change', () => {
                if (input.files[0]) preview.src = URL.createObjectURL(input.files[0]);
            });
            upload.append(input);
            wrapper.append(preview, upload);
        } else {
            const input = target.type === 'html' || target.type === 'question' || target.label === 'Descrizione' || target.label === 'Risposta' || key.includes('subtitle') ? document.createElement('textarea') : document.createElement('input');
            if (input.tagName === 'INPUT') input.type = 'text';
            input.value = fieldValue(key);
            input.dataset.key = key;
            wrapper.append(input);
        }
        return wrapper;
    }

    async function renderReviews() {
        editorPanel.replaceChildren();
        const loading = document.createElement('p');
        loading.className = 'empty-state';
        loading.textContent = 'Caricamento recensioni...';
        editorPanel.append(loading);
        const { data, error } = await client
            .from('reviews')
            .select('id, reviewer_name, location, rating, review_text, status, created_at')
            .order('created_at', { ascending: false });
        if (error) {
            loading.textContent = 'Non è stato possibile caricare le recensioni.';
            return;
        }
        if (!data?.length) {
            loading.textContent = 'Non ci sono recensioni da moderare.';
            return;
        }
        const grid = document.createElement('div');
        grid.className = 'editor-grid';
        data.forEach(review => {
            const card = document.createElement('article');
            card.className = 'editor-card review-moderation-card';
            const heading = document.createElement('h2');
            heading.textContent = review.reviewer_name;
            const meta = document.createElement('p');
            meta.className = 'review-admin-meta';
            meta.textContent = `${review.location} · ${review.rating}/5 stelle · ${new Date(review.created_at).toLocaleDateString('it-IT')}`;
            const text = document.createElement('p');
            text.className = 'review-admin-text';
            text.textContent = review.review_text;
            const status = document.createElement('span');
            status.className = `review-status ${review.status}`;
            status.textContent = review.status === 'approved' ? 'Pubblicata' : 'In attesa';
            const actions = document.createElement('div');
            actions.className = 'review-admin-actions';
            if (review.status === 'pending') {
                const approve = document.createElement('button');
                approve.type = 'button';
                approve.className = 'approve-review-button';
                approve.innerHTML = '<i class="fas fa-check"></i> Approva e pubblica';
                approve.addEventListener('click', () => moderateReview(review.id, 'approved'));
                actions.append(approve);
            }
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'delete-review-button';
            remove.innerHTML = '<i class="fas fa-trash"></i> Elimina';
            remove.addEventListener('click', () => deleteReview(review.id));
            actions.append(remove);
            card.append(heading, meta, text, status, actions);
            grid.append(card);
        });
        editorPanel.replaceChildren(grid);
    }

    async function moderateReview(id, status) {
        const { error } = await client.from('reviews').update({ status }).eq('id', id);
        if (error) return setMessage(saveMessage, 'Non è stato possibile approvare la recensione.', true);
        setMessage(saveMessage, 'Recensione approvata e pubblicata.');
        renderReviews();
    }

    async function deleteReview(id) {
        if (!window.confirm('Eliminare definitivamente questa recensione?')) return;
        const { error } = await client.from('reviews').delete().eq('id', id);
        if (error) return setMessage(saveMessage, 'Non è stato possibile eliminare la recensione.', true);
        setMessage(saveMessage, 'Recensione eliminata.');
        renderReviews();
    }

    function renderEditor() {
        if (activeSection === 'reviews') {
            renderReviews();
            return;
        }
        const section = sections[activeSection];
        editorPanel.replaceChildren();
        const grid = document.createElement('div');
        grid.className = 'editor-grid';
        const groups = new Map();
        section.keys.forEach(key => {
            const group = activeSection === 'services' || activeSection === 'figures' ? cardName(key) : section.title;
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(key);
        });
        groups.forEach((keys, title) => {
            const card = document.createElement('article');
            card.className = 'editor-card';
            const heading = document.createElement('h2');
            heading.textContent = title;
            card.append(heading);
            keys.forEach(key => card.append(createField(key)));
            const save = document.createElement('button');
            save.className = 'save-button';
            save.type = 'button';
            save.innerHTML = '<i class="fas fa-floppy-disk"></i> Salva modifiche';
            save.addEventListener('click', () => saveCard(card, keys, save));
            card.append(save);
            grid.append(card);
        });
        editorPanel.append(grid);
    }

    async function uploadImage(key, file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const safeName = `${key}-${Date.now()}.${extension}`;
        const { error } = await client.storage.from('site-images').upload(safeName, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
        if (error) throw error;
        return client.storage.from('site-images').getPublicUrl(safeName).data.publicUrl;
    }

    async function saveCard(card, keys, button) {
        button.disabled = true;
        button.textContent = 'Salvataggio...';
        setMessage(saveMessage, '');
        try {
            const entries = [];
            for (const key of keys) {
                const target = targetMap[key];
                let value;
                if (target.type === 'image') {
                    const input = card.querySelector(`input[type="file"][data-key="${key}"]`);
                    value = input.files[0] ? await uploadImage(key, input.files[0]) : fieldValue(key);
                } else {
                    value = card.querySelector(`[data-key="${key}"]`).value.trim();
                }
                entries.push({ content_key: key, content_value: value });
                savedContent[key] = value;
            }
            const { error } = await client.from('site_content').upsert(entries, { onConflict: 'content_key' });
            if (error) throw error;
            setMessage(saveMessage, 'Modifiche salvate e pubblicate.');
            renderEditor();
        } catch (error) {
            setMessage(saveMessage, error.message || 'Non è stato possibile salvare.', true);
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-floppy-disk"></i> Salva modifiche';
        }
    }

    async function showDashboard() {
        const { data: { session } } = await client.auth.getSession();
        if (!session) return;
        const { data: isAdmin, error } = await client.rpc('is_admin');
        if (error || !isAdmin) {
            await client.auth.signOut();
            setMessage(loginMessage, 'Questo account non è autorizzato.', true);
            return;
        }
        try {
            await Promise.all([loadDefaults(), loadSavedContent()]);
            loginView.hidden = true;
            dashboardView.hidden = false;
            renderEditor();
        } catch (error) {
            setMessage(loginMessage, 'Configurazione incompleta: esegui prima lo script SQL in Supabase.', true);
        }
    }

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        setMessage(loginMessage, 'Accesso in corso...');
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) return setMessage(loginMessage, error.message, true);
        await showDashboard();
    });

    document.getElementById('logoutButton').addEventListener('click', async () => {
        await client.auth.signOut();
        dashboardView.hidden = true;
        loginView.hidden = false;
        loginForm.reset();
    });

    tabs.addEventListener('click', event => {
        const button = event.target.closest('button[data-section]');
        if (!button) return;
        activeSection = button.dataset.section;
        tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
        renderEditor();
    });

    showDashboard();
})();
