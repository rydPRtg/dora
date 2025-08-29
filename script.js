// Инициализация Telegram Web App
Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
document.getElementById('username').textContent = user ? `@${user.username}` : 'Гость';

// Глобальные переменные
let doramas = [];
let genres = [];

// Пагинация
let currentPage = 1;
const itemsPerPage = 10;
let filteredDoramas = [];

// Текущая дорама и эпизод для сохранения прогресса
let currentDorama = null;
let currentEpisode = null;
let currentIframe = null;
let progressInterval = null;

// Загрузка данных из GitHub
async function loadData() {
    try {
        console.log('Загрузка данных...');
        const response = await fetch('https://raw.githubusercontent.com/rydprtg/dora/main/doramas.json');
        if (response.ok) {
            const data = await response.json();
            doramas = data.doramas || [];
            genres = data.genres || ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
            console.log(`Загружено дорам: ${doramas.length}, жанров: ${genres.length}`);
        } else {
            console.warn('Файл не найден, используем демо данные');
            // Если файл не найден, используем демо данные
            doramas = getDemoData();
            genres = ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        }
        filteredDoramas = [...doramas];
        renderDoramas();
        updateGenresMenu();
        updateFavoriteButtons();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Используем демо данные в случае ошибки
        doramas = getDemoData();
        genres = ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        filteredDoramas = [...doramas];
        renderDoramas();
        updateGenresMenu();
    }
}

// Демо данные для тестирования
function getDemoData() {
    return [
        {
