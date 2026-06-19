import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { appendLead } from './storage.js';
import { notifyTelegram } from './telegram.js';
import { readSiteContent, writeSiteContent, requireAdmin } from './contentStorage.js';
import { uploadMedia } from './mediaStorage.js';

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'));
      return;
    }

    callback(null, true);
  }
});

const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const allowedOrigins = frontendOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
const rawPublicPrefix = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/frontend\/public/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'etalon-cleaning-backend'
  });
});

app.get('/api/content', async (req, res) => {
  const content = normalizePublicMediaUrls(await readSiteContent());
  res.json({
    ok: true,
    content
  });
});

app.put('/api/content', async (req, res) => {
  try {
    requireAdmin(req);
    const content = req.body?.content;

    if (!content || typeof content !== 'object') {
      throw new Error('Content payload is required');
    }

    const savedContent = await writeSiteContent(content);

    res.json({
      ok: true,
      content: normalizePublicMediaUrls(savedContent)
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Content update failed'
    });
  }
});

app.post('/api/media', upload.single('file'), async (req, res) => {
  try {
    requireAdmin(req);
    const media = await uploadMedia(req.file);

    res.status(201).json({
      ok: true,
      media
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Media upload failed'
    });
  }
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

function normalizePublicMediaUrls(value) {
  if (Array.isArray(value)) {
    return value.map(normalizePublicMediaUrls);
  }

  if (value && typeof value === 'object') {
    const normalized = {};

    for (const [key, item] of Object.entries(value)) {
      normalized[key] = normalizePublicMediaUrls(item);
    }

    if (normalized.publicPath && typeof normalized.imageUrl === 'string') {
      normalized.imageUrl = normalized.publicPath;
    } else if (typeof normalized.imageUrl === 'string') {
      normalized.imageUrl = normalized.imageUrl.replace(rawPublicPrefix, '');
    }

    return normalized;
  }

  if (typeof value === 'string') {
    return value.replace(rawPublicPrefix, '');
  }

  return value;
}

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
