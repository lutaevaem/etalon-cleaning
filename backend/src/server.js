import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { appendLead } from './storage.js';
import { notifyTelegram } from './telegram.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'etalon-cleaning-backend'
  });
});

app.post('/api/leads', async (req, res) => {
  try {
    const lead = normalizeLead(req.body);
    const savedLead = await appendLead(lead);

    await notifyTelegram(savedLead);

    res.status(201).json({
      ok: true,
      leadId: savedLead.id
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message || 'Lead validation failed'
    });
  }
});

function normalizeLead(body) {
  const contact = String(body.contact || '').trim();

  if (!contact) {
    throw new Error('Укажите телефон или мессенджер для связи');
  }

  return {
    object: String(body.object || '').trim(),
    area: String(body.area || '').trim(),
    frequency: String(body.frequency || '').trim(),
    details: String(body.details || '').trim(),
    contact,
    source: String(body.source || 'site').trim(),
    createdAt: new Date().toISOString()
  };
}

app.listen(port, () => {
  console.log(`Etalon cleaning backend started on http://localhost:${port}`);
});
