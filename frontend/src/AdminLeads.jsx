import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const statusLabels = {
  new: 'Новая',
  in_progress: 'В работе',
  contacted: 'Связались',
  scheduled: 'Назначена консультация',
  won: 'Клиент',
  lost: 'Неактуально'
};

const statusOptions = [
  ['new', 'Новая'],
  ['in_progress', 'В работе'],
  ['contacted', 'Связались'],
  ['scheduled', 'Назначена консультация'],
  ['won', 'Клиент'],
  ['lost', 'Неактуально']
];

const priorityLabels = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  urgent: 'Срочно'
};

const priorityOptions = [
  ['low', 'Низкий'],
  ['normal', 'Обычный'],
  ['high', 'Высокий'],
  ['urgent', 'Срочно']
];

const sortOptions = [
  ['newest', 'Сначала новые'],
  ['nextContact', 'По следующему контакту'],
  ['priority', 'По приоритету'],
  ['status', 'По статусу']
];

const priorityWeight = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch (error) {
    return value;
  }
}

function leadSummary(lead) {
  return [lead.object, lead.area, lead.frequency].filter(Boolean).join(' • ') || 'Без деталей';
}

function normalizePhone(value = '') {
  return String(value).replace(/[^+\d]/g, '');
}

function normalizeDigits(value = '') {
  return String(value).replace(/[^\d]/g, '');
}

function telegramHref(value = '') {
  const contact = String(value).trim();

  if (!contact) return 'https://t.me/';
  if (contact.includes('t.me/')) return contact.startsWith('http') ? contact : `https://${contact}`;
  if (contact.startsWith('@')) return `https://t.me/${contact.slice(1)}`;

  const usernameCandidate = contact.replace(/[^a-zA-Z0-9_]/g, '');
  const onlyDigits = normalizeDigits(contact);

  if (usernameCandidate && !onlyDigits && usernameCandidate.length >= 5) {
    return `https://t.me/${usernameCandidate}`;
  }

  return `tg://resolve?phone=${onlyDigits}`;
}

function createLeadDraft(lead) {
  return {
    status: lead.status || 'new',
    priority: lead.priority || 'normal',
    nextContactAt: lead.nextContactAt || '',
    managerComment: lead.managerComment || ''
  };
}

