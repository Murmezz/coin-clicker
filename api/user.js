import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      let user = await kv.get(`user:${id}`);
      
      if (!user) {
        // Создаем нового пользователя
        user = {
          id,
          username: `@user_${Math.random().toString(36).substr(2, 5)}`,
          balance: 100,
          highscore: 0,
          isActive: true,
          transfers: []
        };
        await kv.set(`user:${id}`, JSON.stringify(user));
      } else {
        user = JSON.parse(user);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  } else if (req.method === 'PUT') {
    try {
      const userData = req.body;
      await kv.set(`user:${id}`, JSON.stringify(userData));
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка обновления' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}