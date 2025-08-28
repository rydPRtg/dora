const BASE_URL = 'https://your-server-domain.com';  // Замените на URL вашего сервера с API

let dramas = [];
let favorites = [];
let currentPage = 1;
const perPage = 10;
let userId = null;
let username = null;

window.Telegram.WebApp.ready();
const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
userId = initDataUnsafe.user ? initDataUnsafe.user.id : null;
username = initDataUnsafe.user ? initDataUnsafe.user.username : 'Гость';

document.getElementById('username').textContent = username;

// Загрузка данных
async function loadData() {
    const response = await fetch(`${BASE_URL}/api/dramas`);
    dramas = await response.json();
    loadFavorites();
    renderDramas();
}

async function loadFavorites() {
    if (userId) {
        const response = await fetch(`${BASE_URL}/api/favorites/${userId}`);
        favorites = await response.json();
    }
}

function renderDramas(filteredDramas = dramas) {
    const list = document.getElementById('dramas-list');
    list.innerHTML = '';
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageDramas = filteredDramas.slice(start, end);

    pageDramas.forEach(drama => {
        const item = document.createElement('div');
        item.className = 'drama-item';
        item.innerHTML = `
            <img src="${drama.image}" alt="${drama.name}">
            <h3>${drama.name}</h3>
            <p>Год: ${drama.year}</p>
            <p>Жанр: ${drama.genre}</p>
            <p>Серии: ${drama.episodes}</p>
            <button onclick="toggleFavorite(${drama.id})">${favorites.includes(drama.id) ? 'Удалить из избранного' : 'Добавить в избранное'}</button>
        `;
        item.addEventListener('click', () => showDramaDetail(drama));
        list.appendChild(item);
    });

    renderPagination(filteredDramas.length);
}

function renderPagination(total) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const pages = Math.ceil(total / perPage);
    for (let i = 1; i <= pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            renderDramas();
        };
        pagination.appendChild(btn);
    }
}

async function toggleFavorite(dramaId) {
    if (!userId) return;
    if (favorites.includes(dramaId)) {
        await fetch(`${BASE_URL}/api/remove_favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, drama_id: dramaId })
        });
        favorites = favorites.filter(id => id !== dramaId);
    } else {
        await fetch(`${BASE_URL}/api/add_favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, drama_id: dramaId })
        });
        favorites.push(dramaId);
    }
    renderDramas();
    if (document.getElementById('profile').style.display !== 'none') {
        renderProfile();
    }
}

function showDramaDetail(drama) {
    document.getElementById('dramas-list').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';
    const detail = document.getElementById('drama-detail');
    detail.style.display = 'block';
    document.getElementById('detail-image').src = drama.image;
    document.getElementById('detail-name').textContent = drama.name;
    document.getElementById('detail-description').innerHTML = `
        ${drama.description}<br>
        Год: ${drama.year}<br>
        Жанр: ${drama.genre}<br>
        Серии: ${drama.episodes}
    `;
    const player = document.getElementById('player');
    if (drama.video_url.includes('kodik.online')) {
        player.innerHTML = `
            <iframe src="${drama.video_url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>
        `;
    } else {
        player.innerHTML = `
            <video controls width="100%">
                <source src="${drama.video_url}" type="video/mp4">
                Ваш браузер не поддерживает видео.
            </video>
        `;
    }
}

document.getElementById('home-btn').addEventListener('click', () => {
    document.getElementById('drama-detail').style.display = 'none';
    document.getElementById('profile').style.display = 'none';
    document.getElementById('dramas-list').style.display = 'flex';
    document.getElementById('pagination').style.display = 'block';
    currentPage = 1;
    renderDramas();
});

document.querySelectorAll('#genres-list div').forEach(genre => {
    genre.addEventListener('click', () => {
        const filtered = dramas.filter(d => d.genre.includes(genre.textContent));
        currentPage = 1;
        renderDramas(filtered);
    });
});

document.querySelectorAll('#years-list div').forEach(year => {
    year.addEventListener('click', () => {
        const filtered = dramas.filter(d => d.year === parseInt(year.textContent));
        currentPage = 1;
        renderDramas(filtered);
    });
});

document.getElementById('top-btn').addEventListener('click', () => {
    const sorted = [...dramas].sort((a, b) => b.year - a.year);
    currentPage = 1;
    renderDramas(sorted);
});

document.getElementById('profile-btn').addEventListener('click', () => {
    document.getElementById('dramas-list').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';
    document.getElementById('drama-detail').style.display = 'none';
    document.getElementById('profile').style.display = 'block';
    renderProfile();
});

function renderProfile() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';
    favorites.forEach(id => {
        const drama = dramas.find(d => d.id === id);
        if (drama) {
            const item = document.createElement('div');
            item.className = 'drama-item';
            item.innerHTML = `
                <img src="${drama.image}" alt="${drama.name}">
                <h3>${drama.name}</h3>
                <button onclick="toggleFavorite(${drama.id})">Удалить</button>
            `;
            list.appendChild(item);
        }
    });
}

document.getElementById('search-btn').addEventListener('click', () => {
    alert('Логика поиска будет добавлена позже');
});

loadData();
