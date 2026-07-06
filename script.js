document.addEventListener('DOMContentLoaded', () => {

    /* ======== FILTERS ======== */
    document.querySelectorAll('.fgroup').forEach(group => {
        group.querySelectorAll('.fbtn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyAll();
            });
        });
    });

    /* ======== SEARCH ======== */
    const searchInput = document.getElementById('search');
    let debounce;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(applyAll, 180);
        });
    }

    function applyAll() {
        const cards = document.querySelectorAll('.lcard');
        if (!cards.length) return;

        const typeEl = document.querySelector('.fgroup-type .fbtn.active');
        const siteEl = document.querySelector('.fgroup-site .fbtn.active');
        const type = typeEl ? typeEl.dataset.f : 'all';
        const site = siteEl ? siteEl.dataset.f : 'all';
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let count = 0;
        cards.forEach(c => {
            const okT = type === 'all' || c.dataset.type === type;
            const okS = site === 'all' || c.dataset.site === site;
            const okQ = !q || c.dataset.title.toLowerCase().includes(q) || c.dataset.desc.toLowerCase().includes(q);
            if (okT && okS && okQ) { c.classList.remove('hidden'); count++; }
            else c.classList.add('hidden');
        });

        const info = document.getElementById('count');
        if (info) info.textContent = count === cards.length
            ? `Показано: ${count} раскидок`
            : count === 0 ? 'Ничего не найдено' : `Найдено: ${count} из ${cards.length}`;
    }

    /* ======== MODAL ======== */
    const modal = document.getElementById('modal');
    if (!modal) return;

    document.querySelectorAll('.lcard').forEach(card => {
        card.addEventListener('click', () => {
            modal.querySelector('.m-title').textContent = card.dataset.title;
            modal.querySelector('.m-desc').textContent = card.dataset.desc;
            modal.querySelector('.m-pos p').textContent = card.dataset.pos;
            modal.querySelector('.m-aim p').textContent = card.dataset.aim;
            modal.querySelector('.inst-box p').textContent = card.dataset.inst;

            const vidBox = modal.querySelector('.modal-vid');
            const src = card.dataset.video;

            if (src) {
                vidBox.innerHTML = `
                    <video controls autoplay loop playsinline>
                        <source src="${src}" type="video/mp4">
                        Ваш браузер не поддерживает видео.
                    </video>
                `;
            } else {
                vidBox.innerHTML = `
                    <div class="modal-vid-ph">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        <p>Видео скоро будет добавлено</p>
                    </div>
                `;
            }

            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        const v = modal.querySelector('video');
        if (v) v.pause();
    }

    modal.querySelector('.modal-x').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* ======== COPY ======== */
    modal.querySelector('.copy-btn').addEventListener('click', async function () {
        const text = modal.querySelector('.inst-box p').textContent;
        try {
            await navigator.clipboard.writeText(text);
            this.innerHTML = '✓ Скопировано';
            this.classList.add('ok');
            setTimeout(() => {
                this.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Копировать`;
                this.classList.remove('ok');
            }, 2000);
        } catch (e) { console.error(e); }
    });
});