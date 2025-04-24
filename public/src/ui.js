window.uiModule = {
    showTransferPage() {
        const pagesContainer = document.getElementById('pages-container');
        pagesContainer.innerHTML = `
            <div class="page">
                <!-- ... шаблон страницы перевода ... -->
            </div>
        `;
        
        document.getElementById('do-transfer').addEventListener('click', this.handleTransfer);
    },
    
    showSimplePage(title) {
        const pagesContainer = document.getElementById('pages-container');
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
        
        document.querySelector('.back-button').addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    },
    
    handleTransfer: async function() {
        const username = document.getElementById('transfer-username').value;
        const amount = parseInt(document.getElementById('transfer-amount').value);
        
        if (!username || !amount) return;
        
        const result = await window.transfersModule.makeTransfer(username, amount);
        alert(result.message);
        window.uiModule.updateDisplays();
    },
    
    updateDisplays() {
        document.getElementById('coins').textContent = window.userModule.getCoins();
        document.getElementById('highscore').textContent = window.userModule.getHighscore();
    }
};