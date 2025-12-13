// script.js
let words = [];
let shuffledWords = [];
let currentIndex = 0;
let currentMode = 0; // 1: DE->RU input, 2: RU->DE input, 3: DE->RU choice, 4: RU->DE choice

const modeSelection = document.getElementById('modeSelection');
const gameContainer = document.getElementById('gameContainer');
const questionWord = document.getElementById('questionWord');
const inputMode = document.getElementById('inputMode');
const choiceMode = document.getElementById('choiceMode');
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const progress = document.getElementById('progress');

async function loadWords() {
    try {
        const response = await fetch('words.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Предполагаем, что первая колонка - немецкий, вторая - русский, пропускаем заголовок если есть
        words = json.slice(1).map(row => ({ de: row[0], ru: row[1] })).filter(row => row.de && row.ru);

        if (words.length === 0) {
            alert('Нет валидных слов в файле words.xlsx.');
        }
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        alert('Ошибка загрузки файла words.xlsx.');
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startMode(mode) {
    currentMode = mode;
    shuffledWords = shuffle([...words]);
    currentIndex = 0;
    modeSelection.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= shuffledWords.length) {
        feedback.textContent = 'Игра завершена!';
        feedback.classList.remove('hidden', 'correct', 'incorrect');
        nextBtn.classList.add('hidden');
        restartBtn.classList.remove('hidden');
        return;
    }

    const word = shuffledWords[currentIndex];
    feedback.classList.add('hidden');
    nextBtn.classList.add('hidden');
    userInput.value = '';

    if (currentMode === 1 || currentMode === 3) {
        questionWord.textContent = word.de;
    } else {
        questionWord.textContent = word.ru;
    }

    if (currentMode === 1 || currentMode === 2) {
        inputMode.classList.remove('hidden');
        choiceMode.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        inputMode.classList.add('hidden');
        choiceMode.classList.remove('hidden');
        setupChoices(word);
    }

    updateProgress();
}

function setupChoices(word) {
    const choices = [word];
    while (choices.length < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        if (!choices.includes(randomWord)) {
            choices.push(randomWord);
        }
    }
    shuffle(choices);

    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`choice${i}`);
        btn.textContent = (currentMode === 3) ? choices[i-1].ru : choices[i-1].de;
        btn.onclick = () => checkChoice(btn.textContent, word);
    }
}

function checkInput() {
    const word = shuffledWords[currentIndex];
    const correct = (currentMode === 1) ? word.ru : word.de;
    const userAnswer = userInput.value.trim().toLowerCase();
    const correctLower = correct.toLowerCase();

    if (userAnswer === correctLower) {
        feedback.textContent = 'Правильно!';
        feedback.className = 'correct';
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    } else {
        feedback.textContent = `Неправильно! Вы ввели: "${userInput.value}". Правильный ответ: "${correct}".`;
        feedback.className = 'incorrect';
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
    feedback.classList.remove('hidden');
}

function checkChoice(selected, word) {
    const correct = (currentMode === 3) ? word.ru : word.de;
    if (selected.toLowerCase() === correct.toLowerCase()) {
        feedback.textContent = 'Правильно!';
        feedback.className = 'correct';
    } else {
        feedback.textContent = `Неправильно! Вы выбрали: "${selected}". Правильный ответ: "${correct}".`;
        feedback.className = 'incorrect';
    }
    feedback.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    // Disable choices
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`choice${i}`).onclick = null;
    }
}

function updateProgress() {
    progress.textContent = `Карточка ${currentIndex + 1} из ${shuffledWords.length}`;
}

submitBtn.addEventListener('click', checkInput);
nextBtn.addEventListener('click', () => {
    currentIndex++;
    showQuestion();
});
restartBtn.addEventListener('click', () => {
    gameContainer.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    restartBtn.classList.add('hidden');
});

// Загрузка слов при старте
loadWords();
