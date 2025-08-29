// Инициализация Telegram Web App
Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
document.getElementById('username').textContent = user ? `@${user.username}` : 'Гость';

// Базовый URL сервера (замените на ваш)
const BASE_URL = 'http://your-server:5000'; // Например, http://your-server:5000
const DORAMAS_URL = `${BASE_URL}/doramas.json?v=${Date.now()}`;
const GENRES_URL = `${BASE_URL}/genres.json?v=${Date.now()}`;

// Загрузка жанров
let genres = [];
async function loadGenres() {
    try {
        const response = await fetch(GENRES_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        genres = await response.json();
        renderGenres();
    } catch (error) {
        console.error('Ошибка загрузки жанров:', error);
        genres = ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        renderGenres();
    }
}

// Рендер жанров
function renderGenres() {
    const genresList = document.getElementById('genres-list');
    genresList.innerHTML = '';
    const columnCount = Math.ceil(genres.length / 2);
    const column1 = genres.slice(0, columnCount);
    const column2 = genres.slice(columnCount);
    const column1Div = document.createElement('div');
    column1Div.classList.add('column');
    column1.forEach(genre => {
        const btn = document.createElement('button');
        btn.textContent = genre;
        btn.addEventListener('click', () => {
            filteredDoramas = doramas.filter(d => d.genre === genre);
            currentPage = 1;
            renderDoramas();
            hideDropdowns();
        });
        column1Div.appendChild(btn);
    });
    const column2Div = document.createElement('div');
    column2Div.classList.add('column');
    column2.forEach(genre => {
        const btn = document.createElement('button');
        btn.textContent = genre;
        btn.addEventListener('click', () => {
            filteredDoramas = doramas.filter(d => d.genre === genre);
            currentPage = 1;
            renderDoramas();
            hideDropdowns();
        });
        column2Div.appendChild(btn);
    });
    genresList.appendChild(column1Div);
    genresList.appendChild(column2Div);
}

// Загрузка дорам
let doramas = [];
async function loadDoramas() {
    try {
        const response = await fetch(DORAMAS_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        doramas = await response.json();
        filteredDoramas = [...doramas];
        renderDoramas();
    } catch (error) {
        console.error('Ошибка загрузки дорам:', error);
        doramas = [
            {
                id: '1',
                name: 'Дорама 1',
                year: 2024,
                genre: 'Комедия',
                episodesCount: 16,
                seasons: [{ season: 1, episodes: [{ number: 1, url: 'https://sicarus.cdn.cinemap.cc/861ddd8f4fef33526bebeceb4a0f2063:2025082900/tvseries/25bbe3f2dc3022f31cb426070fc765022c5897a0/480.mp4' }] }],
                image: 'https://via.placeholder.com/100x150?text=Dorama1',
                description: 'Описание дорамы 1. Жанр: Комедия, Год: 2024.'
            }
        ];
        filteredDoramas = [...doramas];
        renderDoramas();
    }
}

// Пагинация
let currentPage = 1;
const itemsPerPage = 10;
let filteredDoramas = [];

// Текущая дорама и эпизод
let currentDorama = null;
let currentEpisode = null;
let videoElement = null;
let lastSavedTime = 0;

// Рендер списка дорам
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
            <img src="${BASE_URL}/${dorama.image}" alt="${dorama.name}">
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
function showDoramaDetails(dorama) {
    currentDorama = dorama;
    Telegram.WebApp.CloudStorage.setItem('last_opened_dorama', JSON.stringify(dorama.id));

    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const details = document.getElementById('dorama-details');
    let episodesHtml = '<div class="episodes-list">';
    dorama.seasons.forEach(season => {
        season.episodes.forEach(episode => {
            episodesHtml += `<button class="episode-btn" data-season="${season.season}" data-number="${episode.number}" data-url="${episode.url}">Сезон ${season.season}, Серия ${episode.number}</button>`;
        });
    });
    episodesHtml += '</div>';

    details.innerHTML = `
        <img src="${BASE_URL}/${dorama.image}" alt="${dorama.name}">
        <h2>${dorama.name}</h2>
        <p>${dorama.description}</p>
        <p>Количество серий: ${dorama.episodesCount}</p>
        ${episodesHtml}
        <video id="player" controls width="100%"></video>
        <button id="back-btn">Назад</button>
    `;
    details.classList.remove('hidden');

    videoElement = document.getElementById('player');

    // Загружаем первую серию первого сезона
    if (dorama.seasons.length > 0 && dorama.seasons[0].episodes.length > 0) {
        loadEpisode(dorama, dorama.seasons[0], dorama.seasons[0].episodes[0]);
    }

    // Слушатели для кнопок серий
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            saveProgress();
            const season = dorama.seasons.find(s => s.season == btn.dataset.season);
            const episode = season.episodes.find(ep => ep.number == btn.dataset.number);
            loadEpisode(dorama, season, episode);
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
            const watchedKey = `watched_${dorama.id}_${currentEpisode.season}_${currentEpisode.number}`;
            Telegram.WebApp.CloudStorage.setItem(watchedKey, JSON.stringify(true));
        }
    });

    // Сохранение при скрытии вкладки
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveProgress();
        }
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        saveProgress();
        details.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
        videoElement = null;
        currentEpisode = null;
        currentDorama = null;
    });
}

