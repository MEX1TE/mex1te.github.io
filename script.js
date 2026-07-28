// Firebase конфигурация — ЗАМЕНИ НА СВОЮ!
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

// Инициализация Firebase
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

    // Interactive Map Logic
    const panel = document.getElementById('lineup-panel');
    const overlay = document.getElementById('overlay-active');

    if (panel) {
        let currentId = null;

        function openLineup(id) {
            const data = window.lineupData[id];
            if (!data) return;
            currentId = id;

            document.querySelector('.lineup-panel-title').textContent = data.title;
            document.querySelector('.lineup-panel-subtitle').textContent = data.desc;
            document.getElementById('panel-pos').textContent = data.pos;
            document.getElementById('panel-aim').textContent = data.aim;
            document.getElementById('panel-inst').textContent = data.inst;

            const vidBox = document.getElementById('panel-video');
            vidBox.innerHTML = data.video
                ? `<video controls autoplay loop playsinline><source src="${data.video}" type="video/mp4"></video>`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)">Видео скоро</div>`;

            updateFavBtn();
            panel.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';

            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            const activeHotspot = document.querySelector(`.map-hotspot[data-id="${id}"]`);
            if (activeHotspot) activeHotspot.classList.add('active');

            Storage.addToHistory({ id, title: data.title, type: data.type });
            renderHistory();
        }

        function closePanel() {
            panel.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            document.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            currentId = null;
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
            if (!currentId) return;
            Storage.isFavorite(currentId) ? Storage.removeFavorite(currentId) : Storage.addFavorite(currentId);
            updateFavBtn();
        });

        function updateFavBtn() {
            const btn = document.getElementById('fav-btn');
            const isFav = Storage.isFavorite(currentId);
            btn.innerHTML = isFav
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
            btn.className = `btn ${isFav ? 'btn-secondary' : 'btn-primary'}`;
        }

        // Делаем функцию глобальной для вызова из Firebase listener
        window.openLineup = openLineup;
    }

    // History Logic
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
                return `<div class="history-card" onclick="window.openLineup('${item.id}')">
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