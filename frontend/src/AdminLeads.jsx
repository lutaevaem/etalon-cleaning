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

export default function AdminLeads({ auth }) {
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadLeads() {
    try {
      setLoading(true);
      setMessage('Загружаем лиды...');
      const response = await fetch(`${API_URL}/api/leads`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось загрузить лиды');
      setLeads(data.leads || []);
      setMessage(data.leads?.length ? `Загружено лидов: ${data.leads.length}` : 'Лидов пока нет.');
    } catch (error) {
      setMessage(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateLead(id, patch) {
    const previousLeads = leads;
    const nextLeads = leads.map((lead) => lead.id === id ? { ...lead, ...patch, updatedAt: new Date().toISOString() } : lead);
    setLeads(nextLeads);

    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({ id, ...patch })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Не удалось сохранить лид');
      setLeads(data.leads || nextLeads);
      setMessage('Лид обновлён.');
    } catch (error) {
      setLeads(previousLeads);
      setMessage(`Ошибка: ${error.message}`);
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
      setLeads(data.leads || []);
      setMessage('Лид удалён.');
    } catch (error) {
      setLeads(previousLeads);
      setMessage(`Ошибка: ${error.message}`);
    }
  }

  useEffect(() => {
    if (auth) loadLeads();
  }, [auth]);

  const stats = useMemo(() => {
    return leads.reduce((acc, lead) => {
      const status = lead.status || 'new';
      acc.total += 1;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { total: 0 });
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || (lead.status || 'new') === statusFilter;
      const haystack = `${lead.contact} ${lead.object} ${lead.area} ${lead.frequency} ${lead.details} ${lead.managerComment}`.toLowerCase();
      const matchesQuery = !text || haystack.includes(text);
      return matchesStatus && matchesQuery;
    });
  }, [leads, query, statusFilter]);

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

      <div className="lead-stats">
        <div><span>Всего</span><b>{stats.total || 0}</b></div>
        <div><span>Новые</span><b>{stats.new || 0}</b></div>
        <div><span>В работе</span><b>{stats.in_progress || 0}</b></div>
        <div><span>Клиенты</span><b>{stats.won || 0}</b></div>
      </div>

      <div className="lead-filters">
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
      </div>

      {message && <div className={`admin-status ${message.startsWith('Ошибка') ? 'error' : ''}`}>{message}</div>}

      <div className="leads-list">
        {filteredLeads.map((lead) => (
          <article className="lead-card" key={lead.id}>
            <div className="lead-card-head">
              <div>
                <span className={`lead-status lead-status-${lead.status || 'new'}`}>{statusLabels[lead.status || 'new'] || lead.status}</span>
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

            <div className="lead-controls">
              <label className="admin-field">
                <span>Статус</span>
                <select value={lead.status || 'new'} onChange={(event) => updateLead(lead.id, { status: event.target.value })}>
                  {statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label className="admin-field">
                <span>Следующий контакт</span>
                <input type="datetime-local" value={lead.nextContactAt || ''} onChange={(event) => updateLead(lead.id, { nextContactAt: event.target.value })} />
              </label>
            </div>

            <label className="admin-field">
              <span>Комментарий менеджера</span>
              <textarea rows="3" value={lead.managerComment || ''} onChange={(event) => updateLead(lead.id, { managerComment: event.target.value })} placeholder="Что обсудили, что предложить, когда вернуться..." />
            </label>

            <div className="lead-actions">
              <a className="admin-link" href={`tel:${String(lead.contact || '').replace(/[^+\d]/g, '')}`}>Позвонить</a>
              <a className="admin-link secondary-link" href={`https://wa.me/${String(lead.contact || '').replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <button type="button" className="danger" onClick={() => deleteLead(lead.id)}>Удалить</button>
            </div>
          </article>
        ))}
      </div>

      {!filteredLeads.length && <div className="admin-status">По выбранным условиям лидов нет.</div>}
    </section>
  );
}
