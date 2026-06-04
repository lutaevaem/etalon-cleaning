import crypto from 'crypto';
import path from 'path';
import { requireAdmin, writeGithubFile, sendError, sendJson } from './_github.js';

const MAX_SIZE_BYTES = 6 * 1024 * 1024;
const MEDIA_PATH = process.env.GITHUB_MEDIA_PATH || 'frontend/public/uploads';

function safeExtension(filename = '', mimeType = '') {
  const fromName = path.extname(filename).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(fromName)) {
    return fromName;
  }

  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/svg+xml') return '.svg';
  return '.jpg';
}

function slugify(value = 'image') {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
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

    requireAdmin(req);

    const { filename = 'image.jpg', mimeType = 'image/jpeg', base64 = '' } = req.body || {};

    if (!String(mimeType).startsWith('image/')) {
      const error = new Error('Можно загружать только изображения');
      error.statusCode = 400;
      throw error;
    }

    if (!base64) {
      const error = new Error('Файл не найден');
      error.statusCode = 400;
      throw error;
    }

    const cleanBase64 = String(base64).replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > MAX_SIZE_BYTES) {
      const error = new Error('Файл слишком большой. Максимум 6 МБ');
      error.statusCode = 400;
      throw error;
    }

    const ext = safeExtension(filename, mimeType);
    const name = `${Date.now()}-${slugify(filename)}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const filePath = `${MEDIA_PATH}/${name}`;

    const uploaded = await writeGithubFile(filePath, buffer, 'Upload image from admin');

    sendJson(res, 201, {
      ok: true,
      media: {
        ...uploaded,
        publicPath: `/uploads/${name}`,
        filename,
        size: buffer.length,
        mimeType
      }
    });
  } catch (error) {
    sendError(res, error, 'Media upload failed');
  }
}
