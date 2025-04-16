const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Временная "база данных"
let users = {
    'user_1': { balance: 1000, highscore: 0, transfers: [] },
    'user_2': { balance: 500, highscore: 0, transfers: [] },
    'user_3': { balance: 200, highscore: 0, transfers: [] }
};

// Имитация базы пользователей
const userDatabase = {
    '@user1': 'user_1',
    '@user2': 'user_2',
    '@user3': 'user_3'
};

// API endpoints
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    if (!users[userId]) {
        // Создаем пользователя с дефолтным балансом
        users[userId] = { balance: 100, highscore: 0, transfers: [] };
    }
    res.json(users[userId]);
});

app.put('/user/:id', (req, res) => {
    const userId = req.params.id;
    if (!users[userId]) {
        users[userId] = { balance: 100, highscore: 0, transfers: [] };
    }
    // Обновляем только нужные поля, чтобы не перезаписать целиком
    const { balance, highscore, transfers } = req.body;
    users[userId].balance = balance ?? users[userId].balance;
    users[userId].highscore = highscore ?? users[userId].highscore;
    users[userId].transfers = transfers ?? users[userId].transfers;

    res.json({ success: true });
});

app.post('/transfer', (req, res) => {
    const { senderId, recipientUsername, amount } = req.body;

    // Проверка получателя
    if (!userDatabase[recipientUsername]) {
        return res.json({ success: false, message: 'Пользователь не найден' });
    }

    const recipientId = userDatabase[recipientUsername];

    // Проверка отправителя и баланса
    if (!users[senderId]) {
        return res.json({ success: false, message: 'Отправитель не найден' });
    }
    if (users[senderId].balance < amount) {
        return res.json({ success: false, message: 'Недостаточно средств' });
    }

    // Обновляем балансы
    users[senderId].balance -= amount;
    users[recipientId] = users[recipientId] || { balance: 100, highscore: 0, transfers: [] };
    users[recipientId].balance += amount;

    // Добавляем в историю отправителя
    const transferData = {
        type: 'outgoing',
        username: recipientUsername,
        amount: amount,
        date: new Date().toISOString()
    };

    users[senderId].transfers = users[senderId].transfers || [];
    users[senderId].transfers.unshift(transferData);

    // Добавляем в историю получателя
    const incomingTransfer = {
        type: 'incoming',
        username: '@' + senderId,
        amount: amount,
        date: new Date().toISOString()
    };

    users[recipientId].transfers = users[recipientId].transfers || [];
    users[recipientId].transfers.unshift(incomingTransfer);

    res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
