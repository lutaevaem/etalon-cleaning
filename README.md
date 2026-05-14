# Эталон — сайт премиального клининга

Готовая структура проекта для загрузки в новый репозиторий GitHub.

## Структура

```text
etalon-cleaning-fullstack/
├── frontend/          # Frontend: React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   └── package.json
├── backend/           # Backend: Node.js + Express
│   ├── src/
│   │   ├── server.js
│   │   ├── storage.js
│   │   └── telegram.js
│   ├── data/
│   │   └── .gitkeep
│   ├── .env.example
│   └── package.json
├── package.json       # Общие команды для запуска фронта и бэка
├── .gitignore
└── README.md
```

## Что уже готово

- Главная страница сайта для премиального сервиса ухода за домом.
- Название бренда: **Эталон**.
- Исправлен крупный заголовок: буквы не накладываются друг на друга.
- Адаптивная верстка под desktop и mobile.
- Квиз/форма заявки.
- Backend API для приема заявок.
- Локальное сохранение заявок в `backend/data/leads.json`.
- Опциональная отправка заявок в Telegram.

## Как загрузить в GitHub

1. Создайте новый пустой репозиторий в GitHub.
2. Распакуйте архив.
3. Загрузите содержимое папки `etalon-cleaning-fullstack` в репозиторий.
4. Или через терминал:

```bash
cd etalon-cleaning-fullstack
git init
git add .
git commit -m "Initial commit: Etalon cleaning fullstack site"
git branch -M main
git remote add origin https://github.com/YOUR_LOGIN/YOUR_REPOSITORY.git
git push -u origin main
```

## Как запустить локально

Нужен Node.js версии 18+.

```bash
npm run install:all
npm run dev
```

После запуска:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health-check backend: http://localhost:4000/api/health

## Как работает форма

Frontend отправляет данные формы на:

```text
POST http://localhost:4000/api/leads
```

Backend сохраняет заявку в:

```text
backend/data/leads.json
```

## Telegram-уведомления

Создайте файл `backend/.env` по примеру `backend/.env.example`:

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Если Telegram не настроен, заявки всё равно сохраняются локально.

## Что заменить перед реальным запуском

1. Телефон в футере.
2. Ссылки WhatsApp и Telegram.
3. Фото-заглушки на реальные фото:
   - интерьер;
   - сотрудники;
   - процесс работы;
   - детали чистоты;
   - до/после.
4. Подключить CRM, почту или Telegram.
5. Добавить политику конфиденциальности и согласие на обработку персональных данных.
