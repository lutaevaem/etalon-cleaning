import { useEffect, useMemo, useState } from 'react';
import { defaultContent } from './defaultContent.js';
import AdminLeads from './AdminLeads.jsx';
import './admin.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const nav = [
  ['dashboard', 'Обзор'],
  ['leads', 'Лиды'],
  ['hero', 'Первый экран'],
  ['services', 'Услуги'],
  ['formats', 'Форматы'],
  ['trust', 'Доверие'],
  ['process', 'Этапы'],
  ['media', 'Фото и визуал'],
  ['reviews', 'Отзывы'],
  ['faq', 'FAQ'],
  ['contacts', 'Контакты'],
  ['json', 'JSON']
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeContent(remoteContent) {
  if (!remoteContent) return clone(defaultContent);
  return {
    ...clone(defaultContent),
    ...remoteContent,
    hero: { ...defaultContent.hero, ...remoteContent.hero, visual: { ...defaultContent.hero.visual, ...(remoteContent.hero?.visual || {}) } },
    intro: { ...defaultContent.intro, ...remoteContent.intro },
    audience: { ...defaultContent.audience, ...remoteContent.audience },
    services: { ...defaultContent.services, ...remoteContent.services },
    formats: { ...defaultContent.formats, ...remoteContent.formats },
    trust: { ...defaultContent.trust, ...remoteContent.trust },
    process: { ...defaultContent.process, ...remoteContent.process },
    people: { ...defaultContent.people, ...remoteContent.people },
    gallery: { ...defaultContent.gallery, ...remoteContent.gallery },
    reviews: { ...defaultContent.reviews, ...remoteContent.reviews },
    faq: { ...defaultContent.faq, ...remoteContent.faq },
    final: { ...defaultContent.final, ...remoteContent.final },
    footer: { ...defaultContent.footer, ...remoteContent.footer }
  };
}

function encodeCredentials(username, password) {
  return btoa(`${username}:${password}`);
}

