export async function notifyTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const text = [
    'Новая заявка с сайта Эталон',
    '',
    `Объект: ${lead.object || 'не указано'}`,
    `Площадь: ${lead.area || 'не указано'}`,
    `Частота: ${lead.frequency || 'не указано'}`,
    `Важно: ${lead.details || 'не указано'}`,
    `Контакт: ${lead.contact}`,
    `Источник: ${lead.source}`,
    `Дата: ${lead.createdAt}`
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    console.warn('Telegram notification failed');
  }
}
