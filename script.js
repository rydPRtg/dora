const seasons = [
    // Сезон 1
    [
        { name: 'Серия 1', fileId: '1ZPhUEB7srhJDi-9XdCjOD0ZMGRNsCm0L' },  // Ваша первая серия
        { name: 'Серия 2', fileId: 'YOUR_FILE_ID_1_2_HERE' },
        { name: 'Серия 3', fileId: 'YOUR_FILE_ID_1_3_HERE' }
    ],
    // Сезон 2
    [
        { name: 'Серия 1', fileId: 'YOUR_FILE_ID_2_1_HERE' },
        { name: 'Серия 2', fileId: 'YOUR_FILE_ID_2_2_HERE' },
        { name: 'Серия 3', fileId: 'YOUR_FILE_ID_2_3_HERE' }
    ],
    // Сезон 3
    [
        { name: 'Серия 1', fileId: 'YOUR_FILE_ID_3_1_HERE' },
        { name: 'Серия 2', fileId: 'YOUR_FILE_ID_3_2_HERE' },
        { name: 'Серия 3', fileId: 'YOUR_FILE_ID_3_3_HERE' }
    ],
    // Сезон 4
    [
        { name: 'Серия 1', fileId: 'YOUR_FILE_ID_4_1_HERE' },
        { name: 'Серия 2', fileId: 'YOUR_FILE_ID_4_2_HERE' },
        { name: 'Серия 3', fileId: 'YOUR_FILE_ID_4_3_HERE' }
    ]
];

const API_URL = 'https://your-server-url.com';  // Замените на URL вашего сервера (где bot.py запущен, например, https://your-app.herokuapp.com)

let currentEpisode = null;
let video = document.getElementById('player');

Telegram.WebApp.ready();

const seasonSelect = document.getElementById('season-select');
const episodeList = document.getElementById('episode-list');
const playerContainer = document.getElementById('player-container');
const backBtn = document.getElementById('back-btn');

seasonSelect.addEventListener('change', (e) => {
    const seasonIndex = e.target.value;
    if (seasonIndex === '') return;
    
    episodeList.innerHTML = '';
    seasons[seasonIndex].forEach((ep, index) => {
        const li = document.createElement('li');
        li.textContent = ep.name;
        li.addEventListener('click', () => loadEpisode(seasonIndex, index));
        episodeList.appendChild(li);
    });
});

backBtn.addEventListener('click', () => {
    saveProgress();
    playerContainer.style.display = 'none';
    seasonSelect.style.display = 'block';
    episodeList.style.display = 'block';
});

function loadEpisode(season, episodeIndex) {
    const ep = seasons[season][episodeIndex];
    currentEpisode = `season${season}-episode${episodeIndex}`;
    
    const src = `https://drive.google.com/uc?export=download&id=${ep.fileId}`;
    video.src = src;
    video.type = 'video/mp4';
    
    // Получаем прогресс
    fetch(`${API_URL}/get_progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            init_data: Telegram.WebApp.initData,
            episode: currentEpisode
        })
    })
    .then(res => res.json())
    .then(data => {
        video.currentTime = data.time || 0;
        video.play();
    });
    
    seasonSelect.style.display = 'none';
    episodeList.style.display = 'none';
    playerContainer.style.display = 'block';
}

function saveProgress() {
    if (!currentEpisode || video.paused) return;
    
    fetch(`${API_URL}/save_progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            init_data: Telegram.WebApp.initData,
            episode: currentEpisode,
            time: video.currentTime
        })
    });
}

// Сохраняем при паузе и перед закрытием
video.addEventListener('pause', saveProgress);
window.addEventListener('beforeunload', saveProgress);
