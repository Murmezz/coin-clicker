import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const { senderId, recipientUsername, amount } = req.body;

  try {
    // Проверяем получателя
    if (!recipientUsername.startsWith('@')) {
      return res.status(400).json({ error: 'Имя должно начинаться с @' });
    }

    // Получаем данные отправителя
    const senderData = await kv.get(`user:${senderId}`);
    if (!senderData) {
      return res.status(404).json({ error: 'Отправитель не найден' });
    }
    const sender = JSON.parse(senderData);

    // Проверяем баланс
    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Недостаточно коинов' });
    }

    // Ищем получателя
    let recipient = null;
    const keys = await kv.keys('user:*');
    
    for (const key of keys) {
      const user = JSON.parse(await kv.get(key));
      if (user.username === recipientUsername) {
        recipient = user;
        break;
      }
    }

    if (!recipient) {
      return res.status(404).json({ error: 'Получатель не найден' });
    }

    // Обновляем балансы
    sender.balance -= amount;
    recipient.balance += amount;

    // Добавляем в историю переводов
    const transferRecord = {
      type: 'outgoing',
      username: recipientUsername,
      amount,
      date: new Date().toISOString()
    };
    sender.transfers.unshift(transferRecord);

    const recipientTransferRecord = {
      type: 'incoming',
      username: sender.username,
      amount,
      date: new Date().toISOString()
    };
    recipient.transfers.unshift(recipientTransferRecord);

    // Сохраняем изменения
    await kv.set(`user:${senderId}`, JSON.stringify(sender));
    await kv.set(`user:${recipient.id}`, JSON.stringify(recipient));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка перевода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}