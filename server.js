const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Временная "база данных"
let users = {
    'user_default': { balance: 1000, highscore: 0, transfers: [] }
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
    const user = users[userId] || { balance: 100, highscore: 0, transfers: [] };
    res.json(user);
});

app.put('/user/:id', (req, res) => {
    const userId = req.params.id;
    users[userId] = req.body;
    res.json({ success: true });
});

app.post('/transfer', (req, res) => {
    const { senderId, recipientUsername, amount } = req.body;
    
    // Проверка получателя
    if (!userDatabase[recipientUsername]) {
        return res.json({ success: false, message: 'Пользователь не найден' });
    }
    
    const recipientId = userDatabase[recipientUsername];
    
    // Проверка отправителя
    if (!users[senderId] || users[senderId].balance < amount) {
        return res.json({ success: false, message: 'Недостаточно средств' });
    }
    
    // Обновляем балансы
    users[senderId].balance -= amount;
    users[recipientId] = users[recipientId] || { balance: 0, highscore: 0, transfers: [] };
    users[recipientId].balance += amount;
    
    // Добавляем в историю
    const transferData = {
        type: 'outgoing',
        username: recipientUsername,
        amount: amount,
        date: new Date().toISOString()
    };
    
    users[senderId].transfers = users[senderId].transfers || [];
    users[senderId].transfers.unshift(transferData);
    
    // Для получателя
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