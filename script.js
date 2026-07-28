const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "cs2nades.firebaseapp.com",
    databaseURL: "https://cs2nades-default-rtdb.firebaseio.com",
    projectId: "cs2nades",
    storageBucket: "cs2nades.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const Storage = {
        getFavorites: () => JSON.parse(localStorage.getItem('favorites') || '[]'),
        setFavorites: (favs) => { localStorage.setItem('favorites', JSON.stringify(favs)); updateFavCounter(); },
        addFavorite: (id) => { const favs = Storage.getFavorites(); if (!favs.includes(id)) { favs.push(id); Storage.setFavorites(favs); } },
        removeFavorite: (id) => { Storage.setFavorites(Storage.getFavorites().filter(f => f !== id)); },
        isFavorite: (id) => Storage.getFavorites().includes(id),
        getHistory: () => JSON.parse(localStorage.getItem('history') || '[]'),
        setHistory: (hist) => localStorage.setItem('history', JSON.stringify(hist)),
        addToHistory: (item) => {
            let hist = Storage.getHistory().filter(h => h.id !== item.id);
            hist.unshift({ ...item, timestamp: Date.now() });
            Storage.setHistory(hist.slice(0, 20));
        },
        clearHistory: () => Storage.setHistory([])
    };

    window.updateFavCounter = function() {
        const badge = document.querySelector('.fav-badge');
        if (badge) badge.textContent = Storage.getFavorites().length > 0 ? Storage.getFavorites().length : '';
    };

    const panel = document.getElementById('lineup-panel');
    const overlay = document.getElementById('overlay-active');

    if (panel) {
        let currentPointId = null;
        let currentLineupId = null;

        function openPoint(pointId) {
            const point = window.lineupData[pointId];
            if (!point || !point.lineups || point.lineups.length === 0) return;

            currentPointId = pointId;

            if (point.lineups.length === 1) {
                openLineup(pointId, point.lineups[0].id);
            } else {
                showLineupSelector(point);
            }
        }

        function showLineupSelector(point) {
            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '💥' };

            document.querySelector('.lineup-panel-title').textContent = point.title;
            document.querySelector('.lineup-panel-subtitle').textContent = `Выберите раскидку (${point.lineups.length} вариантов)`;
            document.getElementById('panel-pos').textContent = '';
            document.getElementById('panel-aim').textContent = '';
            document.getElementById('panel-inst').textContent = '';

            const videoBox = document.getElementById('panel-video');
            videoBox.innerHTML = `
                <div style="padding:1rem;overflow-y:auto;max-height:100%">
                    ${point.lineups.map(l => `
                        <div class="lineup-selector-item" onclick="window.openLineup('${currentPointId}','${l.id}')" style="padding:1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:.75rem;cursor:pointer;transition:all var(--transition)">
                            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
                                <span style="font-size:1.5rem">${icons[l.type]}</span>
                                <div>
                                    <div style="font-weight:600;font-size:.95rem">${l.title}</div>
                                    <div style="font-size:.8rem;color:var(--text-2)">${l.desc || ''}</div>
                                </div>
                            </div>
                            <div style="font-size:.85rem;color:var(--text-3)">📍 ${l.pos || 'Позиция не указана'}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            updateFavBtn();
            panel.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';

            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            const activeHotspot = document.querySelector(`.map-hotspot[data-id="${currentPointId}"]`);
            if (activeHotspot) activeHotspot.classList.add('active');
        }

        function openLineup(pointId, lineupId) {
            const point = window.lineupData[pointId];
            if (!point) return;
            const lineup = point.lineups.find(l => l.id === lineupId);
            if (!lineup) return;

            currentPointId = pointId;
            currentLineupId = lineupId;

            document.querySelector('.lineup-panel-title').textContent = `${point.title} — ${lineup.title}`;
            document.querySelector('.lineup-panel-subtitle').textContent = lineup.desc;
            document.getElementById('panel-pos').textContent = lineup.pos;
            document.getElementById('panel-aim').textContent = lineup.aim;
            document.getElementById('panel-inst').textContent = lineup.inst;

            const vidBox = document.getElementById('panel-video');
            vidBox.innerHTML = lineup.video
                ? `<video controls autoplay loop playsinline><source src="${lineup.video}" type="video/mp4"></video>`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)">Видео скоро</div>`;

            updateFavBtn();
            panel.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';

            Storage.addToHistory({ id: `${pointId}-${lineupId}`, title: `${point.title} — ${lineup.title}`, type: lineup.type });
            renderHistory();
        }

        function closePanel() {
            panel.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            currentPointId = null;
            currentLineupId = null;
        }

        document.getElementById('panel-close')?.addEventListener('click', closePanel);
        document.getElementById('panel-close-2')?.addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

        document.getElementById('copy-inst')?.addEventListener('click', async function() {
            const text = document.getElementById('panel-inst').textContent;
            try {
                await navigator.clipboard.writeText(text);
                this.innerHTML = '✓ Скопировано';
                this.classList.add('ok');
                setTimeout(() => {
                    this.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Копировать`;
                    this.classList.remove('ok');
                }, 2000);
            } catch (e) {}
        });

        document.getElementById('fav-btn')?.addEventListener('click', () => {
            if (!currentLineupId) return;
            const favId = `${currentPointId}-${currentLineupId}`;
            Storage.isFavorite(favId) ? Storage.removeFavorite(favId) : Storage.addFavorite(favId);
            updateFavBtn();
        });

        function updateFavBtn() {
            const btn = document.getElementById('fav-btn');
            if (!currentLineupId) return;
            const favId = `${currentPointId}-${currentLineupId}`;
            const isFav = Storage.isFavorite(favId);
            btn.innerHTML = isFav
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
            btn.className = `btn ${isFav ? 'btn-secondary' : 'btn-primary'}`;
        }

        window.openPoint = openPoint;
        window.openLineup = openLineup;
    }

    window.renderHistory = function() {
        const section = document.getElementById('history-section');
        if (!section) return;
        const grid = section.querySelector('.history-grid');
        const hist = Storage.getHistory();

        if (hist.length === 0) {
            grid.innerHTML = '<div class="history-empty">История пуста</div>';
        } else {
            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '💥' };
            grid.innerHTML = hist.map(item => {
                const mins = Math.floor((Date.now() - item.timestamp) / 60000);
                const time = mins < 1 ? 'Только что' : mins < 60 ? `${mins} мин назад` : `${Math.floor(mins/60)} ч назад`;
                return `<div class="history-card" onclick="window.openPoint('${item.id.split('-')[0]}-${item.id.split('-')[1]}')">
                    <div class="history-card-title"><span>${icons[item.type]||'💣'}</span> ${item.title}</div>
                    <div class="history-card-meta">${time}</div>
                </div>`;
            }).join('');
        }
        section.querySelector('.history-clear')?.addEventListener('click', () => { Storage.clearHistory(); renderHistory(); });
    };

    updateFavCounter();
    renderHistory();
});