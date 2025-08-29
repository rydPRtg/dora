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
        const response = await fetch('https://raw.githubusercontent.com/rydprtg/dora/main/doramas.json');
        if (response.ok) {
            const data = await response.json();
            doramas = data.doramas || [];
            genres = data.genres || ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        } else {
            // Если файл не найден, используем демо данные
            doramas = getDemoData();
            genres = ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        }
        filteredDoramas = [...doramas];
        renderDoramas();
        updateGenresMenu();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Используем демо данные в случае ошибки
        doramas = getDemoData();
        genres = ['Комедия', 'Драма', 'Криминал', 'Мистика', 'Приключения', 'Школа', 'Мини-дорамы'];
        filteredDoramas = [...doramas];
        renderDoramas();
    }
}

// Демо данные для тестирования
function getDemoData() {
    return [
        {
            id: 1,
            name: 'Дорама Тест',
            year: 2024,
            genre: 'Комедия',
            episodesCount: 2,
            seasons: 1,
            episodesPerSeason: [2],
            episodes: [
                { season: 1, number: 1, url: 'https://drive.google.com/file/d/1ZPhUEB7srhJDi-9XdCjOD0ZMGRNsCm0L/preview' },
                { season: 1, number: 2, url: 'https://drive.google.com/file/d/1ZPhUEB7srhJDi-9XdCjOD0ZMGRNsCm0L/preview' }
            ],
            image: 'https://via.placeholder.com/100x150?text=Demo',
            description: 'Тестовая дорама для демонстрации функционала.'
        }
    ];
}

// Обновление меню жанров
function updateGenresMenu() {
    const genresContainer = document.querySelector('#genres-list .column');
    if (genresContainer) {
        genresContainer.innerHTML = '';
        genres.forEach((genre, index) => {
            if (index < Math.ceil(genres.length / 2)) {
                const button = document.createElement('button');
                button.textContent = genre;
                button.addEventListener('click', () => filterByGenre(genre));
                genresContainer.appendChild(button);
            }
        });
    }

    const secondColumn = document.querySelector('#genres-list .column:nth-child(2)');
    if (secondColumn) {
        secondColumn.innerHTML = '';
        genres.forEach((genre, index) => {
            if (index >= Math.ceil(genres.length / 2)) {
                const button = document.createElement('button');
                button.textContent = genre;
                button.addEventListener('click', () => filterByGenre(genre));
                secondColumn.appendChild(button);
            }
        });
    }
}

// Фильтрация по жанру
function filterByGenre(genre) {
    filteredDoramas = doramas.filter(d => d.genre === genre);
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
}

