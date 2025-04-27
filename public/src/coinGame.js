// coinGame.js
import { getElement } from './ui.js';

export function initCoinGame() {
    console.log('Функция initCoinGame вызвана'); // Отладочное сообщение
    
    const pagesContainer = getElement('pages-container');
    if (!pagesContainer) {
        console.error('Не найден pages-container');
        return;
    }

    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">Монетка</h2>
            </div>
            <div class="page-content">
                <h3>Игра "Монетка"</h3>
                <p>Это тестовая версия игры. В разработке.</p>
                <button class="transfer-button" id="test-button">Тестовая кнопка</button>
            </div>
        </div>
    `;
    pagesContainer.style.display = 'block';

    // Добавляем обработчик для кнопки "Назад"
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }

    // Тестовая кнопка
    const testButton = getElement('test-button');
    if (testButton) {
        testButton.addEventListener('click', () => {
            alert('Тестовая кнопка работает!');
        });
    }

    console.log('Игра инициализирована'); // Отладочное сообщение
}
