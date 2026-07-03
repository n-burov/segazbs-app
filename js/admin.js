// js/admin.js
const ADMIN_IDS = [984825922]; // ← Сюда ID админов

// Получаем ID пользователя из Telegram
const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;

// Проверяем, админ ли это
function isAdmin() {
    return ADMIN_IDS.includes(userId);
}

// Показываем админ-кнопку, если пользователь админ
function showAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn && isAdmin()) {
        adminBtn.style.display = 'flex';
    }
}

// Вход в админку через скрытый жест
function setupAdminAccess() {
    // 1. Кнопка в меню (если есть)
    showAdminButton();
    
    // 2. Скрытый жест: 5 быстрых тапов по логотипу
    let tapCount = 0;
    let tapTimer = null;
    
    const logo = document.querySelector('.app-header img, .logo, .avatar');
    if (logo) {
        logo.addEventListener('click', () => {
            tapCount++;
            if (tapTimer) clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
            
            if (tapCount >= 5) {
                tapCount = 0;
                if (isAdmin()) {
                    openAdmin();
                } else {
                    tg.showPopup({
                        title: '⛔ Доступ запрещён',
                        message: 'Только администраторы могут войти в панель управления.',
                        buttons: [{ type: 'ok' }]
                    });
                }
            }
        });
    }
    
    // 3. Свайп вниз три раза (для продвинутых)
    let swipeCount = 0;
    let lastSwipeTime = 0;
    
    document.addEventListener('touchstart', (e) => {
        const startY = e.touches[0].clientY;
        const touchEnd = (ev) => {
            const endY = ev.changedTouches[0].clientY;
            const diff = startY - endY;
            if (diff > 50) { // свайп вниз
                const now = Date.now();
                if (now - lastSwipeTime < 3000) {
                    swipeCount++;
                } else {
                    swipeCount = 1;
                }
                lastSwipeTime = now;
                
                if (swipeCount >= 3) {
                    swipeCount = 0;
                    if (isAdmin()) {
                        openAdmin();
                    } else {
                        tg.showPopup({
                            title: '⛔ Доступ запрещён',
                            message: 'Только администраторы могут войти в панель управления.',
                            buttons: [{ type: 'ok' }]
                        });
                    }
                }
            }
            document.removeEventListener('touchend', touchEnd);
        };
        document.addEventListener('touchend', touchEnd);
    });
}

// Открыть админку
function openAdmin() {
    // Показываем админ-панель в том же окне
    const mainContent = document.getElementById('mainContent');
    const adminPanel = document.getElementById('adminPanel');
    
    if (mainContent && adminPanel) {
        mainContent.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAdminData();
    } else {
        // Если нет встроенной админки — перезагружаем с параметром
        tg.showPopup({
            title: '🔐 Админ-панель',
            message: 'Переход в панель управления...',
            buttons: [{ type: 'ok' }]
        });
        // Можно перезагрузить с параметром
        window.location.href = window.location.pathname + '?admin=true';
    }
}

// Выход из админки
function closeAdmin() {
    const mainContent = document.getElementById('mainContent');
    const adminPanel = document.getElementById('adminPanel');
    
    if (mainContent && adminPanel) {
        mainContent.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

// Загрузка данных для админки
async function loadAdminData() {
    try {
        const [addons, configs, macros] = await Promise.all([
            fetch('data/addons.json').then(r => r.json()),
            fetch('data/configs.json').then(r => r.json()),
            fetch('data/macros.json').then(r => r.json())
        ]);
        
        document.getElementById('adminAddonsCount').textContent = addons.length;
        document.getElementById('adminConfigsCount').textContent = configs.length;
        document.getElementById('adminMacrosCount').textContent = macros.length;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setupAdminAccess();
});

// Экспортируем для использования в HTML
window.isAdmin = isAdmin;
window.openAdmin = openAdmin;
window.closeAdmin = closeAdmin;
