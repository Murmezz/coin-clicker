document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const coinContainer = document.getElementById('coin');
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    const pagesContainer = document.getElementById('pages-container');
    const pageTemplate = document.querySelector('.page-template');

    // Загрузка данных
    let coins = parseInt(localStorage.getItem('coins')) || 0;
    let highscore = parseInt(localStorage.getItem('highscore')) || 0;
    updateDisplays();

    // Обновление отображения
    function updateDisplays() {
        coinsDisplay.textContent = coins;
        highscoreDisplay.textContent = highscore;
    }

    // Клик по монете
    coinContainer.addEventListener('mousedown', handleCoinPress);
    coinContainer.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleCoinPress(e.touches[0]);
    });

    function handleCoinPress(e) {
        const rect = coinContainer.getBoundingClientRect();
        const radius = rect.width / 2;
        const centerX = rect.left + radius;
        const centerY = rect.top + radius;

        const relX = (centerX - e.clientX) / radius;
        const relY = (centerY - e.clientY) / radius;

        const coinButton = coinContainer.querySelector('.coin-button');
        const tiltAngle = 12;
        coinButton.style.transform = `
            perspective(500px) 
            rotateX(${relY * tiltAngle}deg) 
            rotateY(${-relX * tiltAngle}deg) 
            scale(0.95)
        `;
    }

    coinContainer.addEventListener('mouseup', handleCoinRelease);
    coinContainer.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleCoinRelease(e.changedTouches[0]);
    });

    function handleCoinRelease(e) {
        const coinButton = coinContainer.querySelector('.coin-button');
        coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';

        coins++;
        localStorage.setItem('coins', coins);
        
        if (coins > highscore) {
            highscore = coins;
            localStorage.setItem('highscore', highscore);
        }
        
        updateDisplays();
        createFloatingNumber(e.clientX, e.clientY);
    }

    // Анимация +1
    function createFloatingNumber(startX, startY) {
        const numberElement = document.createElement('div');
        numberElement.className = 'floating-number';
        numberElement.textContent = '+1';
        
        let floatingContainer = document.querySelector('.floating-numbers-container');
        if (!floatingContainer) {
            floatingContainer = document.createElement('div');
            floatingContainer.className = 'floating-numbers-container';
            document.body.appendChild(floatingContainer);
        }
        
        const balanceRect = document.querySelector('.balance').getBoundingClientRect();
        const targetX = balanceRect.left + balanceRect.width/2 - startX;
        const targetY = balanceRect.top - startY;
        
        numberElement.style.left = `${startX}px`;
        numberElement.style.top = `${startY}px`;
        numberElement.style.setProperty('--target-x', `${targetX}px`);
        numberElement.style.setProperty('--target-y', `${targetY}px`);
        
        floatingContainer.appendChild(numberElement);
        
        setTimeout(() => {
            numberElement.remove();
            if (floatingContainer.children.length === 0) {
                floatingContainer.remove();
            }
        }, 700);
    }

    // Навигация
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function() {
            showPage(this.textContent, this.getAttribute('data-page'));
        });
    });

    function showPage(title, pageName) {
        const newPage = pageTemplate.cloneNode(true);
        newPage.querySelector('.page-title').textContent = title;
        
        pagesContainer.innerHTML = '';
        pagesContainer.appendChild(newPage);
        pagesContainer.style.display = 'block';
        
        newPage.querySelector('.back-button').addEventListener('click', hidePages);
    }

    function hidePages() {
        pagesContainer.style.display = 'none';
    }

    // Блокировка нежелательных действий
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());

    // Проверка ориентации
    function checkOrientation() {
        if (window.innerWidth > window.innerHeight) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
    
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
});