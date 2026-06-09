import { requireAdmin, sendError, sendJson, writeGithubFile } from './_github.js';

export const config = {
  api: {
    bodyParser: false
  }
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const UPLOAD_DIR = process.env.GITHUB_UPLOADS_PATH || 'frontend/public/uploads';
const PUBLIC_UPLOAD_PATH = process.env.PUBLIC_UPLOAD_PATH || '/uploads';

function getExtension(contentType = '', filename = '') {
  const cleanName = filename.toLowerCase();

  if (contentType.includes('image/png') || cleanName.endsWith('.png')) return 'png';
  if (contentType.includes('image/webp') || cleanName.endsWith('.webp')) return 'webp';
  if (contentType.includes('image/jpeg') || contentType.includes('image/jpg') || cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) return 'jpg';
  if (contentType.includes('image/svg+xml') || cleanName.endsWith('.svg')) return 'svg';

  const error = new Error('Поддерживаются только изображения JPG, PNG, WEBP или SVG');
  error.statusCode = 400;
  throw error;
}

function safeName(value = 'image') {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9а-яё_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 54) || 'image';
}

async function readRequestBuffer(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function parseMultipart(buffer, contentType = '') {
  const boundaryMatch = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);

  if (!boundaryMatch) {
    const error = new Error('Не удалось прочитать файл: отсутствует boundary в multipart/form-data');
    error.statusCode = 400;
    throw error;
  }

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const parts = [];
  let position = 0;

  while (position < buffer.length) {
    const boundaryStart = buffer.indexOf(boundary, position);
    if (boundaryStart === -1) break;

    const partStart = boundaryStart + boundary.length;
    const nextBoundary = buffer.indexOf(boundary, partStart);
    if (nextBoundary === -1) break;

    let part = buffer.slice(partStart, nextBoundary);

    if (part.slice(0, 2).toString() === '--') break;
    if (part.slice(0, 2).toString() === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);

    parts.push(part);
    position = nextBoundary;
  }

  for (const part of parts) {
    const separator = Buffer.from('\r\n\r\n');
    const separatorIndex = part.indexOf(separator);
    if (separatorIndex === -1) continue;

    const rawHeaders = part.slice(0, separatorIndex).toString('utf-8');
    const fileBuffer = part.slice(separatorIndex + separator.length);

    const disposition = rawHeaders.match(/content-disposition:[^\n]+/i)?.[0] || '';
    const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || '';
    const partContentType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || '';

    if (filename && fileBuffer.length) {
      return {
        filename,
        contentType: partContentType,
        buffer: fileBuffer
      };
    }
  }

  const error = new Error('Файл не найден в запросе');
  error.statusCode = 400;
  throw error;
}

function parseDataUrl(value = '') {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    const error = new Error('Некорректный base64-формат изображения');
    error.statusCode = 400;
    throw error;
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

async function readUpload(req) {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    const buffer = await readRequestBuffer(req);
    return parseMultipart(buffer, contentType);
  }

  if (req.body?.file || req.body?.imageBase64 || req.body?.dataUrl) {
    const data = parseDataUrl(req.body.file || req.body.imageBase64 || req.body.dataUrl);
    return {
      filename: req.body.filename || 'image',
      ...data
    };
  }

  const error = new Error('Передайте изображение через поле file');
  error.statusCode = 400;
  throw error;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      sendJson(res, 405, { ok: false, message: 'Method not allowed' });
      return;
    }

    requireAdmin(req);

    const upload = await readUpload(req);

    if (!upload.buffer?.length) {
      const error = new Error('Файл пустой');
      error.statusCode = 400;
      throw error;
    }

    if (upload.buffer.length > MAX_FILE_SIZE) {
      const error = new Error('Файл слишком большой. Максимум — 8 МБ');
      error.statusCode = 413;
      throw error;
    }

    const extension = getExtension(upload.contentType, upload.filename);
    const fileName = `${Date.now()}-${safeName(upload.filename)}.${extension}`;
    const filePath = `${UPLOAD_DIR}/${fileName}`;

    const saved = await writeGithubFile(filePath, upload.buffer, `Upload admin image ${fileName}`);
    const publicUrl = `${PUBLIC_UPLOAD_PATH}/${fileName}`;

    sendJson(res, 200, {
      ok: true,
      url: publicUrl,
      imageUrl: publicUrl,
      rawUrl: saved.url,
      path: saved.path,
      message: 'Фото загружено. Если изображение не появилось сразу, подождите деплой Vercel 1–2 минуты или используйте rawUrl.'
    });
  } catch (error) {
    sendError(res, error, 'Ошибка загрузки фото');
  }
}