function getLeadTiming(lead, draft) {
  if (!draft?.nextContactAt) {
    return { type: 'empty', label: 'Контакт не назначен' };
  }

  const now = new Date();
  const date = new Date(draft.nextContactAt);

  if (Number.isNaN(date.getTime())) {
    return { type: 'empty', label: 'Дата не распознана' };
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const dayAfterTomorrowStart = tomorrowStart + 24 * 60 * 60 * 1000;

  if (date.getTime() < now.getTime()) {
    return { type: 'overdue', label: 'Просрочено' };
  }

  if (date.getTime() >= todayStart && date.getTime() < tomorrowStart) {
    return { type: 'today', label: 'Сегодня' };
  }

  if (date.getTime() >= tomorrowStart && date.getTime() < dayAfterTomorrowStart) {
    return { type: 'tomorrow', label: 'Завтра' };
  }

  return { type: 'planned', label: 'Запланировано' };
}

function isOpenLead(status) {
  return !['won', 'lost'].includes(status || 'new');
}

export default function AdminLeads({ auth }) {
  const [leads, setLeads] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timingFilter, setTimingFilter] = useState('all');
  const [sortMode, setSortMode] = useState('nextContact');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');

  function syncDrafts(nextLeads) {
    const nextDrafts = {};
    nextLeads.forEach((lead) => {
      nextDrafts[lead.id] = createLeadDraft(lead);
    });
    setDrafts(nextDrafts);
  }

  async function loadLeads() {
    try {
      setLoading(true);
      setMessage('Загружаем лиды...');
      const response = await fetch(`${API_URL}/api/leads`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось загрузить лиды');
      const nextLeads = data.leads || [];
      setLeads(nextLeads);
      syncDrafts(nextLeads);
      setMessage(nextLeads.length ? `Загружено лидов: ${nextLeads.length}` : 'Лидов пока нет.');
    } catch (error) {
      setMessage(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(id, patch) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        ...patch
      }
    }));
  }

  function isDraftChanged(lead) {
    const draft = drafts[lead.id] || createLeadDraft(lead);
    return draft.status !== (lead.status || 'new')
      || draft.priority !== (lead.priority || 'normal')
      || draft.nextContactAt !== (lead.nextContactAt || '')
      || draft.managerComment !== (lead.managerComment || '');
  }

  async function saveLead(lead) {
    const draft = drafts[lead.id] || createLeadDraft(lead);

    try {
      setSavingId(lead.id);
      setMessage('Сохраняем изменения по лиду...');
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({ id: lead.id, ...draft })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось сохранить лид');
      const nextLeads = data.leads || leads.map((item) => item.id === lead.id ? { ...item, ...draft } : item);
      setLeads(nextLeads);
      syncDrafts(nextLeads);
      setMessage('Лид сохранён.');
    } catch (error) {
      setMessage(`Ошибка: ${error.message}`);
    } finally {
      setSavingId('');
    }
  }

  async function deleteLead(id) {
    const lead = leads.find((item) => item.id === id);
    const ok = window.confirm(`Удалить лид ${lead?.contact || ''}?`);
    if (!ok) return;

    const previousLeads = leads;
    setLeads(leads.filter((item) => item.id !== id));

    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось удалить лид');
      const nextLeads = data.leads || [];
      setLeads(nextLeads);
      syncDrafts(nextLeads);
      setMessage('Лид удалён.');
    } catch (error) {
      setLeads(previousLeads);
      syncDrafts(previousLeads);
      setMessage(`Ошибка: ${error.message}`);
    }
  }

  useEffect(() => {
    if (auth) loadLeads();
  }, [auth]);

  const leadViewModels = useMemo(() => {
    return leads.map((lead) => {
      const draft = drafts[lead.id] || createLeadDraft(lead);
      const timing = getLeadTiming(lead, draft);
      return { lead, draft, timing };
    });
  }, [leads, drafts]);

  const stats = useMemo(() => {
    return leadViewModels.reduce((acc, item) => {
      const status = item.draft.status || 'new';
      acc.total += 1;
      acc[status] = (acc[status] || 0) + 1;
      if (item.timing.type === 'overdue' && isOpenLead(status)) acc.overdue += 1;
      if (item.timing.type === 'today' && isOpenLead(status)) acc.today += 1;
      if (item.draft.priority === 'urgent' && isOpenLead(status)) acc.urgent += 1;
      if (isOpenLead(status)) acc.open += 1;
      return acc;
    }, { total: 0, overdue: 0, today: 0, urgent: 0, open: 0 });
  }, [leadViewModels]);

  const tasksToday = useMemo(() => {
    return leadViewModels
      .filter((item) => isOpenLead(item.draft.status) && ['overdue', 'today'].includes(item.timing.type))
      .sort((a, b) => {
        const aTime = a.draft.nextContactAt ? new Date(a.draft.nextContactAt).getTime() : Infinity;
        const bTime = b.draft.nextContactAt ? new Date(b.draft.nextContactAt).getTime() : Infinity;
        return aTime - bTime;
      });
  }, [leadViewModels]);

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = leadViewModels.filter(({ lead, draft, timing }) => {
      const matchesStatus = statusFilter === 'all' || draft.status === statusFilter;
      const matchesTiming = timingFilter === 'all'
        || timing.type === timingFilter
        || (timingFilter === 'active' && isOpenLead(draft.status));
      const haystack = `${lead.contact} ${lead.object} ${lead.area} ${lead.frequency} ${lead.details} ${draft.managerComment}`.toLowerCase();
      const matchesQuery = !text || haystack.includes(text);
      return matchesStatus && matchesTiming && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'priority') {
        return (priorityWeight[b.draft.priority] || 0) - (priorityWeight[a.draft.priority] || 0)
          || new Date(b.lead.createdAt) - new Date(a.lead.createdAt);
      }

      if (sortMode === 'status') {
        return String(a.draft.status).localeCompare(String(b.draft.status), 'ru')
          || new Date(b.lead.createdAt) - new Date(a.lead.createdAt);
      }

      if (sortMode === 'nextContact') {
        const aTime = a.draft.nextContactAt ? new Date(a.draft.nextContactAt).getTime() : Infinity;
        const bTime = b.draft.nextContactAt ? new Date(b.draft.nextContactAt).getTime() : Infinity;
        return aTime - bTime || new Date(b.lead.createdAt) - new Date(a.lead.createdAt);
      }

      return new Date(b.lead.createdAt) - new Date(a.lead.createdAt);
    });
  }, [leadViewModels, query, statusFilter, timingFilter, sortMode]);

  return (
    <section className="editor-section leads-section">
      <div className="section-title-row">
        <div>
          <p className="admin-eyebrow">Личный кабинет</p>
          <h2>Лиды с сайта</h2>
          <p>Здесь видно все заявки с формы: контакт, параметры дома, статус обработки, комментарий менеджера и следующий контакт.</p>
        </div>
        <button type="button" onClick={loadLeads} disabled={loading}>{loading ? 'Обновляем...' : 'Обновить лиды'}</button>
      </div>

      <div className="lead-stats lead-stats-extended">
        <div><span>Всего</span><b>{stats.total || 0}</b></div>
        <div><span>Активные</span><b>{stats.open || 0}</b></div>
        <div><span>Сегодня</span><b>{stats.today || 0}</b></div>
        <div className={stats.overdue ? 'attention' : ''}><span>Просрочено</span><b>{stats.overdue || 0}</b></div>
        <div className={stats.urgent ? 'attention' : ''}><span>Срочные</span><b>{stats.urgent || 0}</b></div>
      </div>

      <div className="today-panel">
        <div>
          <p className="admin-eyebrow">Фокус на сегодня</p>
          <h3>Кого нужно обработать сейчас</h3>
        </div>
        {tasksToday.length ? (
          <div className="today-list">
            {tasksToday.slice(0, 5).map(({ lead, draft, timing }) => (
              <button type="button" key={lead.id} onClick={() => { setQuery(lead.contact); setTimingFilter('all'); setStatusFilter('all'); }} className={`today-task ${timing.type}`}>
                <b>{lead.contact}</b>
                <span>{timing.label} · {draft.nextContactAt ? formatDate(draft.nextContactAt) : 'без даты'}</span>
              </button>
            ))}
          </div>
        ) : <p className="today-empty">На сегодня нет обязательных контактов.</p>}
      </div>

      <div className="lead-filters lead-filters-extended">
        <label className="admin-field">
          <span>Поиск</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Контакт, площадь, комментарий..." />
        </label>
        <label className="admin-field">
          <span>Статус</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Все статусы</option>
            {statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="admin-field">
          <span>Срок контакта</span>
          <select value={timingFilter} onChange={(event) => setTimingFilter(event.target.value)}>
            <option value="all">Все сроки</option>
            <option value="active">Только активные</option>
            <option value="overdue">Просрочено</option>
            <option value="today">Сегодня</option>
            <option value="tomorrow">Завтра</option>
            <option value="planned">Запланировано</option>
            <option value="empty">Без даты</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Сортировка</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            {sortOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {message && <div className={`admin-status ${message.startsWith('Ошибка') ? 'error' : ''}`}>{message}</div>}

      <div className="leads-list">
        {filteredLeads.map(({ lead, draft, timing }) => {
          const changed = isDraftChanged(lead);
          const phone = normalizePhone(lead.contact);
          const digits = normalizeDigits(lead.contact);

          return (
            <article className={`lead-card lead-priority-${draft.priority} lead-timing-${timing.type}`} key={lead.id}>
              <div className="lead-card-head">
                <div>
                  <div className="lead-badges">
                    <span className={`lead-status lead-status-${draft.status}`}>{statusLabels[draft.status] || draft.status}</span>
                    <span className={`lead-priority lead-priority-badge-${draft.priority}`}>{priorityLabels[draft.priority] || draft.priority}</span>
                    <span className={`lead-timing-badge lead-timing-badge-${timing.type}`}>{timing.label}</span>
                  </div>
                  <h3>{lead.contact}</h3>
                  <p>{leadSummary(lead)}</p>
                </div>
                <div className="lead-date">
                  <span>Создан</span>
                  <b>{formatDate(lead.createdAt)}</b>
                </div>
              </div>

              <div className="lead-details-grid">
                <div><span>Объект</span><b>{lead.object || '—'}</b></div>
                <div><span>Площадь</span><b>{lead.area || '—'}</b></div>
                <div><span>Частота</span><b>{lead.frequency || '—'}</b></div>
                <div><span>Источник</span><b>{lead.source || 'site'}</b></div>
              </div>

              {lead.details && <div className="lead-text"><span>Что важно клиенту</span><p>{lead.details}</p></div>}

              <div className="lead-controls lead-controls-three">
                <label className="admin-field">
                  <span>Статус</span>
                  <select value={draft.status} onChange={(event) => updateDraft(lead.id, { status: event.target.value })}>
                    {statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Приоритет</span>
                  <select value={draft.priority} onChange={(event) => updateDraft(lead.id, { priority: event.target.value })}>
                    {priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Следующий контакт</span>
                  <input type="datetime-local" value={draft.nextContactAt} onChange={(event) => updateDraft(lead.id, { nextContactAt: event.target.value })} />
                </label>
              </div>

              <label className="admin-field">
                <span>Комментарий менеджера</span>
                <textarea rows="3" value={draft.managerComment} onChange={(event) => updateDraft(lead.id, { managerComment: event.target.value })} placeholder="Что обсудили, что предложить, когда вернуться..." />
              </label>

              <div className="lead-actions">
                <button type="button" onClick={() => saveLead(lead)} disabled={!changed || savingId === lead.id}>{savingId === lead.id ? 'Сохраняем...' : changed ? 'Сохранить лид' : 'Сохранено'}</button>
                <a className="admin-link" href={phone ? `tel:${phone}` : '#'}>Позвонить</a>
                <a className="admin-link secondary-link" href={digits ? `https://wa.me/${digits}` : '#'} target="_blank" rel="noreferrer">WhatsApp</a>
                <a className="admin-link secondary-link" href={telegramHref(lead.contact)} target="_blank" rel="noreferrer">Telegram</a>
                <button type="button" className="danger" onClick={() => deleteLead(lead.id)}>Удалить</button>
              </div>
            </article>
          );
        })}
      </div>

      {!filteredLeads.length && <div className="admin-status">По выбранным условиям лидов нет.</div>}
    </section>
  );
}