// Рендер списка дорам
function renderDoramas(page = 1) {
    const content = document.getElementById('main-content');
    content.innerHTML = '';
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredDoramas.slice(start, end);

    if (pageItems.length === 0) {
        content.innerHTML = '<div class="no-results">Дорамы не найдены</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    pageItems.forEach(dorama => {
        const item = document.createElement('div');
        item.classList.add('dorama-item');
        item.innerHTML = `
            <img src="${dorama.image}" alt="${dorama.name}" onerror="this.src='https://via.placeholder.com/100x150?text=No+Image'">
            <div class="dorama-info">
                <h3>${dorama.name}</h3>
                <p>Год: ${dorama.year}, Жанр: ${dorama.genre}, Серий: ${dorama.episodesCount}</p>
                <p>Сезонов: ${dorama.seasons || 1}</p>
            </div>
            <button class="add-favorite" data-id="${dorama.id}">♥ Избранное</button>
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

    if (totalPages <= 1) return;

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
    
    // Группируем эпизоды по сезонам
    const episodesBySeason = {};
    dorama.episodes.forEach(episode => {
        if (!episodesBySeason[episode.season]) {
            episodesBySeason[episode.season] = [];
        }
        episodesBySeason[episode.season].push(episode);
    });

    let seasonsHtml = '';
    Object.keys(episodesBySeason).sort((a, b) => a - b).forEach(season => {
        seasonsHtml += `<div class="season-block">`;
        seasonsHtml += `<h4>Сезон ${season}</h4>`;
        seasonsHtml += `<div class="episodes-list">`;
        
        episodesBySeason[season].sort((a, b) => a.number - b.number).forEach(episode => {
            seasonsHtml += `<button class="episode-btn" data-season="${episode.season}" data-number="${episode.number}" data-url="${episode.url}">Серия ${episode.number}</button>`;
        });
        
        seasonsHtml += `</div></div>`;
    });

    details.innerHTML = `
        <div class="dorama-header">
            <img src="${dorama.image}" alt="${dorama.name}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="dorama-meta">
                <h2>${dorama.name}</h2>
                <p><strong>Год:</strong> ${dorama.year}</p>
                <p><strong>Жанр:</strong> ${dorama.genre}</p>
                <p><strong>Сезонов:</strong> ${dorama.seasons || 1}</p>
                <p><strong>Серий:</strong> ${dorama.episodesCount}</p>
                <p class="description">${dorama.description}</p>
            </div>
        </div>
        ${seasonsHtml}
        <div id="player-container" class="hidden">
            <div id="episode-info"></div>
            <iframe id="player" src="" frameborder="0" allow="autoplay" allowfullscreen></iframe>
            <div class="player-controls">
                <button id="prev-episode">← Предыдущая</button>
                <button id="next-episode">Следующая →</button>
            </div>
        </div>
        <button id="back-btn" class="back-button">← Назад к списку</button>
    `;
    details.classList.remove('hidden');

    // Обработчики для кнопок эпизодов
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const season = parseInt(btn.dataset.season);
            const number = parseInt(btn.dataset.number);
            const episode = dorama.episodes.find(ep => ep.season === season && ep.number === number);
            if (episode) {
                loadEpisode(dorama, episode);
            }
        });
    });

    // Загружаем последний просмотренный эпизод или первый доступный
    loadLastWatchedEpisode(dorama);

    // Обработчик кнопки "Назад"
    document.getElementById('back-btn').addEventListener('click', () => {
        stopProgressTracking();
        details.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
        currentDorama = null;
        currentEpisode = null;
        currentIframe = null;
    });

    // Обработчики навигации между эпизодами
    document.getElementById('prev-episode').addEventListener('click', () => {
        if (currentEpisode) {
            const prevEpisode = getPreviousEpisode(dorama, currentEpisode);
            if (prevEpisode) {
                loadEpisode(dorama, prevEpisode);
            }
        }
    });

    document.getElementById('next-episode').addEventListener('click', () => {
        if (currentEpisode) {
            const nextEpisode = getNextEpisode(dorama, currentEpisode);
            if (nextEpisode) {
                loadEpisode(dorama, nextEpisode);
            }
        }
    });
}

// Загрузка последнего просмотренного эпизода
function loadLastWatchedEpisode(dorama) {
    const lastWatchedKey = `last_watched_${dorama.id}`;
    Telegram.WebApp.CloudStorage.getItem(lastWatchedKey, (err, value) => {
        if (value) {
            try {
                const lastWatched = JSON.parse(value);
                const episode = dorama.episodes.find(ep => 
                    ep.season === lastWatched.season && ep.number === lastWatched.number
                );
                if (episode) {
                    loadEpisode(dorama, episode);
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга последнего эпизода:', e);
            }
        }
        
        // Если нет сохраненного эпизода, загружаем первый
        if (dorama.episodes.length > 0) {
            const firstEpisode = dorama.episodes.find(ep => ep.season === 1 && ep.number === 1) || dorama.episodes[0];
            loadEpisode(dorama, firstEpisode);
        }
    });
}

// Загрузка эпизода
function loadEpisode(dorama, episode) {
    currentEpisode = episode;
    currentIframe = document.getElementById('player');
    
    // Сохраняем как последний просматриваемый
    const lastWatchedKey = `last_watched_${dorama.id}`;
    Telegram.WebApp.CloudStorage.setItem(lastWatchedKey, JSON.stringify({
        season: episode.season,
        number: episode.number
    }));

    // Обновляем информацию об эпизоде
    const episodeInfo = document.getElementById('episode-info');
    episodeInfo.innerHTML = `<h3>Сезон ${episode.season}, Серия ${episode.number}</h3>`;

    // Показываем плеер
    const playerContainer = document.getElementById('player-container');
    playerContainer.classList.remove('hidden');

    // Загружаем iframe
    currentIframe.src = episode.url;
    
    // Выделяем активный эпизод
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.season) === episode.season && 
            parseInt(btn.dataset.number) === episode.number) {
            btn.classList.add('active');
        }
    });

    // Запускаем отслеживание прогресса
    startProgressTracking(dorama, episode);
    
    // Прокручиваем к плееру
    playerContainer.scrollIntoView({ behavior: 'smooth' });
}

// Получение предыдущего эпизода
function getPreviousEpisode(dorama, currentEp) {
    const allEpisodes = [...dorama.episodes].sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.number - b.number;
    });
    
    const currentIndex = allEpisodes.findIndex(ep => 
        ep.season === currentEp.season && ep.number === currentEp.number
    );
    
    return currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
}

// Получение следующего эпизода
function getNextEpisode(dorama, currentEp) {
    const allEpisodes = [...dorama.episodes].sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.number - b.number;
    });
    
    const currentIndex = allEpisodes.findIndex(ep => 
        ep.season === currentEp.season && ep.number === currentEp.number
    );
    
    return currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;
}

// Отслеживание прогресса просмотра
function startProgressTracking(dorama, episode) {
    stopProgressTracking();
    
    // Создаем ключ для сохранения прогресса
    const progressKey = `progress_${dorama.id}_${episode.season}_${episode.number}`;
    
    // Загружаем сохраненное время (для Google Drive iframe это сложно, но сохраним факт просмотра)
    Telegram.WebApp.CloudStorage.getItem(progressKey, (err, value) => {
        if (value) {
            console.log('Найден сохраненный прогресс:', value);
        }
    });

    // Сохраняем прогресс каждые 30 секунд
    progressInterval = setInterval(() => {
        const currentTime = Date.now();
        Telegram.WebApp.CloudStorage.setItem(progressKey, JSON.stringify({
            timestamp: currentTime,
            lastViewed: new Date().toISOString()
        }));
    }, 30000);

    // Отмечаем как просмотренный через 5 минут
    setTimeout(() => {
        const watchedKey = `watched_${dorama.id}_${episode.season}_${episode.number}`;
        Telegram.WebApp.CloudStorage.setItem(watchedKey, JSON.stringify(true));
        
        // Обновляем кнопку эпизода
        const episodeBtn = document.querySelector(`[data-season="${episode.season}"][data-number="${episode.number}"]`);
        if (episodeBtn) {
            episodeBtn.classList.add('watched');
        }
    }, 300000); // 5 минут
}

// Остановка отслеживания прогресса
function stopProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Добавление в избранное
function addToFavorites(id) {
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        let favorites = value ? JSON.parse(value) : [];
        if (!favorites.includes(id)) {
            favorites.push(id);
            Telegram.WebApp.CloudStorage.setItem('favorites', JSON.stringify(favorites), (err, success) => {
                if (success) {
                    Telegram.WebApp.showAlert('Добавлено в избранное!');
                    // Обновляем кнопку
                    updateFavoriteButtons();
                }
            });
        } else {
            // Удаляем из избранного
            favorites = favorites.filter(fav => fav !== id);
            Telegram.WebApp.CloudStorage.setItem('favorites', JSON.stringify(favorites), (err, success) => {
                if (success) {
                    Telegram.WebApp.showAlert('Удалено из избранного!');
                    updateFavoriteButtons();
                }
            });
        }
    });
}

// Обновление кнопок избранного
function updateFavoriteButtons() {
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        const favorites = value ? JSON.parse(value) : [];
        document.querySelectorAll('.add-favorite').forEach(btn => {
            const id = parseInt(btn.dataset.id);
            if (favorites.includes(id)) {
                btn.innerHTML = '♥ В избранном';
                btn.classList.add('favorited');
            } else {
                btn.innerHTML = '♥ Избранное';
                btn.classList.remove('favorited');
            }
        });
    });
}

// Показ профиля
function showProfile() {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const profile = document.getElementById('profile-content');
    
    profile.innerHTML = `
        <div class="profile-header">
            <h2>👤 Мой профиль</h2>
        </div>
        <div class="profile-section">
            <h3>❤️ Избранное</h3>
            <div id="favorites-list">Загрузка...</div>
        </div>
        <div class="profile-section">
            <h3>👁️ Просмотренное</h3>
            <div id="watched-list">Загрузка...</div>
        </div>
        <button id="back-profile-btn" class="back-button">← Назад</button>
    `;

    // Загружаем избранное
    Telegram.WebApp.CloudStorage.getItem('favorites', (err, value) => {
        const favoritesList = document.getElementById('favorites-list');
        const favorites = value ? JSON.parse(value) : [];
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="empty-message">Пока нет избранных дорам</p>';
        } else {
            favoritesList.innerHTML = '';
            favorites.forEach(id => {
                const dorama = doramas.find(d => d.id === id);
                if (dorama) {
                    const item = document.createElement('div');
                    item.classList.add('profile-item');
                    item.innerHTML = `
                        <img src="${dorama.image}" alt="${dorama.name}">
                        <div class="item-info">
                            <h4>${dorama.name}</h4>
                            <p>${dorama.year} • ${dorama.genre}</p>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        showDoramaDetails(dorama);
                    });
                    favoritesList.appendChild(item);
                }
            });
        }
    });

    // Загружаем просмотренное
    const watchedList = document.getElementById('watched-list');
    const watchedItems = [];
    
    let processedCount = 0;
    const totalToProcess = doramas.reduce((sum, dorama) => sum + dorama.episodes.length, 0);
    
    if (totalToProcess === 0) {
        watchedList.innerHTML = '<p class="empty-message">Пока нет просмотренных серий</p>';
    } else {
        doramas.forEach(dorama => {
            dorama.episodes.forEach(episode => {
                const watchedKey = `watched_${dorama.id}_${episode.season}_${episode.number}`;
                Telegram.WebApp.CloudStorage.getItem(watchedKey, (err, value) => {
                    processedCount++;
                    
                    if (value && JSON.parse(value)) {
                        watchedItems.push({
                            dorama: dorama.name,
                            season: episode.season,
                            episode: episode.number,
                            doramaObj: dorama
                        });
                    }
                    
                    // Когда обработали все элементы
                    if (processedCount === totalToProcess) {
                        if (watchedItems.length === 0) {
                            watchedList.innerHTML = '<p class="empty-message">Пока нет просмотренных серий</p>';
                        } else {
                            watchedList.innerHTML = '';
                            watchedItems
                                .sort((a, b) => a.dorama.localeCompare(b.dorama) || a.season - b.season || a.episode - b.episode)
                                .forEach(item => {
                                    const div = document.createElement('div');
                                    div.classList.add('profile-item');
                                    div.innerHTML = `
                                        <img src="${item.doramaObj.image}" alt="${item.dorama}">
                                        <div class="item-info">
                                            <h4>${item.dorama}</h4>
                                            <p>Сезон ${item.season}, Серия ${item.episode}</p>
                                        </div>
                                    `;
                                    div.addEventListener('click', () => {
                                        showDoramaDetails(item.doramaObj);
                                    });
                                    watchedList.appendChild(div);
                                });
                        }
                    }
                });
            });
        });
    }

    profile.classList.remove('hidden');

    document.getElementById('back-profile-btn').addEventListener('click', () => {
        profile.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
    });
}

