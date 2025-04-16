document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const coinContainer = document.getElementById('coin');
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    const pagesContainer = document.getElementById('pages-container');
    const transferPage = document.getElementById('transfer-page');
    const defaultPage = document.getElementById('default-page');
    
    // Элементы формы перевода
    const usernameInput = document.getElementById('username');
    const amountInput = document.getElementById('amount');
    const sendButton = document.getElementById('send-coins');
    const transferMessage = document.getElementById('transfer-message');

    // Загрузка данных
    let coins = parseInt(localStorage.getItem('coins')) || 0;
    let highscore = parseInt(localStorage.getItem('highscore')) || 0;
    updateDisplays();

    function updateDisplays() {
        coinsDisplay.textContent = coins;
        highscoreDisplay.textContent = highscore;
    }

    // Клик по монете
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
    });

    coinContainer.addEventListener('mouseup', function(e) {
        const coinButton = this.querySelector('.coin-button');
        coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
        
        coins++;
        if (coins > highscore) {
            highscore = coins;
            localStorage.setItem('highscore', highscore);
        }
        localStorage.setItem('coins', coins);
        updateDisplays();
        
        createFloatingNumber(e.clientX, e.clientY);
    });

    // Анимация +1
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
            const pageName = this.getAttribute('data-page');
            
            if (pageName === 'transfer') {
                showTransferPage();
            } else {
                showDefaultPage(this.textContent);
            }
        });
    });

    function showTransferPage() {
        pagesContainer.innerHTML = '';
        pagesContainer.appendChild(transferPage.cloneNode(true));
        pagesContainer.style.display = 'block';
        
        // Инициализация формы перевода
        initTransferForm();
        
        // Назначение обработчика для кнопки "назад"
        document.querySelector('.back-button').addEventListener('click', hidePages);
    }

    function showDefaultPage(title) {
        const newPage = defaultPage.cloneNode(true);
        newPage.querySelector('.page-title').textContent = title;
        
        pagesContainer.innerHTML = '';
        pagesContainer.appendChild(newPage);
        pagesContainer.style.display = 'block';
        
        newPage.querySelector('.back-button').addEventListener('click', hidePages);
    }

    function hidePages() {
        pagesContainer.style.display = 'none';
    }

    // Инициализация формы перевода
    function initTransferForm() {
        const username = document.getElementById('username');
        const amount = document.getElementById('amount');
        const sendBtn = document.getElementById('send-coins');
        const message = document.getElementById('transfer-message');
        
        sendBtn.addEventListener('click', function() {
            const recipient = username.value.trim();
            const transferAmount = parseInt(amount.value);
            
            // Валидация
            if (!recipient || !recipient.startsWith('@')) {
                showMessage('Введите корректный @username', 'error');
                return;
            }
            
            if (isNaN(transferAmount) || transferAmount <= 0) {
                showMessage('Введите корректную сумму', 'error');
                return;
            }
            
            if (transferAmount > coins) {
                showMessage('Недостаточно коинов', 'error');
                return;
            }
            
            // Здесь должна быть логика отправки на сервер
            // Временно эмулируем успешный перевод
            simulateTransfer(recipient, transferAmount);
        });
        
        function showMessage(text, type) {
            message.textContent = text;
            message.className = 'transfer-message ' + type + '-message';
        }
        
        function simulateTransfer(recipient, amount) {
            // Эмуляция задержки сети
            showMessage('Отправка...', 'success');
            
            setTimeout(() => {
                coins -= amount;
                localStorage.setItem('coins', coins);
                updateDisplays();
                
                showMessage(`Успешно отправлено ${amount} коинов пользователю ${recipient}`, 'success');
                
                // Очистка полей
                username.value = '';
                amount.value = '';
            }, 1500);
        }
    }

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
        const touch = e.changedTouches[0];
        const mouseUp = new MouseEvent('mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.dispatchEvent(mouseUp);
        
        createFloatingNumber(touch.clientX, touch.clientY);
    });

    // Блокировка нежелательных действий
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
});