document.addEventListener('DOMContentLoaded', () => {

    /* ======== LOCALSTORAGE HELPERS ======== */
    const Storage = {
        getFavorites() {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        },
        setFavorites(favs) {
            localStorage.setItem('favorites', JSON.stringify(favs));
            updateFavCounter();
        },
        addFavorite(id) {
            const favs = this.getFavorites();
            if (!favs.includes(id)) {
                favs.push(id);
                this.setFavorites(favs);
            }
        },
        removeFavorite(id) {
            const favs = this.getFavorites().filter(f => f !== id);
            this.setFavorites(favs);
        },
        isFavorite(id) {
            return this.getFavorites().includes(id);
        },
        getHistory() {
            return JSON.parse(localStorage.getItem('history') || '[]');
        },
        setHistory(hist) {
            localStorage.setItem('history', JSON.stringify(hist));
        },
        addToHistory(item) {
            let hist = this.getHistory();
            hist = hist.filter(h => h.id !== item.id);
            hist.unshift({ ...item, timestamp: Date.now() });
            hist = hist.slice(0, 20);
            this.setHistory(hist);
        },
        clearHistory() {
            this.setHistory([]);
        }
    };

    /* ======== UPDATE FAVORITES COUNTER ======== */
    function updateFavCounter() {
        const badge = document.querySelector('.fav-badge');
        if (!badge) return;
        const count = Storage.getFavorites().length;
        badge.textContent = count > 0 ? count : '';
    }

    /* ======== TOGGLE FAVORITE ======== */
    function toggleFavorite(id, btn) {
        if (Storage.isFavorite(id)) {
            Storage.removeFavorite(id);
            btn.classList.remove('active');
        } else {
            Storage.addFavorite(id);
            btn.classList.add('active');
        }
    }

    /* ======== INIT FAVORITES BUTTONS ======== */
    function initFavorites() {
        document.querySelectorAll('.lcard').forEach(card => {
            const id = card.dataset.id;
            if (!id) return;

            let btn = card.querySelector('.fav-btn');
            if (!btn) {
                btn = document.createElement('button');
                btn.className = 'fav-btn';
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(id, btn);
                });
                card.querySelector('.lprev').appendChild(btn);
            }

            if (Storage.isFavorite(id)) {
                btn.classList.add('active');
            }
        });
        updateFavCounter();
    }

    /* ======== INIT HISTORY ======== */
    function initHistory() {
        const historySection = document.getElementById('history-section');
        if (!historySection) return;

        const history = Storage.getHistory();
        const grid = historySection.querySelector('.history-grid');
        const clearBtn = historySection.querySelector('.history-clear');

        if (history.length === 0) {
            grid.innerHTML = '<div class="history-empty">История пуста</div>';
        } else {
            grid.innerHTML = history.map(item => {
                const timeAgo = getTimeAgo(item.timestamp);
                return `
                    <div class="history-card" data-id="${item.id}">
                        <div class="history-card-title">
                            <span>${getIconByType(item.type)}</span>
                            ${item.title}
                        </div>
                        <div class="history-card-meta">${timeAgo}</div>
                    </div>
                `;
            }).join('');

            grid.querySelectorAll('.history-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    const lineupCard = document.querySelector(`.lcard[data-id="${id}"]`);
                    if (lineupCard) lineupCard.click();
                });
            });
        }

        clearBtn?.addEventListener('click', () => {
            Storage.clearHistory();
            grid.innerHTML = '<div class="history-empty">История пуста</div>';
        });
    }

    function getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        return `${days} дн назад`;
    }

    function getIconByType(type) {
        const icons = {
            smoke: '💨',
            flash: '⚡',
            molotov: '🔥',
            he: '💥'
        };
        return icons[type] || '💣';
    }

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

            // Add to history
            Storage.addToHistory({
                id: card.dataset.id,
                title: card.dataset.title,
                type: card.dataset.type,
                map: card.closest('body').querySelector('.page-head h1')?.textContent.trim() || ''
            });

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

    /* ======== INIT ======== */
    initFavorites();
    initHistory();
});