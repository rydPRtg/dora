if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    Telegram.WebApp.requestFullscreen();
    Telegram.WebApp.setHeaderColor('bg_color');
    Telegram.WebApp.setBottomBarColor('bottom_bar_bg_color');
}

let currentSection = null;
let currentIndex = 0;
const carousel = document.getElementById('carousel');
const cards = document.querySelectorAll('.card');
const cardWidth = window.innerWidth * 0.8 + 20;

function showSection(section) {
    if (currentSection === section) return;
    currentSection = section;

    document.getElementById('documents-section').style.display = 'none';

    if (section === 'documents') {
        document.getElementById('documents-section').style.display = 'block';
        initSwipe();
    } else {
        Telegram.WebApp.showAlert(`Секція "${section}" відкрита. Функціонал буде додано пізніше.`);
    }
}

function flipCard(card) {
    card.classList.toggle('flipped');
    Telegram.WebApp.HapticFeedback.impactOccurred('medium');
}

function initSwipe() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        carousel.style.transform = `translateX(${ -currentIndex * cardWidth + currentX }px)`;
    });

    carousel.addEventListener('touchend', () => {
        isDragging = false;
        if (Math.abs(currentX) > 50) {
            if (currentX < 0 && currentIndex < cards.length - 1) {
                currentIndex++;
                Telegram.WebApp.HapticFeedback.impactOccurred('light');
            } else if (currentX > 0 && currentIndex > 0) {
                currentIndex--;
                Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        }
        carousel.style.transition = 'transform 0.3s ease';
        carousel.style.transform = `translateX(${ -currentIndex * cardWidth }px)`;
        setTimeout(() => {
            carousel.style.transition = '';
        }, 300);
        currentX = 0;
    });
}

carousel.style.transform = `translateX(0px)`;

// Handle fullscreen changes and errors
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.onEvent('fullscreenChanged', () => {
        console.log('Fullscreen mode:', Telegram.WebApp.isFullscreen);
    });

    Telegram.WebApp.onEvent('fullscreenFailed', (error) => {
        Telegram.WebApp.showAlert(`Не вдалося активувати повноекранний режим: ${error.error}`);
    });

    // Ensure full-screen mode on load
    window.addEventListener('load', () => {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        Telegram.WebApp.requestFullscreen();
    });
}
