import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method } = req;
  if (method === 'GET') {
    // Пример: получить пользователя по username из query
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(data);
  } else if (method === 'POST') {
    // Пример: перевод коинов
    const { senderUsername, recipientUsername, amount } = req.body;
    if (!senderUsername || !recipientUsername || !amount) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Здесь логика перевода: проверить балансы, обновить, добавить запись в transfers
    // Для простоты — пример без транзакций (лучше добавить транзакции в реальном проекте)

    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('*')
      .eq('username', senderUsername)
      .single();

    if (senderError || sender.balance < amount) {
      return res.status(400).json({ error: 'Недостаточно средств или отправитель не найден' });
    }

    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('*')
      .eq('username', recipientUsername)
      .single();

    if (recipientError) {
      return res.status(400).json({ error: 'Получатель не найден' });
    }

    // Обновляем балансы
    await supabase
      .from('users')
      .update({ balance: sender.balance - amount })
      .eq('username', senderUsername);

    await supabase
      .from('users')
      .update({ balance: recipient.balance + amount })
      .eq('username', recipientUsername);

    // Добавляем запись в transfers
    await supabase
      .from('transfers')
      .insert([{ sender_username: senderUsername, recipient_username: recipientUsername, amount, created_at: new Date().toISOString() }]);

    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
