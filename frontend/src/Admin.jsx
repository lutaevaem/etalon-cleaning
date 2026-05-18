import { useEffect, useMemo, useState } from 'react';
import { defaultContent } from './defaultContent.js';
import './admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const sections = [
  { id: 'dashboard', label: 'Обзор', hint: 'Статус и быстрые действия' },
  { id: 'hero', label: 'Первый экран', hint: 'Оффер, CTA, визуал' },
  { id: 'positioning', label: 'Позиционирование', hint: 'Смысл и отличие сервиса' },
  { id: 'audience', label: 'Аудитория', hint: 'Для кого услуга' },
  { id: 'services', label: 'Услуги', hint: 'Что входит в уход' },
  { id: 'formats', label: 'Форматы', hint: 'Пакеты и сценарии' },
  { id: 'trust', label: 'Доверие', hint: 'Аргументы качества' },
  { id: 'process', label: 'Этапы', hint: 'Как начинается работа' },
  { id: 'media', label: 'Фото и визуал', hint: 'Изображения и подписи' },
  { id: 'reviews', label: 'Отзывы', hint: 'Социальное доказательство' },
  { id: 'faq', label: 'FAQ', hint: 'Вопросы и ответы' },
  { id: 'contacts', label: 'Контакты', hint: 'Футер и ссылки' },
  { id: 'json', label: 'JSON', hint: 'Массовые правки' }
];

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

function mergeContent(remoteContent) {
  if (!remoteContent) return clone(defaultContent);
  return {
    ...clone(defaultContent),
    ...remoteContent,
    hero: { ...defaultContent.hero, ...remoteContent.hero, visual: { ...defaultContent.hero.visual, ...(remoteContent.hero?.visual || {}) } },
    intro: { ...defaultContent.intro, ...remoteContent.intro },
    audience: { ...defaultContent.audience, ...remoteContent.audience },
    compare: { ...defaultContent.compare, ...remoteContent.compare },
    services: { ...defaultContent.services, ...remoteContent.services },
    formats: { ...defaultContent.formats, ...remoteContent.formats },
    value: { ...defaultContent.value, ...remoteContent.value },
    process: { ...defaultContent.process, ...remoteContent.process },
    trust: { ...defaultContent.trust, ...remoteContent.trust },
    people: { ...defaultContent.people, ...remoteContent.people },
    gallery: { ...defaultContent.gallery, ...remoteContent.gallery },
    reviews: { ...defaultContent.reviews, ...remoteContent.reviews },
    faq: { ...defaultContent.faq, ...remoteContent.faq },
    quiz: { ...defaultContent.quiz, ...remoteContent.quiz },
    final: { ...defaultContent.final, ...remoteContent.final },
    footer: { ...defaultContent.footer, ...remoteContent.footer }
  };
}

function TextInput({ label, value, onChange, multiline = false, placeholder = '', note = '' }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ''} placeholder={placeholder} rows="4" onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
      {note && <small>{note}</small>}
    </label>
  );
}

