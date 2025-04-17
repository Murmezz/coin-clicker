import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { senderId, recipientUsername, amount } = req.body;

  try {
    // Проверка получателя
    if (!recipientUsername.startsWith('@')) {
      return res.status(400).json({ error: 'Username must start with @' });
    }

    // Получаем данные отправителя
    const sender = JSON.parse(await kv.get(`user:${senderId}`));
    if (!sender || sender.balance < amount) {
      return res.status(400).json({ error: 'Not enough coins' });
    }

    // Ищем получателя
    const allUsers = await kv.keys('user:*');
    let recipient = null;

    for (const key of allUsers) {
      const user = JSON.parse(await kv.get(key));
      if (user.username === recipientUsername) {
        recipient = user;
        break;
      }
    }

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Обновляем балансы
    sender.balance -= amount;
    recipient.balance += amount;

    // Сохраняем
    await kv.set(`user:${senderId}`, JSON.stringify(sender));
    await kv.set(`user:${recipient.id}`, JSON.stringify(recipient));

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}