// Инициализация Telegram Web App
Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
document.getElementById('username').textContent = user ? `@${user.username}` : 'Гость';

// Примерный список дорам (база данных в JS для простоты изменения, добавьте/измените объекты здесь)
const doramas = [
    { id: 1, name: 'Дорама 1', year: 2024, genre: 'Комедия', episodes: 16, image: 'https://via.placeholder.com/100x150?text=Dorama1', description: 'Описание дорамы 1. Жанр: Комедия, Год: 2024.', player: '<div class="player">Плеер (placeholder)</div>' },
    { id: 2, name: 'Дорама 2', year: 2023, genre: 'Драма', episodes: 20, image: 'https://via.placeholder.com/100x150?text=Dorama2', description: 'Описание дорамы 2. Жанр: Драма, Год: 2023.', player: '<div class="player">Плеер (placeholder)</div>' },
    // Добавьте еще до 20-30 для теста пагинации, формат: { id: N, name: '...', year: N, genre: '...', episodes: N, image: 'url', description: '...', player: 'html' }
    // Для реальных изображений используйте URL или загрузите на GitHub
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
                <p>Год: ${dorama.year}, Жанр: ${dorama.genre}, Серии: ${dorama.episodes}</p>
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
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    const details = document.getElementById('dorama-details');
    details.innerHTML = `
        <img src="${dorama.image}" alt="${dorama.name}">
        <h2>${dorama.name}</h2>
        <p>${dorama.description}</p>
        ${dorama.player}
        <button id="back-btn">Назад</button>
    `;
    details.classList.remove('hidden');
    document.getElementById('back-btn').addEventListener('click', () => {
        details.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('pagination').classList.remove('hidden');
    });
}

// Избранное с использованием Telegram Cloud Storage (хранится в облаке Telegram per user)
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

// Показ профиля с избранным
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
    profile.classList.remove('hidden');
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
    // Placeholder для ТОП: сортировка по году descending
    filteredDoramas = [...doramas].sort((a, b) => b.year - a.year);
    currentPage = 1;
    renderDoramas();
    hideDropdowns();
});

// Фильтры жанров (добавьте логику фильтра на кнопках dropdown)
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

// Поиск и Профиль (placeholder, добавьте логику позже)
document.getElementById('search-btn').addEventListener('click', () => {
    alert('Логика поиска будет добавлена позже');
});

document.getElementById('profile-btn').addEventListener('click', () => {
    showProfile();
    // Чтобы вернуться, добавьте кнопку назад в profile-content
    // Для простоты: клик на профиль снова прячет
    // Или добавьте <button id="back-profile">Назад</button> в HTML и слушатель
});

// Инициализация
renderDoramas();
Telegram.WebApp.expand(); // Развернуть на весь экран
