// Защитная обёртка для Telegram WebApp данных
(function() {
    if (!window.Telegram?.WebApp) return;

    // Сохраняем оригинальный initData
    const originalInitData = Telegram.WebApp.initData;
    
    // Очищаем битые данные
    if (typeof originalInitData === 'string') {
        try {
            // Удаляем все некорректные префиксы
            const cleanData = originalInitData
                .replace(/^[^a-zA-Z0-9\{]+/, '')
                .replace(/[^a-zA-Z0-9\}]$/, '');
            
            // Пробуем распарсить только если выглядит как JSON
            if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
                Telegram.WebApp.initDataUnsafe = JSON.parse(cleanData);
            } else {
                // Парсим как URL параметры
                const params = new URLSearchParams(cleanData);
                Telegram.WebApp.initDataUnsafe = {};
                params.forEach((value, key) => {
                    Telegram.WebApp.initDataUnsafe[key] = value;
                });
            }
        } catch (e) {
            console.warn('Data cleaning failed, using empty object');
            Telegram.WebApp.initDataUnsafe = {};
        }
    }
    
    // Гарантируем наличие user объекта
    if (!Telegram.WebApp.initDataUnsafe.user) {
        Telegram.WebApp.initDataUnsafe.user = {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Telegram User',
            username: 'user_' + Math.random().toString(36).substr(2, 5)
        };
    }
})();
