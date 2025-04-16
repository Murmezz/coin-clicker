document.addEventListener('DOMContentLoaded', function() {
    const coinContainer = document.getElementById('coin');
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    const pagesContainer = document.getElementById('pages-container');
    const pageTemplate = document.querySelector('.page-template');

    // Загрузка данных
    let coins = parseInt(localStorage.getItem('coins')) || 0;
    let highscore = parseInt(localStorage.getItem('highscore')) || 0;
    updateDisplays();

    function updateDisplays() {
        coinsDisplay.textContent = coins;
        highscoreDisplay.textContent = highscore;
    }

    // Обработка кликов по монете
    coinContainer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const coinButton = this.querySelector('.coin-button');
        const tiltAngle = 12;
        const relX = (rect.width/2 - clickX) / (rect.width/2);
        const relY = (rect.height/2 - clickY) / (rect.height/2);
        
        coinButton.style.transform = `
            perspective(500px) 
            rotateX(${relY * tiltAngle}deg) 
            rotateY(${-relX * tiltAngle}deg) 
            scale(0.95)
        `;
        
        // Сразу создаем летящее число
        createFloatingNumber(e.clientX, e.clientY);
    });

    coinContainer.addEventListener('mouseup', function() {
        const coinButton = this.querySelector('.coin-button');
        coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
        
        coins++;
        if (coins > highscore) {
            highscore = coins;
            localStorage.setItem('highscore', highscore);
        }
        localStorage.setItem('coins', coins);
        updateDisplays();
    });

    // Для мобильных устройств
    coinContainer.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseDown = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.dispatchEvent(mouseDown);
    });

    coinContainer.addEventListener('touchend', function(e) {
        e.preventDefault();
        const mouseUp = new MouseEvent('mouseup');
        this.dispatchEvent(mouseUp);
    });

    // Создание летящего числа
    function createFloatingNumber(startX, startY) {
        const numberElement = document.createElement('div');
        numberElement.className = 'floating-number';
        numberElement.textContent = '+1';
        
        const balanceRect = document.querySelector('.balance').getBoundingClientRect();
        const targetX = balanceRect.left + balanceRect.width/2 - startX;
        const targetY = balanceRect.top - startY;
        
        numberElement.style.left = `${startX}px`;
        numberElement.style.top = `${startY}px`;
        numberElement.style.setProperty('--target-x', `${targetX}px`);
        numberElement.style.setProperty('--target-y', `${targetY}px`);
        
        document.body.appendChild(numberElement);
        
        setTimeout(() => {
            numberElement.remove();
        }, 700);
    }

    // Навигация по страницам
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function() {
            const title = this.textContent;
            const newPage = pageTemplate.cloneNode(true);
            newPage.querySelector('.page-title').textContent = title;
            
            pagesContainer.innerHTML = '';
            pagesContainer.appendChild(newPage);
            pagesContainer.style.display = 'block';
            
            newPage.querySelector('.back-button').addEventListener('click', function() {
                pagesContainer.style.display = 'none';
            });
        });
    });

    // Блокировка нежелательных действий
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
});