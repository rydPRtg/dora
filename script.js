// script.js
let words = [];
let currentIndex = 0;
let isFlipped = false;

const fileInput = document.getElementById('fileInput');
const cardContainer = document.getElementById('cardContainer');
const germanWord = document.getElementById('germanWord');
const russianTranslation = document.getElementById('russianTranslation');
const card = document.getElementById('card');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const progress = document.getElementById('progress');

fileInput.addEventListener('change', handleFile);

function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Assume first column German, second Russian, skip header if present
        words = json.slice(1).map(row => ({ german: row[0], russian: row[1] })).filter(row => row.german && row.russian);

        if (words.length > 0) {
            cardContainer.classList.remove('hidden');
            showCard();
        } else {
            alert('No valid words found in the Excel file.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function showCard() {
    const word = words[currentIndex];
    germanWord.textContent = word.german;
    russianTranslation.textContent = word.russian;
    card.classList.remove('flipped');
    isFlipped = false;
    updateProgress();
}

function updateProgress() {
    progress.textContent = `Card ${currentIndex + 1} of ${words.length}`;
}

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        showCard();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        showCard();
    }
});

flipBtn.addEventListener('click', flipCard);
card.addEventListener('click', flipCard);

function flipCard() {
    card.classList.toggle('flipped');
    isFlipped = !isFlipped;
}
