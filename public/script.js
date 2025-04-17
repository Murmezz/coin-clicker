document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const API_URL = 'prj_dD9HlQIC7Hm4gQzMWodx995fK71G'; // Используем относительный путь для Vercel
    const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9); // Генерация ID пользователя

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
    let currentUsername = '';

    // Инициализация
    loadUserData();
    initEventListeners();

    // Загрузка данных пользователя
    async function loadUserData() {
        try {
            const response = await fetch(`${API_URL}/user?userId=${USER_ID}`);
            if (!response.ok) throw new Error('Ошибка сети');
            
            const data = await response.json();
            coins = data.balance || 100;
            highscore = data.highscore || 0;
            transferHistory = data.transfers || [];
            currentUsername = data.username || '';

            updateDisplays();
            renderTransferHistory();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            coins = 100;
            updateDisplays();
        }
    }

    // Обновление интерфейса
    function updateDisplays() {
        coinsDisplay.textContent = coins;
        highscoreDisplay.textContent = highscore;
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

    // Логика монеты (без изменений)
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

    // Сохранение данных
    async function saveUserData() {
        try {
            await fetch(`${API_URL}/user?userId=${USER_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    balance: coins,
                    highscore: highscore,
                    transfers: transferHistory,
                    username: currentUsername
                })
            });
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }

    // Логика перевода (обновленная)
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

            if (isNaN(amount) || amount < 1) {
                showMessage('Введите сумму больше 0', 'error', messageDiv);
                return;
            }

            if (amount > coins) {
                showMessage('Недостаточно коинов', 'error', messageDiv);
                return;
            }

            try {
                showMessage('Отправка...', 'info', messageDiv);
                sendButton.disabled = true;

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

                const result = await response.json();

                if (response.ok && !result.error) {
                    coins -= amount;
                    updateDisplays();
                    showMessage(`Успешно отправлено ${amount} коинов`, 'success', messageDiv);
                    
                    transferHistory.unshift({
                        type: 'outgoing',
                        username: recipient,
                        amount: amount,
                        date: new Date().toISOString()
                    });

                    renderTransferHistory();
                    saveUserData();
                    
                    usernameInput.value = '';
                    amountInput.value = '';
                } else {
                    showMessage(result.error || 'Ошибка перевода', 'error', messageDiv);
                }
            } catch (error) {
                showMessage('Ошибка сети', 'error', messageDiv);
                console.error('Transfer error:', error);
            } finally {
                sendButton.disabled = false;
            }
        });
    }

    // Остальной код (showTransferPage, showDefaultPage и т.д.) остается без изменений
    // ... (вставь сюда остальные функции из предыдущей версии script.js)
});