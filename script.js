const firebaseConfig = {
    apiKey: "AIzaSyAXNxDCdizaAB-3IJU65fLahDS_9ww6UWw",
    authDomain: "cs2nades-1a910.firebaseapp.com",
    databaseURL: "https://cs2nades-1a910-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cs2nades-1a910",
    storageBucket: "cs2nades-1a910.firebasestorage.app",
    messagingSenderId: "497946011142",
    appId: "1:497946011142:web:eea3fe5839ac4d23444587",
    measurementId: "G-M14MZNH78P"
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

    window.openLineupFromMap = function(targetId, sourceId) {
        const target = window.targetsData[targetId];
        if (!target) return;
        const source = target.sources.find(s => s.id === sourceId);
        if (!source) return;

        const panel = document.getElementById('lineup-panel');
        const overlay = document.getElementById('overlay-active');

        document.querySelector('.lineup-panel-title').textContent = `${target.title} — ${source.title}`;
        document.querySelector('.lineup-panel-subtitle').textContent = `Откуда: ${source.title} → Куда: ${target.title}`;
        document.getElementById('panel-pos').textContent = `Позиция: ${source.title}`;
        document.getElementById('panel-aim').textContent = source.aim || 'Прицел не указан';
        document.getElementById('panel-inst').textContent = source.inst || 'Инструкция не указана';

        const vidBox = document.getElementById('panel-video');
        vidBox.innerHTML = source.video
            ? `<video controls autoplay loop playsinline><source src="${source.video}" type="video/mp4"></video>`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)">Видео скоро</div>`;

        // Update favorite button
        const favBtn = document.getElementById('fav-btn');
        const favId = `${targetId}-${sourceId}`;
        const Storage = {
            getFavorites: () => JSON.parse(localStorage.getItem('favorites') || '[]'),
            isFavorite: (id) => JSON.parse(localStorage.getItem('favorites') || '[]').includes(id),
            addFavorite: (id) => {
                const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
                if (!favs.includes(id)) {
                    favs.push(id);
                    localStorage.setItem('favorites', JSON.stringify(favs));
                }
            },
            removeFavorite: (id) => {
                const favs = JSON.parse(localStorage.getItem('favorites') || '[]').filter(f => f !== id);
                localStorage.setItem('favorites', JSON.stringify(favs));
            }
        };

        const isFav = Storage.isFavorite(favId);
        favBtn.innerHTML = isFav
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
        favBtn.className = `btn ${isFav ? 'btn-secondary' : 'btn-primary'}`;

        favBtn.onclick = () => {
            if (Storage.isFavorite(favId)) {
                Storage.removeFavorite(favId);
                favBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
                favBtn.className = 'btn btn-primary';
            } else {
                Storage.addFavorite(favId);
                favBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`;
                favBtn.className = 'btn btn-secondary';
            }
        };

        panel.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Add to history
        const hist = JSON.parse(localStorage.getItem('history') || '[]');
        hist.unshift({
            id: favId,
            title: `${target.title} — ${source.title}`,
            type: source.type,
            timestamp: Date.now()
        });
        localStorage.setItem('history', JSON.stringify(hist.slice(0, 20)));

        // Render history
        if (typeof window.renderHistory === 'function') window.renderHistory();
    }

// Close panel
    document.getElementById('panel-close')?.addEventListener('click', closePanel);
    document.getElementById('panel-close-2')?.addEventListener('click', closePanel);
    document.getElementById('overlay-active')?.addEventListener('click', closePanel);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

    function closePanel() {
        const panel = document.getElementById('lineup-panel');
        const overlay = document.getElementById('overlay-active');
        panel.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

// Copy instruction
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

// Render history
    window.renderHistory = function() {
        const section = document.getElementById('history-section');
        if (!section) return;
        const grid = section.querySelector('.history-grid');
        const hist = JSON.parse(localStorage.getItem('history') || '[]');

        if (hist.length === 0) {
            grid.innerHTML = '<div class="history-empty">История пуста</div>';
        } else {
            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '' };
            grid.innerHTML = hist.map(item => {
                const mins = Math.floor((Date.now() - item.timestamp) / 60000);
                const time = mins < 1 ? 'Только что' : mins < 60 ? `${mins} мин назад` : `${Math.floor(mins/60)} ч назад`;
                return `<div class="history-card">
                <div class="history-card-title"><span>${icons[item.type]||'💣'}</span> ${item.title}</div>
                <div class="history-card-meta">${time}</div>
            </div>`;
            }).join('');
        }
        section.querySelector('.history-clear')?.addEventListener('click', () => {
            localStorage.setItem('history', '[]');
            window.renderHistory();
        });
    };

// Update favorites counter
    function updateFavCounter() {
        const badge = document.querySelector('.fav-badge');
        if (badge) {
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            badge.textContent = favs.length > 0 ? favs.length : '';
        }
    }
    updateFavCounter();
    window.renderHistory();

    window.updateFavCounter = function() {
        const badge = document.querySelector('.fav-badge');
        if (badge) badge.textContent = Storage.getFavorites().length > 0 ? Storage.getFavorites().length : '';
    };

    const panel = document.getElementById('lineup-panel');
    const overlay = document.getElementById('overlay-active');

    if (panel) {
        let currentTargetId = null;
        let currentSourceId = null;

        // Open target - show sources
        function openTarget(targetId) {
            const target = window.targetsData[targetId];
            if (!target || !target.sources || target.sources.length === 0) return;

            currentTargetId = targetId;

            if (target.sources.length === 1) {
                openSource(targetId, target.sources[0].id);
            } else {
                showSourcesSelector(target);
            }
        }

        // Show sources selector
        function showSourcesSelector(target) {
            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '💥' };

            document.querySelector('.lineup-panel-title').textContent = target.title;
            document.querySelector('.lineup-panel-subtitle').textContent = `Выберите позицию (${target.sources.length} вариантов)`;
            document.getElementById('panel-pos').textContent = '';
            document.getElementById('panel-aim').textContent = '';
            document.getElementById('panel-inst').textContent = '';

            const videoBox = document.getElementById('panel-video');
            videoBox.innerHTML = `
                <div style="padding:1rem;overflow-y:auto;max-height:100%">
                    ${target.sources.map(s => `
                        <div class="source-selector-item" onclick="window.openSource('${currentTargetId}','${s.id}')" style="padding:1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:.75rem;cursor:pointer;transition:all var(--transition)">
                            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
                                <span style="font-size:1.5rem">${icons[s.type]}</span>
                                <div>
                                    <div style="font-weight:600;font-size:.95rem">${s.title}</div>
                                </div>
                            </div>
                            <div style="font-size:.85rem;color:var(--text-3)">🎯 ${s.aim || 'Прицел не указан'}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            updateFavBtn();
            panel.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Show sources on map
            showSourcesOnMap(target);
        }

        // Show sources on map
        function showSourcesOnMap(target) {
            const overlay = document.getElementById('map-overlay');
            // Remove existing sources
            overlay.querySelectorAll('.map-hotspot-source').forEach(s => s.remove());

            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '💥' };

            target.sources.forEach(s => {
                const div = document.createElement('div');
                div.className = 'map-hotspot-source';
                div.style.left = s.x + '%';
                div.style.top = s.y + '%';
                div.innerHTML = `<div class="hotspot-label">${icons[s.type]} ${s.title}</div>`;
                div.onclick = () => openSource(currentTargetId, s.id);
                overlay.appendChild(div);
            });
        }

        // Hide sources from map
        function hideSourcesFromMap() {
            const overlay = document.getElementById('map-overlay');
            overlay.querySelectorAll('.map-hotspot-source').forEach(s => s.remove());
        }

        // Open source - show video/instruction
        function openSource(targetId, sourceId) {
            const target = window.targetsData[targetId];
            if (!target) return;
            const source = target.sources.find(s => s.id === sourceId);
            if (!source) return;

            currentTargetId = targetId;
            currentSourceId = sourceId;

            document.querySelector('.lineup-panel-title').textContent = `${target.title} — ${source.title}`;
            document.querySelector('.lineup-panel-subtitle').textContent = `Куда: ${target.title}`;
            document.getElementById('panel-pos').textContent = `Откуда: ${source.title}`;
            document.getElementById('panel-aim').textContent = source.aim;
            document.getElementById('panel-inst').textContent = source.inst;

            const vidBox = document.getElementById('panel-video');
            vidBox.innerHTML = source.video
                ? `<video controls autoplay loop playsinline><source src="${source.video}" type="video/mp4"></video>`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)">Видео скоро</div>`;

            updateFavBtn();
            panel.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Highlight source on map
            const overlayEl = document.getElementById('map-overlay');
            overlayEl.querySelectorAll('.map-hotspot-source').forEach(s => s.classList.remove('active'));
            const activeSource = overlayEl.querySelector(`.map-hotspot-source[onclick*="${sourceId}"]`);
            if (activeSource) activeSource.classList.add('active');

            Storage.addToHistory({ id: `${targetId}-${sourceId}`, title: `${target.title} — ${source.title}`, type: source.type });
            renderHistory();
        }

        function closePanel() {
            panel.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            hideSourcesFromMap();
            currentTargetId = null;
            currentSourceId = null;
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
            if (!currentSourceId) return;
            const favId = `${currentTargetId}-${currentSourceId}`;
            Storage.isFavorite(favId) ? Storage.removeFavorite(favId) : Storage.addFavorite(favId);
            updateFavBtn();
        });

        function updateFavBtn() {
            const btn = document.getElementById('fav-btn');
            if (!currentSourceId) return;
            const favId = `${currentTargetId}-${currentSourceId}`;
            const isFav = Storage.isFavorite(favId);
            btn.innerHTML = isFav
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
            btn.className = `btn ${isFav ? 'btn-secondary' : 'btn-primary'}`;
        }

        window.openTarget = openTarget;
        window.openSource = openSource;
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
                return `<div class="history-card">
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