// Поиск
function performSearch() {
    const query = prompt('Введите название дорамы для поиска:');
    if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        filteredDoramas = doramas.filter(dorama => 
            dorama.name.toLowerCase().includes(searchTerm) ||
            dorama.description.toLowerCase().includes(searchTerm) ||
            dorama.genre.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderDoramas();
        hideDropdowns();
        
        if (filteredDoramas.length === 0) {
            Telegram.WebApp.showAlert('По вашему запросу ничего не найдено');
        }
    }
}

// Скрытие выпадающих меню
function hideDropdowns() {
    document.getElementById('genres-list').classList.add('hidden');
    document.getElementById('years-list').classList.add('hidden');
}

// Фильтрация по году
function filterByYear(year) {
    filteredDoramas = doramas.filter(d => d.year === year);
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
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
            filterByYear(year);
        });
    });

    // Поиск
    document.getElementById('search-btn').addEventListener('click', performSearch);

    // Профиль
    document.getElementById('profile-btn').addEventListener('click', showProfile);

    // Закрытие меню при клике вне их
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu') && !e.target.closest('.dropdown')) {
            hideDropdowns();
        }
    });
});

// Периодическое обновление данных (каждые 30 секунд)
setInterval(loadData, 30000);

// Остановка отслеживания при закрытии страницы
window.addEventListener('beforeunload', () => {
    stopProgressTracking();
});

// Остановка отслеживания при скрытии страницы
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        stopProgressTracking();
    } else if (document.visibilityState === 'visible' && currentEpisode && currentDorama) {
        startProgressTracking(currentDorama, currentEpisode);
    }
});

// Инициализация
loadData();
Telegram.WebApp.expand();