function ImageField({ label, item, onChange }) {
  return (
    <div className="image-field">
      <div className="image-preview" style={item?.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>
        {!item?.imageUrl && <span>Фото</span>}
      </div>
      <div className="image-inputs">
        <TextInput label={`${label}: подпись`} value={item?.label || ''} onChange={(value) => onChange({ ...item, label: value })} />
        <TextInput label={`${label}: ссылка на изображение`} value={item?.imageUrl || ''} onChange={(value) => onChange({ ...item, imageUrl: value })} placeholder="https://..." note="Пока используем URL изображения. Позже можно подключить загрузку файлов." />
      </div>
    </div>
  );
}

function EditorSection({ title, description, children, aside }) {
  return (
    <section className="editor-section">
      <div className="section-title-row">
        <div>
          <p className="admin-eyebrow">Раздел сайта</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ArrayEditor({ title, description, items, onChange, renderItem, emptyItem, itemTitle = 'Элемент' }) {
  return (
    <div className="nested-editor">
      <div className="nested-head">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <button type="button" onClick={() => onChange([...(items || []), clone(emptyItem)])}>+ Добавить</button>
      </div>

      <div className="admin-list">
        {(items || []).map((item, index) => (
          <div className="admin-list-item" key={index}>
            <div className="admin-list-item-head">
              <strong>{item.title || item.question || item.author || `${itemTitle} ${index + 1}`}</strong>
              <div className="item-actions">
                <button type="button" className="ghost" disabled={index === 0} onClick={() => {
                  const next = [...items];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}>↑</button>
                <button type="button" className="ghost" disabled={index === items.length - 1} onClick={() => {
                  const next = [...items];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}>↓</button>
                <button type="button" className="danger" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Удалить</button>
              </div>
            </div>
            {renderItem(item, index, (nextItem) => {
              const nextItems = [...items];
              nextItems[index] = nextItem;
              onChange(nextItems);
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCard({ content }) {
  return (
    <aside className="live-preview">
      <div className="preview-browser">
        <div className="preview-dots"><span /><span /><span /></div>
        <strong>{content.brand}</strong>
      </div>
      <div className="preview-hero">
        <p>{content.hero.eyebrow}</p>
        <h3>{content.hero.title}</h3>
        <span>{content.hero.primaryCta}</span>
      </div>
      <div className="preview-blocks">
        <div><b>{content.services.items?.length || 0}</b><small>услуг</small></div>
        <div><b>{content.formats.items?.length || 0}</b><small>формата</small></div>
        <div><b>{content.reviews.items?.length || 0}</b><small>отзыва</small></div>
      </div>
    </aside>
  );
}

export default function Admin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [content, setContent] = useState(clone(defaultContent));
  const [status, setStatus] = useState('');
  const [jsonDraft, setJsonDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const updatedAt = useMemo(() => content?.updatedAt ? new Date(content.updatedAt).toLocaleString('ru-RU') : 'ещё не сохранялось', [content]);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        const merged = mergeContent(data.content);
        setContent(merged);
        setJsonDraft(JSON.stringify(merged, null, 2));
        setStatus(data.content ? 'Контент загружен с сервера.' : 'На сервере пока нет сохранённого контента. Открыт базовый вариант.');
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
    setIsDirty(true);
    setContent((current) => setByPath(current, path, value));
  }

  function replaceContent(nextContent) {
    setIsDirty(true);
    setContent(nextContent);
  }

  async function saveContent() {
    try {
      localStorage.setItem('adminToken', token);
      setStatus('Сохраняем изменения...');
      const response = await fetch(`${API_URL}/api/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения');
      const merged = mergeContent(data.content);
      setContent(merged);
      setIsDirty(false);
      setStatus('Готово. Изменения сохранены. Обновите сайт через Ctrl+F5.');
    } catch (error) {
      setStatus(`Ошибка: ${error.message}`);
    }
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonDraft);
      replaceContent(mergeContent(parsed));
      setStatus('JSON применён. Не забудьте сохранить изменения.');
    } catch (error) {
      setStatus(`Ошибка JSON: ${error.message}`);
    }
  }

  function renderActiveSection() {
    if (activeSection === 'dashboard') {
      return (
        <EditorSection title="Панель управления сайтом" description="Теперь это не список полей, а рабочий редактор по логике сайта: оффер, услуги, доверие, медиа, отзывы и FAQ.">
          <div className="dashboard-grid">
            <div className="metric-card"><span>Статус</span><b>{isDirty ? 'Есть несохранённые правки' : 'Сохранено'}</b><p>{status}</p></div>
            <div className="metric-card"><span>Последнее сохранение</span><b>{updatedAt}</b><p>Контент хранится на backend Render.</p></div>
            <div className="metric-card"><span>Структура</span><b>{sections.length - 1} разделов</b><p>Редактируются ключевые блоки лендинга.</p></div>
          </div>
          <div className="admin-note">
            <h3>Что усилено по логике сайта под строительство/ремонт</h3>
            <p>Админка теперь повторяет структуру продающей страницы: сначала оффер и позиционирование, дальше аудитория, услуги, форматы, доверие, процесс, медиа, отзывы и FAQ. Можно быстро менять не только текст, но и порядок карточек, подписи, изображения и контактные ссылки.</p>
          </div>
        </EditorSection>
      );
    }

    if (activeSection === 'hero') {
      return (
        <EditorSection title="Первый экран" description="Самый важный блок: за 5–10 секунд объясняет, что это премиальный постоянный уход за домом, а не разовая уборка." aside={<PreviewCard content={content} />}>
          <div className="admin-grid">
            <TextInput label="Название бренда" value={content.brand} onChange={(value) => update('brand', value)} />
            <TextInput label="Кнопка в шапке" value={content.headerCta} onChange={(value) => update('headerCta', value)} />
            <TextInput label="Надзаголовок" value={content.hero.eyebrow} onChange={(value) => update('hero.eyebrow', value)} />
            <TextInput label="Главный заголовок" value={content.hero.title} onChange={(value) => update('hero.title', value)} multiline />
            <TextInput label="Описание под заголовком" value={content.hero.lead} onChange={(value) => update('hero.lead', value)} multiline />
            <TextInput label="Главная кнопка" value={content.hero.primaryCta} onChange={(value) => update('hero.primaryCta', value)} />
            <TextInput label="Вторая кнопка" value={content.hero.secondaryCta} onChange={(value) => update('hero.secondaryCta', value)} />
            <TextInput label="Бейджи через запятую" value={(content.hero.badges || []).join(', ')} onChange={(value) => update('hero.badges', value.split(',').map((item) => item.trim()).filter(Boolean))} />
          </div>
          <div className="media-grid">
            <ImageField label="Главное изображение" item={content.hero.visual.main} onChange={(value) => update('hero.visual.main', value)} />
            <ImageField label="Верхняя карточка" item={content.hero.visual.top} onChange={(value) => update('hero.visual.top', value)} />
            <ImageField label="Нижняя карточка" item={content.hero.visual.bottom} onChange={(value) => update('hero.visual.bottom', value)} />
          </div>
        </EditorSection>
      );
    }

    if (activeSection === 'positioning') {
      return (
        <EditorSection title="Позиционирование и ценность" description="Здесь фиксируем премиальную идею: не разовый клининг, а дом на постоянном сервисе.">
          <div className="admin-grid">
            <TextInput label="Надзаголовок" value={content.intro.eyebrow} onChange={(value) => update('intro.eyebrow', value)} />
            <TextInput label="Заголовок" value={content.intro.title} onChange={(value) => update('intro.title', value)} multiline />
            <TextInput label="Текст позиционирования" value={content.intro.text} onChange={(value) => update('intro.text', value)} multiline />
            <TextInput label="Надзаголовок ценности" value={content.value.eyebrow} onChange={(value) => update('value.eyebrow', value)} />
            <TextInput label="Заголовок ценности" value={content.value.title} onChange={(value) => update('value.title', value)} multiline />
            <TextInput label="Текст ценности" value={content.value.text} onChange={(value) => update('value.text', value)} multiline />
            <TextInput label="Пункты ценности через запятую" value={(content.value.items || []).join(', ')} onChange={(value) => update('value.items', value.split(',').map((item) => item.trim()).filter(Boolean))} multiline />
          </div>
        </EditorSection>
      );
    }

    if (activeSection === 'audience') {
      return <EditorSection title="Аудитория" description="Сегменты клиентов, для которых сайт должен сразу звучать релевантно."><ArrayEditor title="Карточки аудитории" items={content.audience.items} onChange={(items) => update('audience.items', items)} emptyItem={{ title: 'Новый сегмент', text: 'Описание сегмента' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Заголовок" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><TextInput label="Текст" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'services') {
      return <EditorSection title="Услуги" description="Карточки того, что входит в постоянный уход за домом."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.services.eyebrow} onChange={(value) => update('services.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.services.title} onChange={(value) => update('services.title', value)} multiline /></div><ArrayEditor title="Список услуг" items={content.services.items} onChange={(items) => update('services.items', items)} emptyItem={{ title: 'Новая услуга', text: 'Описание услуги' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Название услуги" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><TextInput label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'formats') {
      return <EditorSection title="Форматы ухода" description="Блок помогает продавать не часы уборки, а понятные сценарии постоянного сервиса."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.formats.eyebrow} onChange={(value) => update('formats.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.formats.title} onChange={(value) => update('formats.title', value)} multiline /><TextInput label="Кнопка под форматами" value={content.formats.cta} onChange={(value) => update('formats.cta', value)} /></div><ArrayEditor title="Карточки форматов" items={content.formats.items} onChange={(items) => update('formats.items', items)} emptyItem={{ number: '04', title: 'Новый формат', text: 'Описание формата', bestFor: 'Для кого подходит' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Номер" value={item.number} onChange={(value) => setItem({ ...item, number: value })} /><TextInput label="Название" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><TextInput label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /><TextInput label="Кому подходит" value={item.bestFor} onChange={(value) => setItem({ ...item, bestFor: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'trust') {
      return <EditorSection title="Доверие" description="Аргументы, которые помогают продавать дороже рынка: безопасность, деликатность, контроль качества."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.trust.eyebrow} onChange={(value) => update('trust.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.trust.title} onChange={(value) => update('trust.title', value)} multiline /></div><ArrayEditor title="Карточки доверия" items={content.trust.items} onChange={(items) => update('trust.items', items)} emptyItem={{ title: 'Новый пункт', text: 'Описание' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Заголовок" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><TextInput label="Текст" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'process') {
      return <EditorSection title="Этапы работы" description="Показываем клиенту, что процесс спокойный, понятный и управляемый."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.process.eyebrow} onChange={(value) => update('process.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.process.title} onChange={(value) => update('process.title', value)} multiline /></div><ArrayEditor title="Этапы" items={content.process.items} onChange={(items) => update('process.items', items)} emptyItem={{ title: 'Новый этап', text: 'Описание этапа' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Название этапа" value={item.title} onChange={(value) => setItem({ ...item, title: value })} /><TextInput label="Описание" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'media') {
      return (
        <EditorSection title="Фото и визуал" description="Здесь управляем фото сотрудников, процесса, деталей чистоты и галереи результата.">
          <div className="admin-grid">
            <TextInput label="Надзаголовок блока о людях" value={content.people.eyebrow} onChange={(value) => update('people.eyebrow', value)} />
            <TextInput label="Заголовок блока о людях" value={content.people.title} onChange={(value) => update('people.title', value)} multiline />
            <TextInput label="Текст блока о людях" value={content.people.text} onChange={(value) => update('people.text', value)} multiline />
            <TextInput label="Заголовок галереи" value={content.gallery.title} onChange={(value) => update('gallery.title', value)} />
          </div>
          <ArrayEditor title="Фото людей и процесса" items={content.people.photos} onChange={(items) => update('people.photos', items)} emptyItem={{ label: 'новое фото', imageUrl: '' }} renderItem={(item, index, setItem) => <ImageField label="Фото" item={item} onChange={setItem} />} />
          <ArrayEditor title="Галерея результата" items={content.gallery.items} onChange={(items) => update('gallery.items', items)} emptyItem={{ label: 'новое фото', imageUrl: '' }} renderItem={(item, index, setItem) => <ImageField label="Фото" item={item} onChange={setItem} />} />
          <TextInput label="Подпись под галереей" value={content.gallery.caption} onChange={(value) => update('gallery.caption', value)} multiline />
        </EditorSection>
      );
    }

    if (activeSection === 'reviews') {
      return <EditorSection title="Отзывы" description="Социальное доказательство: реальные отзывы позже заменим на настоящие."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.reviews.eyebrow} onChange={(value) => update('reviews.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.reviews.title} onChange={(value) => update('reviews.title', value)} multiline /></div><ArrayEditor title="Отзывы клиентов" items={content.reviews.items} onChange={(items) => update('reviews.items', items)} emptyItem={{ text: 'Текст отзыва', author: 'Имя клиента' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Отзыв" value={item.text} onChange={(value) => setItem({ ...item, text: value })} multiline /><TextInput label="Автор" value={item.author} onChange={(value) => setItem({ ...item, author: value })} /></div>} /></EditorSection>;
    }

    if (activeSection === 'faq') {
      return <EditorSection title="FAQ" description="Закрываем вопросы перед заявкой: формат, безопасность, доступ в дом, стоимость."><div className="admin-grid small-gap"><TextInput label="Надзаголовок" value={content.faq.eyebrow} onChange={(value) => update('faq.eyebrow', value)} /><TextInput label="Заголовок блока" value={content.faq.title} onChange={(value) => update('faq.title', value)} multiline /></div><ArrayEditor title="Вопросы и ответы" items={content.faq.items} onChange={(items) => update('faq.items', items)} emptyItem={{ question: 'Новый вопрос', answer: 'Ответ' }} renderItem={(item, index, setItem) => <div className="admin-grid"><TextInput label="Вопрос" value={item.question} onChange={(value) => setItem({ ...item, question: value })} /><TextInput label="Ответ" value={item.answer} onChange={(value) => setItem({ ...item, answer: value })} multiline /></div>} /></EditorSection>;
    }

    if (activeSection === 'contacts') {
      return (
        <EditorSection title="Контакты, финальный CTA и футер" description="Телефон и CRM можно подключить позже. Сейчас можно держать заглушки или скрытые рабочие ссылки.">
          <div className="admin-grid">
            <TextInput label="Финальный заголовок" value={content.final.title} onChange={(value) => update('final.title', value)} multiline />
            <TextInput label="Финальный текст" value={content.final.text} onChange={(value) => update('final.text', value)} multiline />
            <TextInput label="Финальная кнопка" value={content.final.cta} onChange={(value) => update('final.cta', value)} />
            <TextInput label="Примечание" value={content.final.note} onChange={(value) => update('final.note', value)} />
            <TextInput label="Текст футера" value={content.footer.text} onChange={(value) => update('footer.text', value)} />
            <TextInput label="Телефон, подпись" value={content.footer.phoneLabel} onChange={(value) => update('footer.phoneLabel', value)} />
            <TextInput label="Телефон, ссылка" value={content.footer.phoneHref} onChange={(value) => update('footer.phoneHref', value)} />
            <TextInput label="WhatsApp URL" value={content.footer.whatsappUrl} onChange={(value) => update('footer.whatsappUrl', value)} />
            <TextInput label="Telegram URL" value={content.footer.telegramUrl} onChange={(value) => update('footer.telegramUrl', value)} />
          </div>
        </EditorSection>
      );
    }

    return (
      <EditorSection title="JSON-редактор" description="Для быстрых массовых правок, переноса контента и резервного копирования.">
        <textarea className="json-editor" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} />
        <div className="json-actions"><button type="button" onClick={applyJson}>Применить JSON</button><button type="button" className="secondary" onClick={() => navigator.clipboard?.writeText(jsonDraft)}>Скопировать JSON</button></div>
      </EditorSection>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><span /> <strong>{content.brand}</strong></div>
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <button type="button" className={activeSection === section.id ? 'active' : ''} onClick={() => setActiveSection(section.id)} key={section.id}>
              <b>{section.label}</b><small>{section.hint}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-workspace">
        <header className="workspace-header">
          <div><p className="admin-eyebrow">Админка сайта</p><h1>Редактор контента «{content.brand}»</h1><p>Структурная админка для управления продающей страницей: тексты, блоки, карточки, отзывы, FAQ и изображения.</p></div>
          <div className="header-actions"><a className="admin-link" href="/" target="_blank" rel="noreferrer">Открыть сайт</a><button type="button" onClick={saveContent}>Сохранить</button></div>
        </header>

        <section className="admin-toolbar premium">
          <TextInput label="Admin token" value={token} onChange={setToken} placeholder="Вставьте ADMIN_TOKEN из Render" />
          <div className="toolbar-card"><span>Состояние</span><b>{isDirty ? 'Есть правки' : 'Без правок'}</b></div>
          <div className="toolbar-card"><span>Сохранение</span><b>{updatedAt}</b></div>
          <button type="button" className="secondary" onClick={() => replaceContent(clone(defaultContent))}>Сбросить</button>
        </section>

        {status && <div className={`admin-status ${status.startsWith('Ошибка') ? 'error' : ''}`}>{status}</div>}
        {renderActiveSection()}
      </section>
    </main>
  );
}
