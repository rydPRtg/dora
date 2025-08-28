// Инициализация Telegram Web App
Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
document.getElementById('username').textContent = user ? `@${user.username}` : 'Гость';

// Примерный список дорам (база данных в JS для простоты изменения, добавьте/измените объекты здесь)
const doramas = [
    { 
        id: 1, 
        name: 'Дорама 1', 
        year: 2024, 
        genre: 'Комедия', 
        episodesCount: 16,  // Общее количество серий (для отображения)
        episodes: [  // Массив серий, легко добавляйте больше {number: N, url: '...'}
            { number: 1, url: 'https://sicarus.cdn.cinemap.cc/861ddd8f4fef33526bebeceb4a0f2063:2025082900/tvseries/25bbe3f2dc3022f31cb426070fc765022c5897a0/480.mp4' }
        ], 
        image: 'https://via.placeholder.com/100x150?text=Dorama1', 
        description: 'Описание дорамы 1. Жанр: Комедия, Год: 2024.' 
    },
    { 
        id: 2, 
        name: 'Дорама 2', 
        year: 2023, 
        genre: 'Драма', 
        episodesCount: 20, 
        episodes: [],  // Добавьте серии аналогично
        image: 'https://via.placeholder.com/100x150?text=Dorama2', 
        description: 'Описание дорамы 2. Жанр: Драма, Год: 2023.' 
    },
    // Добавьте еще дорам, формат: { id: N, name: '...', year: N, genre: '...', episodesCount: N, episodes: [{number:1, url:'...'}, ...], image: 'url', description: '...' }
];

// Пагинация: 10 на страницу
let currentPage = 1;
const itemsPerPage = 10;
let filteredDoramas = [...doramas]; // Для фильтров

// Функция рендера списка дорам
function renderDoramas(page = 1) {
    const content = document.getElementById('main-content');
    content.innerHTML = '';
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredDoramas.slice(start, end);

    pageItems.forEach(dorama => {
        const item = document.createElement('div');
        item.classList.add('dorama-item');
        item.innerHTML = `
            <img src="${dorama.image}" alt="${dorama.name}">
            <div class="dorama-info">
                <h3>${dorama.name}</h3>
                <p>Год: ${dorama.year}, Жанр: ${dorama.genre}, Серии: ${dorama.episodesCount}</p>
            </div>
            <button class="add-favorite" data-id="${dorama.id}">Добавить в избранное</button>
        `;
        item.querySelector('.dorama-info').addEventListener('click', () => showDoramaDetails(dorama));
        item.querySelector('.add-favorite').addEventListener('click', () => addToFavorites(dorama.id));
        content.appendChild(item);
    });

    renderPagination();
}

// Пагинация
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredDoramas.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.disabled = i === currentPage;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderDoramas(i);
        });
        pagination.appendChild(btn);
    }
}

// Показ деталей дорамы
let currentEpisode = null;
let lastSavedTime = 0;
let videoElement = null;

function showDoramaDetails(dorama) {
    // Сохраняем, что открыли эту дораму
    Telegram.WebApp.CloudStorage.setItem('last_opened_dorama', JSON.stringify(dorama.id));

    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const details = document.getElementById('dorama-details');
    let episodesHtml = '<div class="episodes-list">';
    dorama.episodes.forEach(episode => {
        episodesHtml += `<button class="episode-btn" data-number="${episode.number}" data-url="${episode.url}">Серия ${episode.number}</button>`;
    });
    episodesHtml += '</div>';

    details.innerHTML = `
        <img src="${dorama.image}" alt="${dorama.name}">
        <h2>${dorama.name}</h2>
        <p>${dorama.description}</p>
        <p>Количество серий: ${dorama.episodesCount}</p>
        ${episodesHtml}
        <video id="player" controls width="100%"></video>
        <button id="back-btn">Назад</button>
    `;
    details.classList.remove('hidden');

    videoElement = document.getElementById('player');

    // Загружаем первую серию по умолчанию
    if (dorama.episodes.length > 0) {
        loadEpisode(dorama, dorama.episodes[0]);
    }

    // Слушатели на кнопки серий
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const episode = dorama.episodes.find(ep => ep.number == btn.dataset.number);
            saveProgress();  // Сохраняем прогресс текущей перед сменой
            loadEpisode(dorama, episode);
        });
    });

    // События видео
    videoElement.addEventListener('timeupdate', () => {
        if (currentEpisode && Math.abs(videoElement.currentTime - lastSavedTime) > 10) {
            lastSavedTime = videoElement.currentTime;
            saveProgress();
        }
    });

    videoElement.addEventListener('ended', () => {
        if (currentEpisode) {
            const watchedKey = `watched_${dorama.id}_${currentEpisode.number}`;
            Telegram.WebApp.CloudStorage.setItem(watchedKey, JSON.stringify(true));
        }
    });

    // Сохранение при скрытии вкладки (выход из бота)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveProgress();
        }
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        saveProgress();  // Сохраняем перед выходом
        details.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
        videoElement = null;
        currentEpisode = null;
    });
}

