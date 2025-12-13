let words = [];
let shuffledWords = [];
let currentIndex = 0;
let currentMode = 0;
let correct = 0;
let totalAttempted = 0;

const loading = document.getElementById('loading');
const modeSelection = document.getElementById('modeSelection');
const gameContainer = document.getElementById('gameContainer');
const statsContainer = document.getElementById('statsContainer');
const questionWord = document.getElementById('questionWord');
const inputMode = document.getElementById('inputMode');
const choiceMode = document.getElementById('choiceMode');
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const homeBtn = document.getElementById('homeBtn');
const finishBtn = document.getElementById('finishBtn');
const toMenu = document.getElementById('toMenu');
const restartMode = document.getElementById('restartMode');
const progress = document.getElementById('progress');
const score = document.getElementById('score');
const statsText = document.getElementById('statsText');

async function loadWords() {
    loading.classList.remove('hidden');
    modeSelection.classList.add('hidden');
    
    try {
        const response = await fetch('words.xlsx');
        if (!response.ok) throw new Error('Файл не найден');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        words = json.slice(1)
            .map(row => ({ de: String(row[0] || '').trim(), ru: String(row[1] || '').trim() }))
            .filter(row => row.de && row.ru);

        if (words.length === 0) {
            alert('В файле words.xlsx нет валидных слов (нужны две колонки: немецкий и русский).');
            loading.classList.add('hidden');
            return;
        }

        // После успешной загрузки показываем меню режимов
        loading.classList.add('hidden');
        modeSelection.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        alert('Не удалось загрузить words.xlsx. Проверьте, что файл лежит в корне репозитория и называется точно "words.xlsx".');
        loading.classList.add('hidden');
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
    if (words.length === 0) return;
    
    currentMode = mode;
    shuffledWords = shuffle([...words]);
    currentIndex = 0;
    correct = 0;
    totalAttempted = 0;
    updateScore();
    
    modeSelection.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    statsContainer.classList.add('hidden');
    
    showQuestion();
}

// Остальные функции без изменений (showQuestion, setupChoices, checkInput и т.д.)
function showQuestion() {
    if (currentIndex >= shuffledWords.length) {
        showStats();
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
        if (!choices.find(c => c.de === randomWord.de && c.ru === randomWord.ru)) {
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
    const correctAnswer = (currentMode === 1) ? word.ru : word.de;
    const userAnswer = userInput.value.trim().toLowerCase();
    const correctLower = correctAnswer.toLowerCase();

    totalAttempted++;
    if (userAnswer === correctLower) {
        correct++;
        feedback.textContent = 'Правильно!';
        feedback.className = 'correct';
    } else {
        feedback.textContent = `Неправильно! Вы ввели: "${userInput.value}". Правильный: "${correctAnswer}".`;
        feedback.className = 'incorrect';
    }
    feedback.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    submitBtn.classList.add('hidden');
    updateScore();
}

function checkChoice(selected, word) {
    const correctAnswer = (currentMode === 3) ? word.ru : word.de;
    totalAttempted++;
    if (selected.toLowerCase() === correctAnswer.toLowerCase()) {
        correct++;
        feedback.textContent = 'Правильно!';
        feedback.className = 'correct';
    } else {
        feedback.textContent = `Неправильно! Выбрано: "${selected}". Правильный: "${correctAnswer}".`;
        feedback.className = 'incorrect';
    }
    feedback.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    updateScore();
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`choice${i}`).disabled = true;
        document.getElementById(`choice${i}`).style.opacity = '0.6';
    }
}

function updateProgress() {
    progress.textContent = `Карточка ${currentIndex + 1} из ${shuffledWords.length}`;
}

function updateScore() {
    score.textContent = `Правильно: ${correct}`;
}

function showStats() {
    const incorrect = totalAttempted - correct;
    statsText.innerHTML = `Правильно: ${correct}<br>Неправильно: ${incorrect}<br>Всего: ${totalAttempted}`;
    gameContainer.classList.add('hidden');
    statsContainer.classList.remove('hidden');
}

submitBtn.addEventListener('click', checkInput);
nextBtn.addEventListener('click', () => {
    currentIndex++;
    showQuestion();
});
homeBtn.addEventListener('click', () => {
    gameContainer.classList.add('hidden');
    modeSelection.classList.remove('hidden');
});
finishBtn.addEventListener('click', showStats);
toMenu.addEventListener('click', () => {
    statsContainer.classList.add('hidden');
    modeSelection.classList.remove('hidden');
});
restartMode.addEventListener('click', () => {
    statsContainer.classList.add('hidden');
    startMode(currentMode);
});

// Запуск загрузки слов при открытии страницы
loadWords();