// Загрузка эпизода
function loadEpisode(dorama, season, episode) {
    currentEpisode = { ...episode, season: season.season };
    videoElement.src = episode.url;
    videoElement.load();

    const progressKey = `progress_${dorama.id}_${season.season}_${episode.number}`;
    Telegram.WebApp.CloudStorage.getItem(progressKey, (err, value) => {
        if (value) {
            videoElement.currentTime = JSON.parse(value);
            lastSavedTime = videoElement.currentTime;
        } else {
            videoElement.currentTime = 0;
            lastSavedTime = 0;
        }
        videoElement.play().catch(error => console.error('Ошибка воспроизведения:', error));
    });
}

// Сохранение прогресса
function saveProgress() {
    if (currentDorama && currentEpisode && videoElement) {
        const progressKey = `progress_${currentDorama.id}_${currentEpisode.season}_${currentEpisode.number}`;
        Telegram.WebApp.CloudStorage.setItem(progressKey, JSON.stringify(videoElement.currentTime));
    }
}

// Добавление в избранное
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

// Показ профиля
function showProfile() {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const profile = document.getElementById('profile-content');
    profile.innerHTML = '<h2>Избранное</h2><div id="favorites-list"></div><h2>Просмотренное</h2><div id="watched-list"></div>';

    // Избранное
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        const favoritesList = document.getElementById('favorites-list');
        let favorites = value ? JSON.parse(value) : [];
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p>Пусто</p>';
        } else {
            favorites.forEach(id => {
                const dorama = doramas.find(d => d.id === id);
                if (dorama) {
                    const item = document.createElement('div');
                    item.textContent = dorama.name;
                    favoritesList.appendChild(item);
                }
            });
        }
    });

    // Просмотренное
    const watchedList = document.getElementById('watched-list');
    let watchedItems = [];
    doramas.forEach(dorama => {
        dorama.seasons.forEach(season => {
            season.episodes.forEach(episode => {
                const watchedKey = `watched_${dorama.id}_${season.season}_${episode.number}`;
                Telegram.WebApp.CloudStorage.getItem(watchedKey, (err, value) => {
                    if (value && JSON.parse(value)) {
                        watchedItems.push(`${dorama.name} - Сезон ${season.season}, Серия ${episode.number}`);
                        watchedList.innerHTML = watchedItems.length > 0 ? watchedItems.map(item => `<div>${item}</div>`).join('') : '<p>Пусто</p>';
                    }
                });
            });
        });
    });

    profile.innerHTML += '<button id="back-profile-btn">Назад</button>';
    profile.classList.remove('hidden');

    document.getElementById('back-profile-btn').addEventListener('click', () => {
        profile.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
    });
}

// Кнопки меню
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
    filteredDoramas = [...doramas].sort((a, b) => b.year - a.year);
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
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

// Поиск
document.getElementById('search-btn').addEventListener('click', () => {
    alert('Логика поиска будет добавлена позже');
});

// Профиль
document.getElementById('profile-btn').addEventListener('click', showProfile);

// Инициализация
loadGenres();
loadDoramas();
Telegram.WebApp.expand();
