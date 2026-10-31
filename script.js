// script.js — счётчик избранного для страниц без map-engine.js
// (на страницах карт счётчиком управляет map-engine.js)
document.addEventListener('DOMContentLoaded', () => {
    function updateFavCounter() {
        const badge = document.querySelector('.fav-badge');
        if (!badge) return;
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        badge.textContent = favs.length > 0 ? favs.length : '';
    }

    updateFavCounter();
    window.updateFavCounter = updateFavCounter;

    // Синхронизация счётчика между вкладками
    window.addEventListener('storage', e => {
        if (e.key === 'favorites') updateFavCounter();
    });
});