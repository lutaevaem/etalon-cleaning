import crypto from 'crypto';
import { readGithubJson, writeGithubJson, sendError, sendJson } from './_github.js';

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
    createdAt: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      sendJson(res, 405, {
        ok: false,
        message: 'Method not allowed'
      });
      return;
    }

    const lead = normalizeLead(req.body);
    const existingLeads = await readGithubJson(LEADS_PATH, []);
    existingLeads.push(lead);

    await writeGithubJson(LEADS_PATH, existingLeads, 'Add lead from Vercel site form');

    sendJson(res, 201, {
      ok: true,
      leadId: lead.id
    });
  } catch (error) {
    sendError(res, error, 'Lead request failed');
  }
}
