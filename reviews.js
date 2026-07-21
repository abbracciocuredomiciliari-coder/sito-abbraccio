(() => {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey || !window.supabase) return;

    const client = window.supabase.createClient(url, publishableKey);
    const form = document.getElementById('reviewForm');
    const message = document.getElementById('reviewFormMessage');
    const grid = document.getElementById('approvedReviews');

    function setMessage(text, isError = false) {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle('is-error', isError);
    }

    function stars(rating) {
        return Array.from({ length: rating }, () => '<i class="fas fa-star"></i>').join('');
    }

    function createReviewCard(review) {
        const article = document.createElement('article');
        article.className = 'review-card submitted-review';
        const starRow = document.createElement('div');
        starRow.className = 'review-stars';
        starRow.innerHTML = stars(review.rating);
        const text = document.createElement('p');
        text.textContent = `“${review.review_text}”`;
        const author = document.createElement('div');
        author.className = 'review-author';
        const avatar = document.createElement('div');
        avatar.className = 'review-avatar';
        avatar.textContent = review.reviewer_name.trim().charAt(0).toUpperCase();
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = review.reviewer_name;
        const location = document.createElement('span');
        location.textContent = review.location;
        details.append(name, location);
        author.append(avatar, details);
        article.append(starRow, text, author);
        return article;
    }

    async function loadApprovedReviews() {
        if (!grid) return;
        const { data, error } = await client
            .from('reviews')
            .select('id, reviewer_name, location, rating, review_text')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(12);
        if (error || !data) return;
        data.forEach(review => grid.append(createReviewCard(review)));
    }

    form?.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
            reviewer_name: formData.get('reviewer_name').trim(),
            location: formData.get('location').trim(),
            rating: Number(formData.get('rating')),
            review_text: formData.get('review_text').trim(),
            status: 'pending'
        };
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        setMessage('Invio della recensione in corso...');
        const { error } = await client.from('reviews').insert(payload);
        button.disabled = false;
        if (error) return setMessage('Non è stato possibile inviare la recensione. Riprova più tardi.', true);
        form.reset();
        setMessage('Grazie! La tua recensione sarà pubblicata dopo la verifica.');
    });

    loadApprovedReviews();
})();
