document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const API_URL = 'http://localhost:3000'; // Ваш сервер
    const USER_ID = 'user_1'; // Для теста, должен быть в userDatabase и users

    // Элементы интерфейса
    const coinContainer = document.getElementById('coin');
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    const pagesContainer = document.getElementById('pages-container');
    const transferPageTemplate = document.getElementById('transfer-page');
    const defaultPageTemplate = document.getElementById('default-page');

    // Данные пользователя
    let coins = 0;
    let highscore = 0;
    let transferHistory = [];

    // Инициализация
    loadUserData();
    initEventListeners();

    // Загрузка данных пользователя с сервера
    async function loadUserData() {
        try {
            const response = await fetch(`${API_URL}/user/${USER_ID}`);
            const data = await response.json();

            // Если пользователя нет на сервере, создаём с дефолтными значениями
            if (!data || typeof data.balance !== 'number') {
                coins = 100;
                highscore = 0;
                transferHistory = [];
                await saveUserData(); // Сохраняем на сервер
            } else {
                coins = data.balance;
                highscore = data.highscore || 0;
                transferHistory = data.transfers || [];
            }

            updateDisplays();
            renderTransferHistory();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            coins = 100;
            highscore = 0;
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

    // Логика монеты
    function handleCoinPress(e) {
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (clientX === undefined || clientY === undefined) return;

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
        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

        if (clientX === undefined || clientY === undefined) return;

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
        const transferPage = transferPageTemplate.cloneNode(true);
        transferPage.style.display = 'block';
        pagesContainer.appendChild(transferPage);
        pagesContainer.style.display = 'block';

        initTransferForm(transferPage);
        transferPage.querySelector('.back-button').addEventListener('click', hidePages);
    }

    function showDefaultPage(title) {
        pagesContainer.innerHTML = '';
        const defaultPage = defaultPageTemplate.cloneNode(true);
        defaultPage.querySelector('.page-title').textContent = title;
        defaultPage.style.display = 'block';
        pagesContainer.appendChild(defaultPage);
        pagesContainer.style.display = 'block';

        defaultPage.querySelector('.back-button').addEventListener('click', hidePages);
    }

    function hidePages() {
        pagesContainer.style.display = 'none';
    }

    // Логика перевода
    function initTransferForm(pageElement) {
        const usernameInput = pageElement.querySelector('#username');
        const amountInput = pageElement.querySelector('#amount');
        const sendButton = pageElement.querySelector('#send-coins');
        const messageDiv = pageElement.querySelector('#transfer-message');
        const historyList = pageElement.querySelector('#history-list');

        // Отрисовка истории переводов
        function renderHistory() {
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

        renderHistory();

        sendButton.addEventListener('click', async function() {
            const recipient = usernameInput.value.trim();
            const amount = parseInt(amountInput.value);

            // Валидация
            if (!recipient || !recipient.startsWith('@')) {
                showMessage('Введите корректный @username', 'error', messageDiv);
                return;
            }

            if (isNaN(amount)) {
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
                    // После успешного перевода — обновляем данные с сервера
                    await loadUserData();

                    showMessage(`Успешно отправлено ${amount} коинов пользователю ${recipient}`, 'success', messageDiv);

                    // Обновляем локальную историю (loadUserData уже обновит её, но для мгновенного отображения)
                    transferHistory.unshift({
                        type: 'outgoing',
                        username: recipient,
                        amount: amount,
                        date: new Date().toISOString()
                    });

                    renderHistory();

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
        // Этот вызов теперь не нужен, т.к. история рендерится внутри формы перевода
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }
});