function Field({ label, value, onChange, multiline = false, type = 'text', placeholder = '' }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ''} rows="4" placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function Login({ onLogin, status }) {
  const [username, setUsername] = useState(localStorage.getItem('adminUsername') || '');
  const [password, setPassword] = useState('');

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="sidebar-brand login-brand"><span /> <strong>Эталон</strong></div>
        <p className="admin-eyebrow">Админка сайта</p>
        <h1>Вход в редактор</h1>
        <p>Введите логин и пароль администратора.</p>
        <form className="admin-login-form" onSubmit={(event) => { event.preventDefault(); onLogin(username.trim(), password); }}>
          <Field label="Логин" value={username} onChange={setUsername} placeholder="admin" />
          <Field label="Пароль" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          <button type="submit">Войти</button>
        </form>
        {status && <div className={`admin-status ${status.startsWith('Ошибка') ? 'error' : ''}`}>{status}</div>}
      </section>
    </main>
  );
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageEditor({ title, location, item, onChange, auth, setStatus }) {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file) {
    if (!file) return;

    try {
      setUploading(true);
      setStatus(`Загружаем фото: ${location}...`);
      const base64 = await readFileAsBase64(file);

      const response = await fetch(`${API_URL}/api/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка загрузки изображения');

      onChange({
        ...(item || {}),
        imageUrl: data.media.url,
        storagePath: data.media.path,
        publicPath: data.media.publicPath,
        originalFileName: data.media.filename
      });

      setStatus(`Фото загружено. Место: ${location}. Файл: ${data.media.path}. Не забудьте нажать «Сохранить».`);
    } catch (error) {
      setStatus(`Ошибка загрузки фото: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-field image-field-advanced">
      <div className="image-preview" style={item?.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>
        {!item?.imageUrl && <span>Фото</span>}
      </div>
      <div className="image-inputs">
        <div className="media-location"><b>{title}</b><span>Где используется: {location}</span></div>
        <Field label="Подпись/текст на карточке" value={item?.label || ''} onChange={(value) => onChange({ ...(item || {}), label: value })} />
        <Field label="URL изображения" value={item?.imageUrl || ''} onChange={(value) => onChange({ ...(item || {}), imageUrl: value })} placeholder="Можно вставить ссылку вручную" />
        <div className="upload-row">
          <label className="upload-button">
            {uploading ? 'Загружаем...' : 'Загрузить фото'}
            <input type="file" accept="image/*" disabled={uploading} onChange={(event) => uploadFile(event.target.files?.[0])} />
          </label>
          <small>до 6 МБ, jpg/png/webp. После загрузки нажмите «Сохранить».</small>
        </div>
        {(item?.storagePath || item?.publicPath) && (
          <div className="media-paths">
            {item.storagePath && <p><b>Файл в GitHub:</b> {item.storagePath}</p>}
            {item.publicPath && <p><b>Публичный путь:</b> {item.publicPath}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemsEditor({ title, items, onChange, emptyItem, render }) {
  return (
    <div className="nested-editor">
      <div className="nested-head">
        <h3>{title}</h3>
        <button type="button" onClick={() => onChange([...(items || []), clone(emptyItem)])}>+ Добавить</button>
      </div>
      <div className="admin-list">
        {(items || []).map((item, index) => (
          <div className="admin-list-item" key={index}>
            <div className="admin-list-item-head">
              <strong>{item.title || item.question || item.author || item.label || `Элемент ${index + 1}`}</strong>
              <div className="item-actions">
                <button type="button" className="ghost" disabled={index === 0} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}>↑</button>
                <button type="button" className="ghost" disabled={index === items.length - 1} onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}>↓</button>
                <button type="button" className="danger" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Удалить</button>
              </div>
            </div>
            {render(item, (nextItem) => { const next = [...items]; next[index] = nextItem; onChange(next); }, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="editor-section">
      <div className="section-title-row">
        <div>
          <p className="admin-eyebrow">Раздел сайта</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function Admin2() {
  const [active, setActive] = useState('dashboard');
  const [auth, setAuth] = useState(localStorage.getItem('adminAuth') || '');
  const [content, setContent] = useState(clone(defaultContent));
  const [status, setStatus] = useState('');
  const [jsonDraft, setJsonDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const updatedAt = useMemo(() => content?.updatedAt ? new Date(content.updatedAt).toLocaleString('ru-RU') : 'ещё не сохранялось', [content]);

  function update(path, value) {
    setIsDirty(true);
    setContent((current) => {
      const copy = clone(current);
      const keys = path.split('.');
      let target = copy;
      keys.slice(0, -1).forEach((key) => { target = target[key]; });
      target[keys[keys.length - 1]] = value;
      return copy;
    });
  }

  async function loadContent() {
    try {
      const response = await fetch(`${API_URL}/api/content`);
      const data = await response.json();
      const merged = mergeContent(data.content);
      setContent(merged);
      setJsonDraft(JSON.stringify(merged, null, 2));
      setStatus(data.content ? 'Контент загружен.' : 'Открыт базовый вариант.');
    } catch (error) {
      setStatus('Ошибка загрузки контента. Проверьте переменные Vercel.');
    }
  }

  useEffect(() => { if (auth) loadContent(); }, [auth]);
  useEffect(() => { setJsonDraft(JSON.stringify(content, null, 2)); }, [content]);

  function login(username, password) {
    const encoded = encodeCredentials(username, password);
    localStorage.setItem('adminUsername', username);
    localStorage.setItem('adminAuth', encoded);
    setAuth(encoded);
  }

  function logout() {
    localStorage.removeItem('adminAuth');
    setAuth('');
  }

  async function saveContent() {
    try {
      setStatus('Сохраняем...');
      const response = await fetch(`${API_URL}/api/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения');
      setContent(mergeContent(data.content));
      setIsDirty(false);
      setStatus('Готово. Изменения сохранены.');
    } catch (error) {
      setStatus(`Ошибка: ${error.message}`);
    }
  }

  function renderSection() {
    if (active === 'leads') {
      return <AdminLeads auth={auth} />;
    }

    if (active === 'dashboard') {
      return <Section title="Обзор" description="Админка управляет текстами, карточками, отзывами, FAQ, изображениями и лидами с формы сайта."><div className="dashboard-grid"><div className="metric-card"><span>Статус</span><b>{isDirty ? 'Есть правки' : 'Без правок'}</b><p>{status}</p></div><div className="metric-card"><span>Сохранение</span><b>{updatedAt}</b><p>Контент хранится в content/site-content.json</p></div><div className="metric-card"><span>Лиды</span><b>В личном кабинете</b><p>Раздел «Лиды» показывает заявки с формы.</p></div></div></Section>;
    }

    if (active === 'hero') {
      return <Section title="Первый экран" description="Главный оффер, CTA и изображения первого экрана."><div className="admin-grid"><Field label="Название бренда" value={content.brand} onChange={(value) => update('brand', value)} /><Field label="Кнопка в шапке" value={content.headerCta} onChange={(value) => update('headerCta', value)} /><Field label="Надзаголовок" value={content.hero.eyebrow} onChange={(value) => update('hero.eyebrow', value)} /><Field label="Главный заголовок" value={content.hero.title} onChange={(value) => update('hero.title', value)} multiline /><Field label="Описание" value={content.hero.lead} onChange={(value) => update('hero.lead', value)} multiline /><Field label="Главная кнопка" value={content.hero.primaryCta} onChange={(value) => update('hero.primaryCta', value)} /></div><div className="media-grid"><ImageEditor title="Главное фото первого экрана" location="Первый экран → большая правая карточка" item={content.hero.visual.main} onChange={(value) => update('hero.visual.main', value)} auth={auth} setStatus={setStatus} /><ImageEditor title="Верхняя малая карточка" location="Первый экран → карточка справа сверху" item={content.hero.visual.top} onChange={(value) => update('hero.visual.top', value)} auth={auth} setStatus={setStatus} /><ImageEditor title="Нижняя малая карточка" location="Первый экран → карточка снизу слева" item={content.hero.visual.bottom} onChange={(value) => update('hero.visual.bottom', value)} auth={auth} setStatus={setStatus} /></div></Section>;
    }

    if (active === 'services') {
      return <Section title="Услуги" description="Что входит в постоянный уход."><div className="admin-grid"><Field label="Надзаголовок" value={content.services.eyebrow} onChange={(value) => update('services.eyebrow', value)} /><Field label="Заголовок" value={content.services.title} onChange={(value) => update('services.title', value)} multiline /></div><ItemsEditor title="Карточки услуг" items={content.services.items} onChange={(items) => update('services.items', items)} emptyItem={{ title: 'Новая услуга', text: 'Описание услуги' }} render={(item, setItem) => <div className="admin-grid"><Field label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><Field label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></Section>;
    }

    if (active === 'formats') {
      return <Section title="Форматы ухода" description="Пакеты и сценарии регулярного сервиса."><div className="admin-grid"><Field label="Надзаголовок" value={content.formats.eyebrow} onChange={(value) => update('formats.eyebrow', value)} /><Field label="Заголовок" value={content.formats.title} onChange={(value) => update('formats.title', value)} multiline /><Field label="CTA" value={content.formats.cta} onChange={(value) => update('formats.cta', value)} /></div><ItemsEditor title="Форматы" items={content.formats.items} onChange={(items) => update('formats.items', items)} emptyItem={{ number: '04', title: 'Новый формат', text: 'Описание', bestFor: 'Кому подходит' }} render={(item, setItem) => <div className="admin-grid"><Field label="Номер" value={item.number} onChange={(value) => setItem({ ...item, number: value })} /><Field label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><Field label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /><Field label="Кому подходит" value={item.bestFor} onChange={(value) => setItem({ ...item, bestFor: value })} multiline /></div>} /></Section>;
    }

    if (active === 'trust') {
      return <Section title="Доверие" description="Аргументы качества и безопасности."><div className="admin-grid"><Field label="Надзаголовок" value={content.trust.eyebrow} onChange={(value) => update('trust.eyebrow', value)} /><Field label="Заголовок" value={content.trust.title} onChange={(value) => update('trust.title', value)} multiline /></div><ItemsEditor title="Карточки доверия" items={content.trust.items} onChange={(items) => update('trust.items', items)} emptyItem={{ title: 'Новый пункт', text: 'Описание' }} render={(item, setItem) => <div className="admin-grid"><Field label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><Field label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></Section>;
    }

    if (active === 'process') {
      return <Section title="Этапы" description="Как начинается работа с клиентом."><div className="admin-grid"><Field label="Надзаголовок" value={content.process.eyebrow} onChange={(value) => update('process.eyebrow', value)} /><Field label="Заголовок" value={content.process.title} onChange={(value) => update('process.title', value)} multiline /></div><ItemsEditor title="Этапы" items={content.process.items} onChange={(items) => update('process.items', items)} emptyItem={{ title: 'Новый этап', text: 'Описание этапа' }} render={(item, setItem) => <div className="admin-grid"><Field label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><Field label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></Section>;
    }

    if (active === 'media') {
      return <Section title="Фото и визуал" description="Загрузка фото и понятная привязка: где именно фото находится на сайте."><div className="admin-grid"><Field label="Заголовок блока о людях" value={content.people.title} onChange={(value) => update('people.title', value)} multiline /><Field label="Текст блока о людях" value={content.people.text} onChange={(value) => update('people.text', value)} multiline /><Field label="Заголовок галереи" value={content.gallery.title} onChange={(value) => update('gallery.title', value)} /><Field label="Подпись под галереей" value={content.gallery.caption} onChange={(value) => update('gallery.caption', value)} multiline /></div><ItemsEditor title="Фото людей и процесса" items={content.people.photos} onChange={(items) => update('people.photos', items)} emptyItem={{ label: 'новое фото', imageUrl: '' }} render={(item, setItem, index) => <ImageEditor title={`Фото людей и процесса ${index + 1}`} location={`Блок «Люди» → фото ${index + 1}`} item={item} onChange={setItem} auth={auth} setStatus={setStatus} />} /><ItemsEditor title="Галерея результата" items={content.gallery.items} onChange={(items) => update('gallery.items', items)} emptyItem={{ label: 'новое фото', imageUrl: '' }} render={(item, setItem, index) => <ImageEditor title={`Фото галереи ${index + 1}`} location={`Блок «Результат» → галерея, фото ${index + 1}`} item={item} onChange={setItem} auth={auth} setStatus={setStatus} />} /></Section>;
    }

    if (active === 'reviews') {
      return <Section title="Отзывы" description="Отзывы клиентов."><div className="admin-grid"><Field label="Надзаголовок" value={content.reviews.eyebrow} onChange={(value) => update('reviews.eyebrow', value)} /><Field label="Заголовок" value={content.reviews.title} onChange={(value) => update('reviews.title', value)} multiline /></div><ItemsEditor title="Отзывы" items={content.reviews.items} onChange={(items) => update('reviews.items', items)} emptyItem={{ text: 'Текст отзыва', author: 'Автор' }} render={(item, setItem) => <div className="admin-grid"><Field label="Текст" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /><Field label="Автор" value={item.author} onChange={(value) => setItem({ ...item, author: value })} /></div>} /></Section>;
    }

    if (active === 'faq') {
      return <Section title="FAQ" description="Вопросы и ответы."><div className="admin-grid"><Field label="Надзаголовок" value={content.faq.eyebrow} onChange={(value) => update('faq.eyebrow', value)} /><Field label="Заголовок" value={content.faq.title} onChange={(value) => update('faq.title', value)} multiline /></div><ItemsEditor title="Вопросы" items={content.faq.items} onChange={(items) => update('faq.items', items)} emptyItem={{ question: 'Вопрос', answer: 'Ответ' }} render={(item, setItem) => <div className="admin-grid"><Field label="Вопрос" value={item.question} onChange={(value) => setItem({ ...item, question: value })} /><Field label="Ответ" value={item.answer} onChange={(value) => setItem({ ...item, answer: value })} multiline /></div>} /></Section>;
    }

    if (active === 'contacts') {
      return <Section title="Контакты и финальный CTA" description="Футер, ссылки и финальный блок."><div className="admin-grid"><Field label="Финальный заголовок" value={content.final.title} onChange={(value) => update('final.title', value)} multiline /><Field label="Финальный текст" value={content.final.text} onChange={(value) => update('final.text', value)} multiline /><Field label="Финальная кнопка" value={content.final.cta} onChange={(value) => update('final.cta', value)} /><Field label="Примечание" value={content.final.note} onChange={(value) => update('final.note', value)} /><Field label="Текст футера" value={content.footer.text} onChange={(value) => update('footer.text', value)} /><Field label="Телефон" value={content.footer.phoneLabel} onChange={(value) => update('footer.phoneLabel', value)} /><Field label="WhatsApp URL" value={content.footer.whatsappUrl} onChange={(value) => update('footer.whatsappUrl', value)} /><Field label="Telegram URL" value={content.footer.telegramUrl} onChange={(value) => update('footer.telegramUrl', value)} /></div></Section>;
    }

    return <Section title="JSON" description="Резервный режим для массовых правок."><textarea className="json-editor" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} /><div className="json-actions"><button type="button" onClick={() => { try { setContent(mergeContent(JSON.parse(jsonDraft))); setIsDirty(true); setStatus('JSON применён.'); } catch (error) { setStatus(`Ошибка JSON: ${error.message}`); } }}>Применить JSON</button><button type="button" className="secondary" onClick={() => navigator.clipboard?.writeText(jsonDraft)}>Скопировать JSON</button></div></Section>;
  }

  if (!auth) return <Login onLogin={login} status={status} />;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><span /> <strong>{content.brand}</strong></div>
        <nav className="sidebar-nav">
          {nav.map(([id, label]) => <button type="button" className={active === id ? 'active' : ''} onClick={() => setActive(id)} key={id}><b>{label}</b><small>{id === 'leads' ? 'Заявки' : 'Редактировать'}</small></button>)}
        </nav>
      </aside>
      <section className="admin-workspace">
        <header className="workspace-header">
          <div><p className="admin-eyebrow">Админка сайта</p><h1>Редактор контента «{content.brand}»</h1><p>Тексты, блоки, карточки, изображения и лиды с формы сайта.</p></div>
          <div className="header-actions"><a className="admin-link" href="/" target="_blank" rel="noreferrer">Открыть сайт</a><button type="button" className="secondary" onClick={logout}>Выйти</button><button type="button" onClick={saveContent}>Сохранить</button></div>
        </header>
        <section className="admin-toolbar premium"><div className="toolbar-card"><span>Вход</span><b>Выполнен</b></div><div className="toolbar-card"><span>Состояние</span><b>{isDirty ? 'Есть правки' : 'Без правок'}</b></div><div className="toolbar-card"><span>Сохранение</span><b>{updatedAt}</b></div><button type="button" className="secondary" onClick={loadContent}>Обновить</button></section>
        {status && <div className={`admin-status ${status.startsWith('Ошибка') ? 'error' : ''}`}>{status}</div>}
        {renderSection()}
      </section>
    </main>
  );
}
