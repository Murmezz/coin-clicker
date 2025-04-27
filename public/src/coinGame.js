export function initCoinGame() {
    console.log('Инициализация игры "Монетка"');
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) {
        console.error('Не найден контейнер страниц');
        return;
    }

    pagesContainer.innerHTML = `
        <div class="page" style="animation: fadeIn 0.3s ease-out">
            <div class="page-header">
                <button class="back-button">← Назад</button>
                <h2 class="page-title">Монетка</h2>
            </div>
            <div class="page-content">
                <div class="game-container">
                    <h3>Добро пожаловать в игру!</h3>
                    <p>Ставка принята. Готовим игру...</p>
                    <div class="coin-animation">
                        <div class="coin"></div>
                    </div>
                    <button class="play-button">Играть</button>
                </div>
            </div>
        </div>
    `;

    pagesContainer.style.display = 'block';
    
    // Обработчики элементов игры
    pagesContainer.querySelector('.back-button').addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });
    
    pagesContainer.querySelector('.play-button').addEventListener('click', () => {
        startGame();
    });

    function startGame() {
        console.log('Игра началась!');
        // Здесь будет основная логика игры
        alert('Игра успешно запущена!');
    }
}
