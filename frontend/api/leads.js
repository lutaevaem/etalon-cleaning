import crypto from 'crypto';
import { readGithubJson, writeGithubJson, requireAdmin, sendError, sendJson } from './_github.js';

const LEADS_PATH = process.env.GITHUB_LEADS_PATH || 'content/leads.json';

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

async function readLeads() {
  const leads = await readGithubJson(LEADS_PATH, []);
  return Array.isArray(leads) ? leads.map(normalizeLeadRecord) : [];
}

async function writeLeads(leads, message = 'Update leads from admin') {
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
        leads: leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
      return;
    }

    if (req.method === 'POST') {
      const lead = normalizeLead(req.body);
      const existingLeads = await readLeads();
      existingLeads.push(lead);

      await writeLeads(existingLeads, 'Add lead from Vercel site form');

      sendJson(res, 201, {
        ok: true,
        leadId: lead.id
      });
      return;
    }

    if (req.method === 'PATCH') {
      requireAdmin(req);
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
