(() => {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey || !window.supabase) return;

    const client = window.supabase.createClient(url, publishableKey);
    const eventSection = document.getElementById('events');
    const eventGrid = document.getElementById('eventsGrid');
    const eventEmpty = document.getElementById('eventsEmpty');
    const modal = document.getElementById('eventPopup');
    const modalContent = document.getElementById('eventPopupContent');
    let events = [];

    function formatDate(value) {
        return new Intl.DateTimeFormat('it-IT', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));
    }

    function eventDetails(event) {
        return `${event.title}\nData: ${formatDate(event.event_date)}\nLuogo: ${event.location}`;
    }

    function scrollToEvent(event) {
        document.getElementById(`event-${event.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function renderEvent(event) {
        const article = document.createElement('article');
        article.className = 'event-card';
        article.id = `event-${event.id}`;
        if (event.image_url) {
            const image = document.createElement('img');
            image.className = 'event-image';
            image.src = event.image_url;
            image.alt = event.title;
            article.append(image);
        }
        const content = document.createElement('div');
        content.className = 'event-content';
        const badge = document.createElement('span');
        badge.className = 'event-badge';
        badge.textContent = 'Iniziativa in evidenza';
        const title = document.createElement('h3');
        title.textContent = event.title;
        const date = document.createElement('p');
        date.className = 'event-date';
        date.innerHTML = `<i class="fas fa-calendar-days"></i> ${formatDate(event.event_date)}`;
        const location = document.createElement('p');
        location.className = 'event-date';
        location.innerHTML = `<i class="fas fa-location-dot"></i> ${event.location}`;
        const description = document.createElement('p');
        description.className = 'event-description';
        description.textContent = event.description;
        const form = document.createElement('form');
        form.className = 'event-registration-form';
        form.innerHTML = `<h4>Partecipa all'evento</h4><label>Nome e cognome<input name="full_name" minlength="2" maxlength="120" required></label><label>Telefono<input type="tel" name="phone" minlength="5" maxlength="40" required></label><label>Email<input type="email" name="email" maxlength="254" required></label><label class="event-consent"><input type="checkbox" name="privacy_consent" required> <span>Acconsento al trattamento dei dati per gestire la mia iscrizione, come indicato nella <a href="#privacy">Privacy Policy</a>.</span></label><button class="btn btn-primary" type="submit"><i class="fab fa-whatsapp"></i> Iscriviti via WhatsApp</button><p class="event-form-message" aria-live="polite"></p>`;
        form.addEventListener('submit', async submission => {
            submission.preventDefault();
            const whatsappWindow = window.open('', '_blank');
            const formData = new FormData(form);
            const button = form.querySelector('button');
            const message = form.querySelector('.event-form-message');
            button.disabled = true;
            message.textContent = 'Registrazione in corso...';
            const { error } = await client.from('event_registrations').insert({
                event_id: event.id,
                full_name: formData.get('full_name').trim(),
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                privacy_consent: true
            });
            button.disabled = false;
            if (error) {
                whatsappWindow?.close();
                message.textContent = 'Non è stato possibile registrare la richiesta. Riprova.';
                message.classList.add('is-error');
                return;
            }
            const text = encodeURIComponent(`*Nuova iscrizione evento Abbraccio*\n\n${eventDetails(event)}\n\nNome: ${formData.get('full_name').trim()}\nTelefono: ${formData.get('phone').trim()}\nEmail: ${formData.get('email').trim()}`);
            const whatsappUrl = `https://wa.me/393514175117?text=${text}`;
            if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
            else window.open(whatsappUrl, '_blank');
            form.reset();
            message.classList.remove('is-error');
            message.textContent = 'Iscrizione registrata. Si apre WhatsApp per inviare la richiesta.';
        });
        content.append(badge, title, date, location, description, form);
        article.append(content);
        return article;
    }

    function showPopup(event) {
        if (!event.popup_enabled || sessionStorage.getItem(`event-popup-${event.id}`) || !modal || !modalContent) return;
        modalContent.replaceChildren();
        const title = document.createElement('h2');
        title.id = 'eventPopupTitle';
        title.textContent = event.title;
        const details = document.createElement('p');
        details.textContent = `${formatDate(event.event_date)} · ${event.location}`;
        const text = document.createElement('p');
        text.textContent = event.description;
        const action = document.createElement('button');
        action.className = 'btn btn-primary';
        action.type = 'button';
        action.textContent = 'Scopri e partecipa';
        action.addEventListener('click', () => {
            modal.hidden = true;
            scrollToEvent(event);
        });
        modalContent.append(title, details, text, action);
        modal.hidden = false;
        sessionStorage.setItem(`event-popup-${event.id}`, 'shown');
    }

    async function loadEvents() {
        const { data, error } = await client.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString()).order('event_date');
        if (error || !data?.length) return;
        events = data;
        eventSection.hidden = false;
        eventEmpty.hidden = true;
        data.forEach(event => eventGrid.append(renderEvent(event)));
        showPopup(data.find(event => event.popup_enabled));
    }

    document.querySelectorAll('[data-close-event-popup]').forEach(button => button.addEventListener('click', () => { modal.hidden = true; }));
    modal?.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
    loadEvents();
})();
