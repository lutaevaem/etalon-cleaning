import { useEffect, useMemo, useState } from 'react';
import { defaultContent } from './defaultContent.js';
import './admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setByPath(object, path, value) {
  const copy = clone(object);
  const keys = path.split('.');
  let current = copy;

  keys.slice(0, -1).forEach((key) => {
    current = current[key];
  });

  current[keys[keys.length - 1]] = value;
  return copy;
}

function TextInput({ label, value, onChange, multiline = false, placeholder = '' }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ''} placeholder={placeholder} rows="4" onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ArrayEditor({ title, items, onChange, renderItem, emptyItem }) {
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>{title}</h2>
        <button type="button" onClick={() => onChange([...(items || []), clone(emptyItem)])}>Добавить</button>
      </div>

      <div className="admin-list">
        {(items || []).map((item, index) => (
          <div className="admin-list-item" key={index}>
            <div className="admin-list-item-head">
              <strong>Элемент {index + 1}</strong>
              <button type="button" className="danger" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Удалить</button>
            </div>
            {renderItem(item, index, (nextItem) => {
              const nextItems = [...items];
              nextItems[index] = nextItem;
              onChange(nextItems);
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [content, setContent] = useState(clone(defaultContent));
  const [status, setStatus] = useState('');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');

  const updatedAt = useMemo(() => content?.updatedAt ? new Date(content.updatedAt).toLocaleString('ru-RU') : 'ещё не сохранялось', [content]);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        if (data.content) {
          setContent({ ...clone(defaultContent), ...data.content });
          setStatus('Контент загружен с сервера.');
        } else {
          setStatus('На сервере пока нет сохранённого контента. Открыт базовый вариант.');
        }
      } catch (error) {
        setStatus('Не удалось загрузить контент с backend. Проверьте Render и VITE_API_URL.');
      }
    }

    loadContent();
  }, []);

  useEffect(() => {
    setJsonDraft(JSON.stringify(content, null, 2));
  }, [content]);

  function update(path, value) {
    setContent((current) => setByPath(current, path, value));
  }

  async function saveContent() {
    try {
      localStorage.setItem('adminToken', token);
      setStatus('Сохраняем...');

      const response = await fetch(`${API_URL}/api/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Ошибка сохранения');
      }

      setContent({ ...clone(defaultContent), ...data.content });
      setStatus('Готово. Изменения сохранены. Обновите сайт через Ctrl+F5.');
    } catch (error) {
      setStatus(`Ошибка: ${error.message}`);
    }
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonDraft);
      setContent(parsed);
      setStatus('JSON применён. Не забудьте сохранить изменения.');
      setJsonMode(false);
    } catch (error) {
      setStatus(`Ошибка JSON: ${error.message}`);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Админка сайта</p>
          <h1>Редактор контента «Эталон»</h1>
          <p>Здесь можно менять тексты, подписи, блоки, отзывы, FAQ и ссылки на изображения без правки кода.</p>
          <small>Последнее сохранение: {updatedAt}</small>
        </div>
        <a className="admin-link" href="/" target="_blank" rel="noreferrer">Открыть сайт</a>
      </header>

      <section className="admin-toolbar">
        <TextInput label="Admin token" value={token} onChange={setToken} placeholder="Вставьте ADMIN_TOKEN из Render" />
        <button type="button" onClick={saveContent}>Сохранить изменения</button>
        <button type="button" className="secondary" onClick={() => setContent(clone(defaultContent))}>Сбросить к базовому варианту</button>
        <button type="button" className="secondary" onClick={() => setJsonMode(!jsonMode)}>JSON-режим</button>
      </section>

      {status && <div className="admin-status">{status}</div>}

      {jsonMode ? (
        <section className="admin-card">
          <h2>JSON-редактор</h2>
          <p>Для быстрых массовых правок. После применения нажмите «Сохранить изменения».</p>
          <textarea className="json-editor" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} />
          <button type="button" onClick={applyJson}>Применить JSON</button>
        </section>
      ) : (
        <>
          <section className="admin-card">
            <h2>Бренд и первый экран</h2>
            <div className="admin-grid">
              <TextInput label="Название бренда" value={content.brand} onChange={(value) => update('brand', value)} />
              <TextInput label="Кнопка в шапке" value={content.headerCta} onChange={(value) => update('headerCta', value)} />
              <TextInput label="Надзаголовок" value={content.hero.eyebrow} onChange={(value) => update('hero.eyebrow', value)} />
              <TextInput label="Главный заголовок" value={content.hero.title} onChange={(value) => update('hero.title', value)} multiline />
              <TextInput label="Описание" value={content.hero.lead} onChange={(value) => update('hero.lead', value)} multiline />
              <TextInput label="Главная CTA" value={content.hero.primaryCta} onChange={(value) => update('hero.primaryCta', value)} />
              <TextInput label="Вторая CTA" value={content.hero.secondaryCta} onChange={(value) => update('hero.secondaryCta', value)} />
              <TextInput label="Картинка первого экрана: URL" value={content.hero.visual.main.imageUrl} onChange={(value) => update('hero.visual.main.imageUrl', value)} placeholder="https://..." />
            </div>
          </section>

          <section className="admin-card">
            <h2>Позиционирование</h2>
            <div className="admin-grid">
              <TextInput label="Надзаголовок" value={content.intro.eyebrow} onChange={(value) => update('intro.eyebrow', value)} />
              <TextInput label="Заголовок" value={content.intro.title} onChange={(value) => update('intro.title', value)} multiline />
              <TextInput label="Текст" value={content.intro.text} onChange={(value) => update('intro.text', value)} multiline />
            </div>
          </section>

          <ArrayEditor
            title="Аудитория"
            items={content.audience.items}
            onChange={(items) => update('audience.items', items)}
            emptyItem={{ title: 'Новый сегмент', text: 'Описание сегмента' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Заголовок" value={item.title} onChange={(value) => setItem({ ...item, title: value })} />
                <TextInput label="Текст" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline />
              </div>
            )}
          />

          <ArrayEditor
            title="Услуги"
            items={content.services.items}
            onChange={(items) => update('services.items', items)}
            emptyItem={{ title: 'Новая услуга', text: 'Описание услуги' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Название услуги" value={item.title} onChange={(value) => setItem({ ...item, title: value })} />
                <TextInput label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline />
              </div>
            )}
          />

          <ArrayEditor
            title="Форматы ухода"
            items={content.formats.items}
            onChange={(items) => update('formats.items', items)}
            emptyItem={{ number: '04', title: 'Новый формат', text: 'Описание формата', bestFor: 'Для кого подходит' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Номер" value={item.number} onChange={(value) => setItem({ ...item, number: value })} />
                <TextInput label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} />
                <TextInput label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline />
                <TextInput label="Кому подходит" value={item.bestFor} onChange={(value) => setItem({ ...item, bestFor: value })} multiline />
              </div>
            )}
          />

          <ArrayEditor
            title="Блок доверия"
            items={content.trust.items}
            onChange={(items) => update('trust.items', items)}
            emptyItem={{ title: 'Новый пункт', text: 'Описание' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Заголовок" value={item.title} onChange={(value) => setItem({ ...item, title: value })} />
                <TextInput label="Текст" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline />
              </div>
            )}
          />

          <ArrayEditor
            title="Отзывы"
            items={content.reviews.items}
            onChange={(items) => update('reviews.items', items)}
            emptyItem={{ text: 'Текст отзыва', author: 'Имя клиента' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Отзыв" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline />
                <TextInput label="Автор" value={item.author} onChange={(value) => setItem({ ...item, author: value })} />
              </div>
            )}
          />

          <ArrayEditor
            title="FAQ"
            items={content.faq.items}
            onChange={(items) => update('faq.items', items)}
            emptyItem={{ question: 'Новый вопрос', answer: 'Ответ' }}
            renderItem={(item, index, setItem) => (
              <div className="admin-grid">
                <TextInput label="Вопрос" value={item.question} onChange={(value) => setItem({ ...item, question: value })} />
                <TextInput label="Ответ" value={item.answer} onChange={(value) => setItem({ ...item, answer: value })} multiline />
              </div>
            )}
          />

          <section className="admin-card">
            <h2>Футер и контакты</h2>
            <div className="admin-grid">
              <TextInput label="Текст футера" value={content.footer.text} onChange={(value) => update('footer.text', value)} />
              <TextInput label="Телефон, подпись" value={content.footer.phoneLabel} onChange={(value) => update('footer.phoneLabel', value)} />
              <TextInput label="Телефон, ссылка" value={content.footer.phoneHref} onChange={(value) => update('footer.phoneHref', value)} />
              <TextInput label="WhatsApp URL" value={content.footer.whatsappUrl} onChange={(value) => update('footer.whatsappUrl', value)} />
              <TextInput label="Telegram URL" value={content.footer.telegramUrl} onChange={(value) => update('footer.telegramUrl', value)} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
