import crypto from 'crypto';
import { readGithubJson, writeGithubJson, requireAdmin, sendError, sendJson } from './_github.js';

const LEADS_PATH = process.env.GITHUB_LEADS_PATH || 'content/leads.json';
const LEADS_STORAGE = process.env.LEADS_STORAGE || 'safe';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_LEAD_MODE = process.env.TELEGRAM_LEAD_MODE || 'full';

function isGithubLeadStorageEnabled() {
  return LEADS_STORAGE === 'github';
}

function isTelegramEnabled() {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);
}

function normalizeLead(body = {}) {
  const contact = String(body.contact || '').trim();

  if (!contact) {
    const error = new Error('Укажите телефон или мессенджер для связи');
    error.statusCode = 400;
    throw error;
  }

  return {
    id: crypto.randomUUID(),
    object: String(body.object || '').trim(),
    area: String(body.area || '').trim(),
    frequency: String(body.frequency || '').trim(),
    details: String(body.details || '').trim(),
    contact,
    source: String(body.source || 'site').trim(),
    status: 'new',
    priority: 'normal',
    managerComment: '',
    nextContactAt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeLeadRecord(lead = {}) {
  return {
    id: lead.id || crypto.randomUUID(),
    object: lead.object || '',
    area: lead.area || '',
    frequency: lead.frequency || '',
    details: lead.details || '',
    contact: lead.contact || '',
    source: lead.source || 'site',
    status: lead.status || 'new',
    priority: lead.priority || 'normal',
    managerComment: lead.managerComment || '',
    nextContactAt: lead.nextContactAt || '',
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: lead.updatedAt || lead.createdAt || new Date().toISOString()
  };
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Novosibirsk',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function getSourceLabel(source = '') {
  const labels = {
    'site-quiz': 'Главная страница',
    'prices-page': 'Страница цен',
    site: 'Сайт'
  };

  return labels[source] || source || 'Сайт';
}

function buildTelegramLeadMessage(lead) {
  const source = getSourceLabel(lead.source);
  const createdAt = formatDate(lead.createdAt);

  if (TELEGRAM_LEAD_MODE === 'minimal') {
    return [
      '🧼 Новая заявка с сайта Эталон Клининнг',
      '',
      `Источник: ${source}`,
      `Время: ${createdAt}`,
      '',
      'Откройте админку, чтобы посмотреть детали.'
    ].join('\n');
  }

  return [
    '🧼 Новая заявка с сайта Эталон Клининнг',
    '',
    `Источник: ${source}`,
    `Тип помещения: ${lead.object || 'не указано'}`,
    `Площадь: ${lead.area || 'не указано'}`,
    `Формат: ${lead.frequency || 'не указано'}`,
    `Комментарий: ${lead.details || 'не указано'}`,
    `Контакт: ${lead.contact}`,
    `Время: ${createdAt}`
  ].join('\n');
}

async function sendTelegramLeadNotification(lead) {
  if (!isTelegramEnabled()) {
    return { enabled: false, ok: false };
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: buildTelegramLeadMessage(lead),
      disable_web_page_preview: true
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || 'Telegram notification failed');
  }

  return { enabled: true, ok: true };
}

async function readLeads() {
  if (!isGithubLeadStorageEnabled()) return [];
  const leads = await readGithubJson(LEADS_PATH, []);
  return Array.isArray(leads) ? leads.map(normalizeLeadRecord) : [];
}

async function writeLeads(leads, message = 'Update leads from admin') {
  if (!isGithubLeadStorageEnabled()) return leads.map(normalizeLeadRecord);
  await writeGithubJson(LEADS_PATH, leads.map(normalizeLeadRecord), message);
  return leads.map(normalizeLeadRecord);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      requireAdmin(req);
      const leads = await readLeads();
      sendJson(res, 200, {
        ok: true,
        storage: isGithubLeadStorageEnabled() ? 'github' : 'safe',
        telegram: { enabled: isTelegramEnabled(), mode: TELEGRAM_LEAD_MODE },
        leads: leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
      return;
    }

    if (req.method === 'POST') {
      const lead = normalizeLead(req.body);

      if (isGithubLeadStorageEnabled()) {
        const existingLeads = await readLeads();
        existingLeads.push(lead);
        await writeLeads(existingLeads, 'Add lead from Vercel site form');
      }

      let telegram = { enabled: isTelegramEnabled(), ok: false };
      try {
        telegram = await sendTelegramLeadNotification(lead);
      } catch (error) {
        console.error('Telegram lead notification failed:', error.message);
      }

      sendJson(res, 201, {
        ok: true,
        leadId: lead.id,
        storage: isGithubLeadStorageEnabled() ? 'github' : 'safe',
        telegram
      });
      return;
    }

    if (req.method === 'PATCH') {
      requireAdmin(req);

      if (!isGithubLeadStorageEnabled()) {
        const error = new Error('Lead storage is disabled. Enable LEADS_STORAGE=github only after making the repository private or connecting a secure CRM.');
        error.statusCode = 403;
        throw error;
      }

      const { id, status, priority, managerComment, nextContactAt } = req.body || {};

      if (!id) {
        const error = new Error('Lead id is required');
        error.statusCode = 400;
        throw error;
      }

      const leads = await readLeads();
      const index = leads.findIndex((lead) => lead.id === id);

      if (index === -1) {
        const error = new Error('Lead not found');
        error.statusCode = 404;
        throw error;
      }

      leads[index] = {
        ...leads[index],
        ...(status !== undefined ? { status: String(status) } : {}),
        ...(priority !== undefined ? { priority: String(priority) } : {}),
        ...(managerComment !== undefined ? { managerComment: String(managerComment) } : {}),
        ...(nextContactAt !== undefined ? { nextContactAt: String(nextContactAt) } : {}),
        updatedAt: new Date().toISOString()
      };

      const savedLeads = await writeLeads(leads, 'Update lead from admin');

      sendJson(res, 200, {
        ok: true,
        lead: savedLeads.find((lead) => lead.id === id),
        leads: savedLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
      return;
    }

    if (req.method === 'DELETE') {
      requireAdmin(req);

      if (!isGithubLeadStorageEnabled()) {
        const error = new Error('Lead storage is disabled.');
        error.statusCode = 403;
        throw error;
      }

      const { id } = req.body || {};

      if (!id) {
        const error = new Error('Lead id is required');
        error.statusCode = 400;
        throw error;
      }

      const leads = await readLeads();
      const filteredLeads = leads.filter((lead) => lead.id !== id);

      if (filteredLeads.length === leads.length) {
        const error = new Error('Lead not found');
        error.statusCode = 404;
        throw error;
      }

      const savedLeads = await writeLeads(filteredLeads, 'Delete lead from admin');

      sendJson(res, 200, {
        ok: true,
        leads: savedLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    sendJson(res, 405, {
      ok: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    sendError(res, error, 'Lead request failed');
  }
}
