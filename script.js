/* ============================================
   CS2 ЛАЙНАПЫ - ГЛАВНЫЙ СКРИПТ
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearch();
    initModal();
    initCopyButtons();
});

/* ---------- ФИЛЬТРЫ ---------- */
function initFilters() {
    const filterGroups = document.querySelectorAll('.filter-group');

    filterGroups.forEach(group => {
        const buttons = group.querySelectorAll('.filter-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Снимаем active со всех кнопок этой группы
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                applyFilters();
            });
        });
    });
}

function applyFilters() {
    const cards = document.querySelectorAll('.lineup-card');
    const activeType = document.querySelector('.filter-type .filter-btn.active')?.dataset.filter || 'all';
    const activeSite = document.querySelector('.filter-site .filter-btn.active')?.dataset.filter || 'all';
    const searchValue = document.getElementById('search-input')?.value.toLowerCase().trim() || '';

    let visibleCount = 0;

    cards.forEach(card => {
        const cardType = card.dataset.type;
        const cardSite = card.dataset.site;
        const cardTitle = card.dataset.title?.toLowerCase() || '';

        const matchType = activeType === 'all' || cardType === activeType;
        const matchSite = activeSite === 'all' || cardSite === activeSite;
        const matchSearch = !searchValue || cardTitle.includes(searchValue);

        if (matchType && matchSite && matchSearch) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });

    updateResultsInfo(visibleCount, cards.length);
}

function updateResultsInfo(visible, total) {
    const info = document.getElementById('results-info');
    if (!info) return;

    if (visible === 0) {
        info.textContent = 'Ничего не найдено';
    } else if (visible === total) {
        info.textContent = `Показано: ${visible} раскидок`;
    } else {
        info.textContent = `Найдено: ${visible} из ${total} раскидок`;
    }
}

/* ---------- ПОИСК ---------- */
function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;

    let searchTimeout;
    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 200);
    });
}

/* ---------- МОДАЛЬНОЕ ОКНО ---------- */
function initModal() {
    const modal = document.getElementById('lineup-modal');
    if (!modal) return;

    const cards = document.querySelectorAll('.lineup-card');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal;

    cards.forEach(card => {
        card.addEventListener('click', () => {
            openModal(card);
        });
    });

    closeBtn?.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openModal(card) {
    const modal = document.getElementById('lineup-modal');
    if (!modal) return;

    const title = card.dataset.title;
    const desc = card.dataset.desc;
    const position = card.dataset.position;
    const aim = card.dataset.aim;
    const instruction = card.dataset.instruction;
    const videoSrc = card.dataset.video;
    const type = card.dataset.type;

    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-subtitle').textContent = desc;
    modal.querySelector('.modal-position p').textContent = position;
    modal.querySelector('.modal-aim p').textContent = aim;
    modal.querySelector('.instruction-box p').textContent = instruction;

    // Обновляем видео
    const videoContainer = modal.querySelector('.modal-video');
    if (videoSrc) {
        videoContainer.innerHTML = `<video src="${videoSrc}" controls autoplay loop></video>`;
    } else {
        videoContainer.innerHTML = `
            <div class="modal-video-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <p>Видео будет добавлено позже</p>
            </div>
        `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('lineup-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Останавливаем видео
    const video = modal.querySelector('video');
    if (video) video.pause();
}

/* ---------- КОПИРОВАНИЕ ---------- */
function initCopyButtons() {
    const copyBtns = document.querySelectorAll('.copy-btn');

    copyBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const text = btn.closest('.instruction-box').querySelector('p').textContent;

            try {
                await navigator.clipboard.writeText(text);
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Скопировано';
                btn.classList.add('copied');

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Не удалось скопировать:', err);
            }
        });
    });
}