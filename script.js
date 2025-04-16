document.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://ybzftiygkaxtveanbacy.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemZ0aXlna2F4dHZlYW5iYWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDA2NjMsImV4cCI6MjA2MDM3NjY2M30.c4pfo2rAPj6NyTgnQJU8qX4Yyh_MUNVF3AXUmR7ksvc';
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const coinContainer = document.getElementById('coin');
  const coinsDisplay = document.getElementById('coins');
  const highscoreDisplay = document.getElementById('highscore');
  const pagesContainer = document.getElementById('pages-container');
  const transferPageTemplate = document.getElementById('transfer-page');
  const defaultPageTemplate = document.getElementById('default-page');

  let coins = 0;
  let highscore = 0;
  let transferHistory = [];
  let username = null;

  console.log('Telegram user:', window.Telegram?.WebApp?.initDataUnsafe?.user);

  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser || !tgUser.username) {
      alert('Ошибка: не удалось получить username Telegram');
      return;
    }
    username = '@' + tgUser.username;
    console.log('Username:', username);
  } catch (e) {
    alert('Ошибка инициализации Telegram WebApp: ' + e.message);
    return;
  }

  async function getOrCreateUser(username) {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Пользователь не найден — создаём
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ username, balance: 100, highscore: 0 }])
          .select()
          .single();

        if (insertError) {
          console.error('Ошибка создания пользователя:', insertError);
          throw insertError;
        }
        return newUser;
      }
      console.error('Ошибка получения пользователя:', error);
      throw error;
    }
    return data;
  }

  async function loadUserData() {
    try {
      const user = await getOrCreateUser(username);
      coins = user.balance;
      highscore = user.highscore || 0;

      const { data: transfers, error } = await supabase
        .from('transfers')
        .select('*')
        .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Ошибка загрузки истории:', error);
        transferHistory = [];
      } else {
        transferHistory = transfers.map(t => ({
          type: t.sender_username === username ? 'outgoing' : 'incoming',
          username: t.sender_username === username ? t.recipient_username : t.sender_username,
          amount: t.amount,
          date: t.created_at
        }));
      }

      updateDisplays();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных: ' + error.message);
    }
  }

  function updateDisplays() {
    coinsDisplay.textContent = coins;
    highscoreDisplay.textContent = highscore;
  }

  function handleCoinPress(e) {
    e.preventDefault();
    // ... (анимация, как было)
  }

  async function handleCoinRelease(e) {
    const coinButton = coinContainer.querySelector('.coin-button');
    coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';

    try {
      coins++;
      if (coins > highscore) highscore = coins;
      updateDisplays();
      createFloatingNumber(e.clientX, e.clientY);

      const { error } = await supabase
        .from('users')
        .update({ balance: coins, highscore })
        .eq('username', username);

      if (error) {
        console.error('Ошибка обновления баланса:', error);
        alert('Ошибка обновления баланса');
      }
    } catch (error) {
      console.error(error);
    }
  }

  function createFloatingNumber(startX, startY) {
    // ... (анимация +1, как было)
  }

  // Навешиваем обработчики
  coinContainer.addEventListener('mousedown', handleCoinPress);
  coinContainer.addEventListener('touchstart', e => handleCoinPress(e.touches[0]));

  coinContainer.addEventListener('mouseup', handleCoinRelease);
  coinContainer.addEventListener('touchend', e => handleCoinRelease(e.changedTouches[0]));

  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
      const pageName = button.getAttribute('data-page');
      if (pageName === 'transfer') showTransferPage();
      else showDefaultPage(button.textContent);
    });
  });

  function showTransferPage() {
    pagesContainer.innerHTML = '';
    const transferPage = transferPageTemplate.cloneNode(true);
    transferPage.style.display = 'block';
    pagesContainer.appendChild(transferPage);
    pagesContainer.style.display = 'block';

    initTransferForm(transferPage);
    transferPage.querySelector('.back-button').addEventListener('click', hidePages);
  }

  function showDefaultPage(title) {
    pagesContainer.innerHTML = '';
    const defaultPage = defaultPageTemplate.cloneNode(true);
    defaultPage.querySelector('.page-title').textContent = title;
    defaultPage.style.display = 'block';
    pagesContainer.appendChild(defaultPage);
    pagesContainer.style.display = 'block';

    defaultPage.querySelector('.back-button').addEventListener('click', hidePages);
  }

  function hidePages() {
    pagesContainer.style.display = 'none';
  }

  function initTransferForm(pageElement) {
    const usernameInput = pageElement.querySelector('#username');
    const amountInput = pageElement.querySelector('#amount');
    const sendButton = pageElement.querySelector('#send-coins');
    const messageDiv = pageElement.querySelector('#transfer-message');
    const historyList = pageElement.querySelector('#history-list');

    function renderHistory() {
      historyList.innerHTML = '';

      if (transferHistory.length === 0) {
        historyList.innerHTML = '<p>Нет истории переводов</p>';
        return;
      }

      transferHistory.forEach(transfer => {
        const item = document.createElement('div');
        item.className = `history-item ${transfer.type}`;

        const amountPrefix = transfer.type === 'outgoing' ? '-' : '+';
        const amountClass = transfer.type === 'outgoing' ? 'history-amount outgoing' : 'history-amount incoming';

        item.innerHTML = `
          <div>
            <span class="history-username">${transfer.username}</span>
            <span class="history-date">${formatDate(transfer.date)}</span>
          </div>
          <span class="${amountClass}">${amountPrefix}${transfer.amount}</span>
        `;

        historyList.appendChild(item);
      });
    }

    renderHistory();

    sendButton.addEventListener('click', async () => {
      const recipient = usernameInput.value.trim();
      const amount = parseInt(amountInput.value);

      if (!recipient || !recipient.startsWith('@')) {
        showMessage('Введите корректный @username', 'error', messageDiv);
        return;
      }

      if (isNaN(amount)) {
        showMessage('Введите корректную сумму', 'error', messageDiv);
        return;
      }

      if (amount < 1) {
        showMessage('Минимальная сумма - 1 коин', 'error', messageDiv);
        return;
      }

      if (amount > coins) {
        showMessage('Недостаточно коинов', 'error', messageDiv);
        return;
      }

      try {
        showMessage('Отправка...', 'info', messageDiv);
        sendButton.disabled = true;

        const { data: recipientUser, error: recError } = await supabase
          .from('users')
          .select('*')
          .eq('username', recipient)
          .single();

        if (recError || !recipientUser) {
          showMessage('Пользователь не найден', 'error', messageDiv);
          sendButton.disabled = false;
          return;
        }

        const { data: senderUser, error: senderError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();

        if (senderError || !senderUser || senderUser.balance < amount) {
          showMessage('Недостаточно средств', 'error', messageDiv);
          sendButton.disabled = false;
          return;
        }

        const { error: updateSenderError } = await supabase
          .from('users')
          .update({ balance: senderUser.balance - amount })
          .eq('username', username);

        if (updateSenderError) throw updateSenderError;

        const { error: updateRecipientError } = await supabase
          .from('users')
          .update({ balance: recipientUser.balance + amount })
          .eq('username', recipient);

        if (updateRecipientError) throw updateRecipientError;

        const { error: insertTransferError } = await supabase
          .from('transfers')
          .insert([
            { sender_username: username, recipient_username: recipient, amount, created_at: new Date().toISOString() }
          ]);

        if (insertTransferError) throw insertTransferError;

        coins = senderUser.balance - amount;
        transferHistory.unshift({
          type: 'outgoing',
          username: recipient,
          amount,
          date: new Date().toISOString()
        });

        updateDisplays();
        renderHistory();
        showMessage(`Успешно отправлено ${amount} коинов пользователю ${recipient}`, 'success', messageDiv);

        usernameInput.value = '';
        amountInput.value = '';
      } catch (error) {
        console.error(error);
        showMessage('Ошибка перевода: ' + error.message, 'error', messageDiv);
      } finally {
        sendButton.disabled = false;
      }
    });

    function showMessage(text, type, element) {
      element.textContent = text;
      element.className = `transfer-message ${type}-message`;
    }

    function renderHistory() {
      historyList.innerHTML = '';

      if (transferHistory.length === 0) {
        historyList.innerHTML = '<p>Нет истории переводов</p>';
        return;
      }

      transferHistory.forEach(transfer => {
        const item = document.createElement('div');
        item.className = `history-item ${transfer.type}`;

        const amountPrefix = transfer.type === 'outgoing' ? '-' : '+';
        const amountClass = transfer.type === 'outgoing' ? 'history-amount outgoing' : 'history-amount incoming';

        item.innerHTML = `
          <div>
            <span class="history-username">${transfer.username}</span>
            <span class="history-date">${formatDate(transfer.date)}</span>
          </div>
          <span class="${amountClass}">${amountPrefix}${transfer.amount}</span>
        `;

        historyList.appendChild(item);
      });
    }
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  await loadUserData();
});
