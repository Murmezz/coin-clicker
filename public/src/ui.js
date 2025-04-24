window.uiModule = {
    showTransferPage: function() {
        console.log("Opening transfer page...");
        const pagesContainer = document.getElementById('pages-container');
        
        // Создаем страницу перевода динамически
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
        
        pagesContainer.style.display = 'block';
        
        // Вешаем обработчик на кнопку
        document.getElementById('do-transfer').addEventListener('click', this.handleTransfer);
        
        // Кнопка назад
        document.querySelector('.back-button').addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    },
    
    handleTransfer: async function() {
        console.log("Transfer button clicked!");
        const username = document.getElementById('transfer-username').value.trim();
        const amount = parseInt(document.getElementById('transfer-amount').value);
        
        if (!username || !amount) {
            document.getElementById('transfer-result').innerHTML = 
                '<p class="error-message">Заполните все поля</p>';
            return;
        }
        
        const result = await window.transfersModule.makeTransfer(username, amount);
        
        const resultDiv = document.getElementById('transfer-result');
        if (result.success) {
            resultDiv.innerHTML = `<p class="success-message">${result.message}</p>`;
            window.userModule.updateUserState({
                coins: window.userModule.getCoins() - amount
            });
            window.uiModule.updateDisplays();
        } else {
            resultDiv.innerHTML = `<p class="error-message">${result.message}</p>`;
        }
    },
    
    updateDisplays: function() {
        document.getElementById('coins').textContent = window.userModule.getCoins();
        document.getElementById('highscore').textContent = window.userModule.getHighscore();
    }
};