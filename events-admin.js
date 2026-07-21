(() => {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey || !window.supabase) return;

    const client = window.supabase.createClient(url, publishableKey);
    const panel = document.getElementById('editorPanel');
    const tabs = document.getElementById('editorTabs');
    const message = document.getElementById('saveMessage');

    function setMessage(text, error = false) {
        message.textContent = text;
        message.style.color = error ? '#b42318' : '#15803d';
    }

    async function uploadImage(file) {
        if (!file) return null;
        const extension = file.name.split('.').pop().toLowerCase();
        const path = `event-${Date.now()}.${extension}`;
        const { error } = await client.storage.from('site-images').upload(path, file, { contentType: file.type, cacheControl: '3600' });
        if (error) throw error;
        return client.storage.from('site-images').getPublicUrl(path).data.publicUrl;
    }

    function formatDate(date) {
        return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
    }

    function registrationRow(registration) {
        const row = document.createElement('li');
        row.className = 'event-registration-row';
        row.textContent = `${registration.full_name} · ${registration.phone} · ${registration.email} · ${new Date(registration.created_at).toLocaleDateString('it-IT')}`;
        return row;
    }

    function createEventForm() {
        const form = document.createElement('form');
        form.className = 'admin-event-form';
        form.innerHTML = '<h2>Nuovo evento</h2><label>Titolo<input name="title" minlength="3" maxlength="120" required></label><label>Data e ora<input type="datetime-local" name="event_date" required></label><label>Luogo<input name="location" minlength="2" maxlength="160" required></label><label>Locandina (facoltativa)<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label><label class="admin-event-description">Descrizione<textarea name="description" minlength="10" maxlength="2000" required></textarea></label><label class="admin-check"><input type="checkbox" name="is_published"> Pubblica subito sul sito</label><label class="admin-check"><input type="checkbox" name="popup_enabled" checked> Mostra popup informativo</label><button class="save-button" type="submit"><i class="fas fa-calendar-plus"></i> Crea evento</button>';
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const data = new FormData(form);
            const button = form.querySelector('button');
            button.disabled = true;
            button.textContent = 'Creazione...';
            try {
                const image_url = await uploadImage(data.get('image'));
                const { error } = await client.from('events').insert({
                    title: data.get('title').trim(),
                    description: data.get('description').trim(),
                    event_date: new Date(data.get('event_date')).toISOString(),
                    location: data.get('location').trim(),
                    image_url,
                    is_published: data.get('is_published') === 'on',
                    popup_enabled: data.get('popup_enabled') === 'on'
                });
                if (error) throw error;
                setMessage('Evento creato correttamente.');
                renderEventsAdmin();
            } catch (error) {
                setMessage(error.message || 'Non è stato possibile creare l’evento.', true);
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-calendar-plus"></i> Crea evento';
            }
        });
        return form;
    }

    async function changePublication(event, is_published) {
        const { error } = await client.from('events').update({ is_published }).eq('id', event.id);
        if (error) return setMessage('Non è stato possibile aggiornare l’evento.', true);
        setMessage(is_published ? 'Evento pubblicato.' : 'Evento nascosto dal sito.');
        renderEventsAdmin();
    }

    async function deleteEvent(event) {
        if (!window.confirm(`Eliminare l’evento “${event.title}” e tutte le adesioni?`)) return;
        const { error } = await client.from('events').delete().eq('id', event.id);
        if (error) return setMessage('Non è stato possibile eliminare l’evento.', true);
        setMessage('Evento eliminato.');
        renderEventsAdmin();
    }

    async function renderEventsAdmin() {
        panel.replaceChildren();
        const loading = document.createElement('p');
        loading.className = 'empty-state';
        loading.textContent = 'Caricamento eventi...';
        panel.append(loading);
        const [{ data: events, error: eventsError }, { data: registrations, error: registrationsError }] = await Promise.all([
            client.from('events').select('*').order('event_date'),
            client.from('event_registrations').select('*').order('created_at', { ascending: false })
        ]);
        if (eventsError || registrationsError) {
            loading.textContent = 'Configurazione incompleta: esegui lo script SQL in Supabase.';
            return;
        }
        const layout = document.createElement('div');
        layout.className = 'events-admin-layout';
        layout.append(createEventForm());
        const list = document.createElement('div');
        list.className = 'events-admin-list';
        const heading = document.createElement('h2');
        heading.textContent = 'Eventi e partecipanti';
        list.append(heading);
        if (!events?.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Non hai ancora creato eventi.';
            list.append(empty);
        }
        events?.forEach(event => {
            const card = document.createElement('article');
            card.className = 'admin-event-card';
            const title = document.createElement('h3');
            title.textContent = event.title;
            const details = document.createElement('p');
            details.textContent = `${formatDate(event.event_date)} · ${event.location}`;
            const status = document.createElement('span');
            status.className = `event-admin-status ${event.is_published ? 'published' : 'draft'}`;
            status.textContent = event.is_published ? 'Pubblicato' : 'Bozza';
            const actions = document.createElement('div');
            actions.className = 'event-admin-actions';
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'approve-review-button';
            toggle.textContent = event.is_published ? 'Nascondi' : 'Pubblica';
            toggle.addEventListener('click', () => changePublication(event, !event.is_published));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'delete-review-button';
            remove.textContent = 'Elimina';
            remove.addEventListener('click', () => deleteEvent(event));
            actions.append(toggle, remove);
            const attendeesTitle = document.createElement('h4');
            const attendees = registrations?.filter(registration => registration.event_id === event.id) || [];
            attendeesTitle.textContent = `Partecipanti (${attendees.length})`;
            const attendeesList = document.createElement('ul');
            attendeesList.className = 'event-registration-list';
            if (attendees.length) attendees.forEach(registration => attendeesList.append(registrationRow(registration)));
            else attendeesList.innerHTML = '<li>Nessuna adesione ricevuta.</li>';
            card.append(title, details, status, actions, attendeesTitle, attendeesList);
            list.append(card);
        });
        layout.append(list);
        panel.replaceChildren(layout);
    }

    tabs.addEventListener('click', event => {
        if (event.target.closest('[data-section="events"]')) renderEventsAdmin();
    });
})();