// Загрузка эпизода
function loadEpisode(dorama, episode) {
    currentEpisode = episode;
    videoElement.src = episode.url;
    videoElement.load();

    const progressKey = `progress_${dorama.id}_${episode.number}`;
    Telegram.WebApp.CloudStorage.getItem(progressKey, (err, value) => {
        if (value) {
            videoElement.currentTime = JSON.parse(value);
            lastSavedTime = videoElement.currentTime;
        } else {
            videoElement.currentTime = 0;
            lastSavedTime = 0;
        }
        videoElement.play();  // Автозапуск, если нужно отключите
    });
}

// Сохранение прогресса
function saveProgress() {
    if (currentEpisode && videoElement) {
        const progressKey = `progress_${currentEpisode.doramaId}_${currentEpisode.number}`;  // Ошибка: dorama.id, fix
        wait, в loadEpisode добавить doramaId? Нет, dorama доступен.
        // Исправить: В saveProgress использовать dorama.id, но dorama не в scope. Добавить global currentDorama.
    }
} wait, refactoring needed.

// Лучше: Добавить currentDorama
let currentDorama = null;

function showDoramaDetails(dorama) {
    currentDorama = dorama;
    // ... остальное
}

function saveProgress() {
    if (currentDorama && currentEpisode && videoElement) {
        const progressKey = `progress_${currentDorama.id}_${currentEpisode.number}`;
        Telegram.WebApp.CloudStorage.setItem(progressKey, JSON.stringify(videoElement.currentTime));
    }
}

// Избранное (без изменений)
function addToFavorites(id) {
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        let favorites = value ? JSON.parse(value) : [];
        if (!favorites.includes(id)) {
            favorites.push(id);
            Telegram.WebApp.CloudStorage.setItem('favorites', JSON.stringify(favorites), (err, success) => {
                if (success) alert('Добавлено в избранное!');
            });
        } else {
            alert('Уже в избранном');
        }
    });
}

// Показ профиля с избранным и просмотренным (добавил placeholder для просмотренного)
function showProfile() {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const profile = document.getElementById('profile-content');
    profile.innerHTML = '<h2>Избранное</h2>';
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        let favorites = value ? JSON.parse(value) : [];
        favorites.forEach(id => {
            const dorama = doramas.find(d => d.id === id);
            if (dorama) {
                const item = document.createElement('div');
                item.textContent = dorama.name;
                profile.appendChild(item);
            }
        });
    });
    // Placeholder для просмотренного: Добавьте логику перечисления watched_ keys если нужно
    profile.innerHTML += '<h2>Просмотренное</h2><p>Логика будет добавлена (проверяйте watched_${id}_${num} в storage)</p>';
    profile.classList.remove('hidden');
    // Добавьте кнопку назад аналогично details
}

// Кнопки меню (без изменений)
document.getElementById('home-btn').addEventListener('click', () => {
    filteredDoramas = [...doramas];
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
});

document.getElementById('genres-btn').addEventListener('click', () => {
    document.getElementById('genres-list').classList.toggle('hidden');
    document.getElementById('years-list').classList.add('hidden');
});

document.getElementById('years-btn').addEventListener('click', () => {
    document.getElementById('years-list').classList.toggle('hidden');
    document.getElementById('genres-list').classList.add('hidden');
});

document.getElementById('top-btn').addEventListener('click', () => {
    // Placeholder для ТОП: сортировка по году descending
    filteredDoramas = [...doramas].sort((a, b) => b.year - a.year);
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
});

// Фильтры жанров
document.querySelectorAll('#genres-list button').forEach(btn => {
    btn.addEventListener('click', () => {
        const genre = btn.textContent;
        filteredDoramas = doramas.filter(d => d.genre === genre);
        currentPage = 1;
        renderDoramas();
        hideDropdowns();
    });
});

// Фильтры годов
document.querySelectorAll('#years-list button').forEach(btn => {
    btn.addEventListener('click', () => {
        const year = parseInt(btn.textContent);
        filteredDoramas = doramas.filter(d => d.year === year);
        currentPage = 1;
        renderDoramas();
        hideDropdowns();
    });
});

function hideDropdowns() {
    document.getElementById('genres-list').classList.add('hidden');
    document.getElementById('years-list').classList.add('hidden');
}

// Поиск и Профиль
document.getElementById('search-btn').addEventListener('click', () => {
    alert('Логика поиска будет добавлена позже');
});

document.getElementById('profile-btn').addEventListener('click', () => {
    showProfile();
});

// Инициализация
renderDoramas();
Telegram.WebApp.expand(); // Развернуть на весь экран
