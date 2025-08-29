// Инициализация Telegram Web App
Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
document.getElementById('username').textContent = user ? `@${user.username}` : 'Гость';

// Базовый URL локального сервера
const BASE_URL = 'http://localhost:5000'; // Для теста, позже замените на сервер

// Загрузка динамического контента
function loadContent() {
    const container = document.getElementById('content-container');
    container.innerHTML = `<iframe src="${BASE_URL}/content.html" style="width:100%;height:100%;border:none;"></iframe>`;
}

// Профиль
document.getElementById('profile-btn').addEventListener('click', () => {
    alert('Профиль пока в разработке');
});

// Инициализация
loadContent();
Telegram.WebApp.expand();
