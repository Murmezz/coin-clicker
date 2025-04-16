document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const API_URL = 'http://localhost:3000'; // Замените на ваш сервер
    const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9); // В реальном приложении получать из авторизации
    
    // Элементы интерфейса
    const coinContainer = document.getElementById('coin');
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    const pagesContainer = document.getElementById('pages-container');
    const transferPage = document.getElementById('transfer-page');
    const defaultPage = document.getElementById('default-page');
    const historyList = document.getElementById('history-list');
    
    // Данные пользователя
    let coins = 0;
    let highscore = 0;
    let transferHistory = [];

    // Инициализация
    loadUserData();
    initEventListeners();

    // Загрузка данных пользователя
    async function loadUserData() {
        try {
            const response = await fetch(`${API_URL}/user/${USER_ID}`);
            const data = await response.json();
            
            coins = data.balance;
            highscore = data.highscore;
            transferHistory = data.transfers || [];
            
            updateDisplays();
            renderTransferHistory();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Запасной вариант из localStorage
            coins = parseInt(localStorage.getItem('coins')) || 100;
            highscore = parseInt(localStorage.getItem('highscore')) || 0;
            updateDisplays();
        }
    }

    // Обновление интерфейса
    function updateDisplays() {
        coinsDisplay.textContent = coins;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('coins', coins);
        localStorage.setItem('highscore', highscore);
    }

    // Обработчики событий
    function initEventListeners() {
        // Клик по монете
        coinContainer.addEventListener('mousedown', handleCoinPress);
        coinContainer.addEventListener('touchstart', handleTouchStart);
        
        coinContainer.addEventListener('mouseup', handleCoinRelease);
        coinContainer.addEventListener('touchend', handleTouchEnd);
        
        // Навигация
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', function() {
                const pageName = this.getAttribute('data-page');
                if (pageName === 'transfer') showTransferPage();
                else showDefaultPage(this.textContent);
            });
        });
    }

    // Логика монеты
    function handleCoinPress(e) {
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        const rect = coinContainer.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const clickY = clientY - rect.top;
        
        const coinButton = coinContainer.querySelector('.coin-button');
        const tiltAngle = 12;
        const relX = (rect.width/2 - clickX) / (rect.width/2);
        const relY = (rect.height/2 - clickY) / (rect.height/2);
        
        coinButton.style.transform = `
            perspective(500px) 
            rotateX(${relY * tiltAngle}deg) 
            rotateY(${-relX * tiltAngle}deg) 
            scale(0.95)
        `;
    }

    function handleCoinRelease(e) {
        const clientX = e.clientX || e.changedTouches[0].clientX;
        const clientY = e.clientY || e.changedTouches[0].clientY;
        
        const coinButton = coinContainer.querySelector('.coin-button');
        coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
        
        coins++;
        if (coins > highscore) {
            highscore = coins;
        }
        
        updateDisplays();
        createFloatingNumber(clientX, clientY);
        saveUserData();
    }

    function handleTouchStart(e) {
        e.preventDefault();
        handleCoinPress(e.touches[0]);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        handleCoinRelease(e.changedTouches[0]);
    }

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
    function showTransferPage() {
        pagesContainer.innerHTML = '';
        pagesContainer.appendChild(transferPage.cloneNode(true));
        pagesContainer.style.display = 'block';
        
        initTransferForm();
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

    // Логика перевода
    function initTransferForm() {
        const usernameInput = document.getElementById('username');
        const amountInput = document.getElementById('amount');
        const sendButton = document.getElementById('send-coins');
        const messageDiv = document.getElementById('transfer-message');
        
        sendButton.addEventListener('click', async function() {
            const recipient = usernameInput.value.trim();
            const amount = parseInt(amountInput.value);
            
            // Валидация
            if (!recipient || !recipient.startsWith('@')) {
                showMessage('Введите корректный @username', 'error', messageDiv);
                return;
            }
            
            if (isNaN(amount) {
                showMessage('Введите корректную сумму', 'error', messageDiv);
                return;
            }
            
            if (amount < 1) {
                showMessage('Минимальная сумма - 1 коин', 'error', messageDiv);
                return;
            }
            
            if (amount > coins) {
                showMessage('Недостаточно коинов', 'error', messageDiv);
                return;
            }
            
            try {
                showMessage('Отправка...', 'info', messageDiv);
                sendButton.disabled = true;
                
                const response = await transferCoins(recipient, amount);
                
                if (response.success) {
                    coins -= amount;
                    updateDisplays();
                    showMessage(`Успешно отправлено ${amount} коинов пользователю ${recipient}`, 'success', messageDiv);
                    
                    // Обновляем историю
                    transferHistory.unshift({
                        type: 'outgoing',
                        username: recipient,
                        amount: amount,
                        date: new Date().toISOString()
                    });
                    
                    renderTransferHistory();
                    saveUserData();
                    
                    // Очищаем поля
                    usernameInput.value = '';
                    amountInput.value = '';
                } else {
                    showMessage(response.message || 'Ошибка перевода', 'error', messageDiv);
                }
            } catch (error) {
                showMessage('Ошибка сети. Попробуйте позже.', 'error', messageDiv);
                console.error('Transfer error:', error);
            } finally {
                sendButton.disabled = false;
            }
        });
    }

    // API функции
    async function transferCoins(recipient, amount) {
        const response = await fetch(`${API_URL}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderId: USER_ID,
                recipientUsername: recipient,
                amount: amount
            })
        });
        
        return await response.json();
    }

    async function saveUserData() {
        try {
            await fetch(`${API_URL}/user/${USER_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    balance: coins,
                    highscore: highscore,
                    transfers: transferHistory
                })
            });
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    // Вспомогательные функции
    function showMessage(text, type, element) {
        element.textContent = text;
        element.className = `transfer-message ${type}-message`;
    }

    function renderTransferHistory() {
        historyList.innerHTML = '';
        
        if (transferHistory.length === 0) {
            historyList.innerHTML = '<p>Нет истории переводов</p>';
            return;
        }
        
        transferHistory.slice(0, 10).forEach(transfer => {
            const item = document.createElement('div');
            item.className = `history-item ${transfer.type}`;
            
            const amountPrefix = transfer.type === 'outgoing' ? '-' : '+';
            const amountClass = transfer.type === 'outgoing' ? 'history-amount outgoing' : 'history-amount incoming';
            
            item.innerHTML = `
                <div>
                    <span class="history-username">${transfer.username}</span>
                    <span class="history-date">${formatDate(transfer.date)}</span>
                </div>
                <span class="${amountClass}">${amountPrefix}${transfer.amount}</span>
            `;
            
            historyList.appendChild(item);
        });
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }
});