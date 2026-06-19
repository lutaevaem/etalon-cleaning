import path from 'path';
import crypto from 'crypto';
import { writeGithubFile, isGithubStorageConfigured } from './githubStorage.js';

function safeExt(originalName = '') {
  const ext = path.extname(originalName).toLowerCase();
  return ext && ext.length <= 10 ? ext : '.jpg';
}

export async function uploadMedia(file) {
  if (!isGithubStorageConfigured()) {
    throw new Error('GitHub storage is not configured');
  }

  if (!file) {
    throw new Error('File is required');
  }

  const ext = safeExt(file.originalname);
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const mediaRoot = process.env.GITHUB_MEDIA_PATH || 'frontend/public/uploads';
  const mediaPath = `${mediaRoot}/${filename}`;
  const publicPath = `/uploads/${filename}`;
  const result = await writeGithubFile(mediaPath, file.buffer, 'Upload media from admin');

  return {
    path: result.path,
    url: publicPath,
    publicPath,
    storagePath: result.path,
    rawUrl: result.url,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  };
}
