window.uiModule = {
    showTransferPage() {
        const pagesContainer = document.getElementById('pages-container');
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
        
        // Кнопка "назад"
        pagesContainer.querySelector('.back-button').addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
        
        // Кнопка перевода
        document.getElementById('do-transfer').addEventListener('click', async () => {
            const username = document.getElementById('transfer-username').value;
            const amount = parseInt(document.getElementById('transfer-amount').value);
            
            if (!username || !amount) {
                document.getElementById('transfer-result').innerHTML = 'Заполните все поля';
                return;
            }
            
            try {
                await window.transfersModule.makeTransfer(username, amount);
                document.getElementById('transfer-result').innerHTML = 'Перевод успешен!';
            } catch (error) {
                document.getElementById('transfer-result').innerHTML = 'Ошибка: ' + error.message;
            }
        });
        
        pagesContainer.style.display = 'block';
    }
};