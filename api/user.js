import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Получаем или создаём пользователя
    let user = await kv.get(`user:${id}`);
    
    if (!user) {
      user = {
        id,
        username: `@user_${Math.random().toString(36).slice(2, 8)}`,
        balance: 100,
        highscore: 0,
        transfers: []
      };
      await kv.set(`user:${id}`, JSON.stringify(user));
    } else {
      user = JSON.parse(user);
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}