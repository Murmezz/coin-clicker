window.uiModule = {
    updateDisplays: function() {
        document.getElementById('coins').textContent = window.userModule.getCoins();
        document.getElementById('highscore').textContent = window.userModule.getHighscore();
    },

    showTransferPage: function() {
        const pagesContainer = document.getElementById('pages-container');
        const transferPageTemplate = document.getElementById('transfer-page-template');
        
        if (!pagesContainer || !transferPageTemplate) return;
        
        pagesContainer.innerHTML = transferPageTemplate.innerHTML;
        pagesContainer.style.display = 'block';
        
        window.transfersModule.renderTransferHistory();
        
        document.getElementById('send-coins').addEventListener('click', async () => {
            const result = await window.transfersModule.makeTransfer(
                document.getElementById('username').value,
                parseInt(document.getElementById('amount').value)
            );
            
            alert(result.message);
            if (result.success) this.updateDisplays();
        });
    },

    showSimplePage: function(title) {
        const pagesContainer = document.getElementById('pages-container');
        pagesContainer.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <button class="back-button">←</button>
                    <h2 class="page-title">${title}</h2>
                </div>
                <div class="page-content">
                    <p>Раздел "${title}" в разработке</p>
                </div>
            </div>
        `;
        pagesContainer.style.display = 'block';
        
        document.querySelector('.back-button').addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
};
