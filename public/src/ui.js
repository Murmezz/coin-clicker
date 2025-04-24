window.uiModule = {
    showTransferPage: function() {
        try {
            const pagesContainer = document.getElementById('pages-container');
            if (!pagesContainer) throw new Error("Контейнер страниц не найден");
            
            pagesContainer.innerHTML = `
                <div class="page">
                    <div class="page-header">
                        <button class="back-button">←</button>
                        <h2 class="page-title">Перевод</h2>
                    </div>
                    <div class="page-content">
                        <div class="transfer-form">
                            <input type="text" id="transfer-username" placeholder="@username" class="transfer-input">
                            <input type="number" id="transfer-amount" placeholder="Сумма" min="1" class="transfer-input">
                            <button id="do-transfer" class="transfer-button">Отправить</button>
                            <div id="transfer-result"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Вешаем обработчик с проверкой
            const transferBtn = document.getElementById('do-transfer');
            if (transferBtn) {
                transferBtn.addEventListener('click', this.handleTransfer.bind(this));
            } else {
                throw new Error("Кнопка перевода не найдена");
            }
            
            // Кнопка назад
            const backBtn = pagesContainer.querySelector('.back-button');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    pagesContainer.style.display = 'none';
                });
            }
            
            pagesContainer.style.display = 'block';
            
        } catch (error) {
            console.error("Ошибка при открытии страницы перевода:", error);
            alert("Ошибка при открытии страницы");
        }
    },
    
    showSimplePage: function(title) {
        try {
            const pagesContainer = document.getElementById('pages-container');
            if (!pagesContainer) throw new Error("Контейнер страниц не найден");
            
            pagesContainer.innerHTML = `
                <div class="page">
                    <div class="page-header">
                        <button class="back-button">←</button>
                        <h2 class="page-title">${title}</h2>
                    </div>
                    <div class="page-content">
                        <p>${title} - раздел в разработке</p>
                    </div>
                </div>
            `;
            
            const backBtn = pagesContainer.querySelector('.back-button');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    pagesContainer.style.display = 'none';
                });
            }
            
            pagesContainer.style.display = 'block';
            
        } catch (error) {
            console.error("Ошибка при открытии страницы:", error);
        }
    },
    
    handleTransfer: async function() {
        try {
            const usernameInput = document.getElementById('transfer-username');
            const amountInput = document.getElementById('transfer-amount');
            const resultDiv = document.getElementById('transfer-result');
            
            if (!usernameInput || !amountInput || !resultDiv) {
                throw new Error("Не найдены элементы формы");
            }
            
            const username = usernameInput.value.trim();
            const amount = parseInt(amountInput.value);
            
            if (!username || isNaN(amount)) {
                resultDiv.innerHTML = '<p class="error-message">Заполните все поля корректно</p>';
                return;
            }
            
            const result = await window.userModule.makeTransfer(username, amount);
            
            if (result.success) {
                resultDiv.innerHTML = `<p class="success-message">${result.message}</p>`;
                window.uiModule.updateDisplays();
            } else {
                resultDiv.innerHTML = `<p class="error-message">${result.message}</p>`;
            }
            
        } catch (error) {
            console.error("Ошибка при переводе:", error);
            alert("Произошла ошибка при переводе");
        }
    },
    
    updateDisplays: function() {
        try {
            const coinsDisplay = document.getElementById('coins');
            const highscoreDisplay = document.getElementById('highscore');
            
            if (coinsDisplay && highscoreDisplay) {
                coinsDisplay.textContent = window.userModule.getCoins();
                highscoreDisplay.textContent = window.userModule.getHighscore();
            }
        } catch (error) {
            console.error("Ошибка при обновлении интерфейса:", error);
        }
    }
};