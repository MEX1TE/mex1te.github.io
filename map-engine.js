document.addEventListener('DOMContentLoaded', () => {
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

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    console.log(`🗺️ Загрузка карты: ${MAP_NAME}`);

    // ZOOM & PAN
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX, startY;

    const viewport = document.getElementById('map-viewport');
    const content = document.getElementById('map-content');
    const zoomLevelEl = document.getElementById('zoom-level');

    function updateTransform() {
        content.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`;
        zoomLevelEl.textContent = Math.round(zoom * 100) + '%';
    }

    window.zoomIn = function() { zoom = Math.min(zoom * 1.2, 3); updateTransform(); };
    window.zoomOut = function() { zoom = Math.max(zoom / 1.2, 0.5); updateTransform(); };
    window.zoomReset = function() { zoom = 1; panX = 0; panY = 0; updateTransform(); };

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoom = Math.max(0.5, Math.min(zoom * delta, 3));
        updateTransform();
    }, { passive: false });

    viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.map-hotspot') || e.target.closest('.map-hotspot-source')) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        viewport.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        viewport.style.cursor = 'grab';
    });

    let touchStartDist = 0;
    let touchStartZoom = 1;

    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            touchStartZoom = zoom;
        } else if (e.touches.length === 1) {
            if (e.target.closest('.map-hotspot') || e.target.closest('.map-hotspot-source')) return;
            isDragging = true;
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
        }
    });

    viewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            zoom = Math.max(0.5, Math.min(touchStartZoom * (dist / touchStartDist), 3));
            updateTransform();
        } else if (e.touches.length === 1 && isDragging) {
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            updateTransform();
        }
    }, { passive: false });

    viewport.addEventListener('touchend', () => { isDragging = false; });

    updateTransform();

    // FIREBASE DATA
    window.targetsData = {};
    let currentSelectedTarget = null;

    db.ref(`lineups/${MAP_NAME}`).on('value', snapshot => {
        const data = snapshot.val();
        const targets = data ? Object.values(data) : [];
        const overlay = document.getElementById('map-overlay');
        
        overlay.innerHTML = '';
        window.targetsData = {};
        
        console.log(`✅ Загружено ${targets.length} целей для ${MAP_NAME}`);
        
        targets.forEach(t => {
            const div = document.createElement('div');
            div.className = 'map-hotspot';
            div.dataset.id = t.id;
            div.style.left = t.x + '%';
            div.style.top = t.y + '%';
            
            const sourceCount = t.sources ? t.sources.length : 0;
            div.innerHTML = `
                <div class="map-hotspot-label">${t.title}</div>
                ${sourceCount > 1 ? `<div style="position:absolute;top:-8px;right:-8px;background:var(--molotov);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">${sourceCount}</div>` : ''}
            `;
            
            div.onclick = (e) => {
                e.stopPropagation();
                selectTarget(t.id);
            };
            
            overlay.appendChild(div);
            window.targetsData[t.id] = t;
        });
    }, error => {
        console.error('❌ Ошибка Firebase:', error);
    });

    function selectTarget(targetId) {
        const target = window.targetsData[targetId];
        if (!target) return;
        
        currentSelectedTarget = targetId;
        
        const overlay = document.getElementById('map-overlay');
        overlay.querySelectorAll('.map-hotspot-source, .connection-line').forEach(el => el.remove());
        overlay.querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
        
        const targetEl = overlay.querySelector(`.map-hotspot[data-id="${targetId}"]`);
        if (targetEl) targetEl.classList.add('active');
        
        if (target.sources && target.sources.length > 0) {
            target.sources.forEach(s => {
                const sDiv = document.createElement('div');
                sDiv.className = 'map-hotspot-source';
                sDiv.style.left = s.x + '%';
                sDiv.style.top = s.y + '%';
                sDiv.innerHTML = `<div class="map-hotspot-label">${s.title}</div>`;
                sDiv.onclick = (e) => {
                    e.stopPropagation();
                    openSource(targetId, s.id);
                };
                overlay.appendChild(sDiv);
                drawConnection(target.x, target.y, s.x, s.y);
            });
        }
    }

    function drawConnection(x1, y1, x2, y2) {
        const overlay = document.getElementById('map-overlay');
        const line = document.createElement('div');
        line.className = 'connection-line';
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        line.style.left = x1 + '%';
        line.style.top = y1 + '%';
        line.style.width = length + '%';
        line.style.transform = `rotate(${angle}deg)`;
        
        overlay.appendChild(line);
    }

    // Функция для создания видео embed
    function createVideoEmbed(videoUrl) {
    if (!videoUrl || videoUrl.trim() === '') {
        return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)">Видео не добавлено</div>`;
    }
    
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1].split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        }
        if (videoId) {
            return `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        }
    }
    
    // Rutube
    if (videoUrl.includes('rutube.ru')) {
        let videoId = '';
        
        // Формат 1: https://rutube.ru/video/VIDEO_ID/
        if (videoUrl.includes('/video/')) {
            const match = videoUrl.match(/\/video\/([a-f0-9-]+)/i);
            if (match) {
                videoId = match[1];
            }
        }
        // Формат 2: https://rutube.ru/play/embed/VIDEO_ID/
        else if (videoUrl.includes('/play/embed/')) {
            const match = videoUrl.match(/\/play\/embed\/([a-f0-9-]+)/i);
            if (match) {
                videoId = match[1];
            }
        }
        // Формат 3: просто ID в конце URL
        else {
            const match = videoUrl.match(/([a-f0-9-]{36})/i);
            if (match) {
                videoId = match[1];
            }
        }
        
        if (videoId) {
            return `<iframe 
                src="https://rutube.ru/play/embed/${videoId}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
                allowfullscreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            ></iframe>`;
        }
    }
    
    // VK - поддержка vk.com и vkvideo.ru
    if (videoUrl.includes('vk.com') || videoUrl.includes('vkvideo.ru')) {
        let match = videoUrl.match(/video(-?\d+)_(\d+)/);
        if (!match) {
            match = videoUrl.match(/clip(-?\d+)_(\d+)/);
        }
        
        if (match) {
            const oid = match[1];
            const id = match[2];
            return `<iframe 
                src="https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2&autoplay=0" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture;" 
                allowfullscreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            ></iframe>`;
        }
    }
    
    // Локальное видео
    if (videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm')) {
        return `<video controls autoplay loop playsinline><source src="${videoUrl}" type="video/mp4">Ваш браузер не поддерживает видео</video>`;
    }
    
    // Если не распознали — показываем ссылку
    return `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3);flex-direction:column;gap:1rem">
        <div>Неподдерживаемый формат видео</div>
        <div style="font-size:0.85rem;color:var(--text-2);max-width:80%;text-align:center;word-break:break-all">
            Ссылка: ${videoUrl}
        </div>
    </div>`;
}

    function openSource(targetId, sourceId) {
        const target = window.targetsData[targetId];
        if (!target) return;
        const source = target.sources.find(s => s.id === sourceId);
        if (!source) return;
        
        const panel = document.getElementById('lineup-panel');
        const overlayActive = document.getElementById('overlay-active');
        
        document.querySelector('.lineup-panel-title').textContent = `${target.title} — ${source.title}`;
        document.querySelector('.lineup-panel-subtitle').textContent = `Откуда: ${source.title} → Куда: ${target.title}`;
        document.getElementById('panel-pos').textContent = `Позиция: ${source.title}`;
        document.getElementById('panel-aim').textContent = source.aim || 'Прицел не указан';
        document.getElementById('panel-inst').textContent = source.inst || 'Инструкция не указана';
        
        const vidBox = document.getElementById('panel-video');
        vidBox.innerHTML = createVideoEmbed(source.video);
        
        const favBtn = document.getElementById('fav-btn');
        const favId = `${targetId}-${sourceId}`;
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        const isFav = favs.includes(favId);
        
        updateFavBtnUI(favBtn, isFav);
        
        favBtn.onclick = () => {
            const currentFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
            if (currentFavs.includes(favId)) {
                localStorage.setItem('favorites', JSON.stringify(currentFavs.filter(f => f !== favId)));
                updateFavBtnUI(favBtn, false);
            } else {
                currentFavs.push(favId);
                localStorage.setItem('favorites', JSON.stringify(currentFavs));
                updateFavBtnUI(favBtn, true);
            }
            updateFavCounter();
        };
        
        panel.classList.add('open');
        overlayActive.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const hist = JSON.parse(localStorage.getItem('history') || '[]');
        hist.unshift({ id: favId, title: `${target.title} — ${source.title}`, type: source.type, timestamp: Date.now() });
        localStorage.setItem('history', JSON.stringify(hist.slice(0, 20)));
        renderHistory();
    }

    function updateFavBtnUI(btn, isFav) {
        if (isFav) {
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранном`;
            btn.className = 'btn btn-secondary';
        } else {
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> В избранное`;
            btn.className = 'btn btn-primary';
        }
    }

    function closePanel() {
        document.getElementById('lineup-panel').classList.remove('open');
        document.getElementById('overlay-active').classList.remove('show');
        document.body.style.overflow = '';
    }

    document.getElementById('panel-close').addEventListener('click', closePanel);
    document.getElementById('panel-close-2').addEventListener('click', closePanel);
    document.getElementById('overlay-active').addEventListener('click', closePanel);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

    document.getElementById('copy-inst').addEventListener('click', async function() {
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

    document.getElementById('map-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'map-overlay') {
            document.getElementById('map-overlay').querySelectorAll('.map-hotspot').forEach(h => h.classList.remove('active'));
            document.getElementById('map-overlay').querySelectorAll('.map-hotspot-source, .connection-line').forEach(el => el.remove());
            currentSelectedTarget = null;
        }
    });

    function renderHistory() {
        const section = document.getElementById('history-section');
        if (!section) return;
        const grid = section.querySelector('.history-grid');
        const hist = JSON.parse(localStorage.getItem('history') || '[]');
        
        if (hist.length === 0) {
            grid.innerHTML = '<div class="history-empty">История пуста</div>';
        } else {
            const icons = { smoke: '💨', flash: '⚡', molotov: '🔥', he: '💥' };
            grid.innerHTML = hist.map(item => {
                const mins = Math.floor((Date.now() - item.timestamp) / 60000);
                const time = mins < 1 ? 'Только что' : mins < 60 ? `${mins} мин назад` : `${Math.floor(mins/60)} ч назад`;
                return `<div class="history-card"><div class="history-card-title"><span>${icons[item.type]||''}</span> ${item.title}</div><div class="history-card-meta">${time}</div></div>`;
            }).join('');
        }
        
        section.querySelector('.history-clear')?.addEventListener('click', () => {
            localStorage.setItem('history', '[]');
            renderHistory();
        });
    }

    function updateFavCounter() {
        const badge = document.querySelector('.fav-badge');
        if (badge) {
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            badge.textContent = favs.length > 0 ? favs.length : '';
        }
    }

    renderHistory();
    updateFavCounter();
});