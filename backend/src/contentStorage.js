import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readGithubJson, writeGithubJson, isGithubStorageConfigured } from './githubStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const contentFile = path.join(dataDir, 'site-content.json');
const githubContentPath = process.env.GITHUB_CONTENT_PATH || 'content/site-content.json';

export async function readSiteContent() {
  if (isGithubStorageConfigured()) {
    const content = await readGithubJson(githubContentPath);
    if (content) return content;
  }

  try {
    const content = await fs.readFile(contentFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function writeSiteContent(content) {
  const savedContent = {
    ...content,
    updatedAt: new Date().toISOString()
  };

  if (isGithubStorageConfigured()) {
    await writeGithubJson(githubContentPath, savedContent, 'Update site content from admin');
    return savedContent;
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(contentFile, JSON.stringify(savedContent, null, 2), 'utf-8');
  return savedContent;
}

export function requireAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  const header = req.headers.authorization || '';
  const requestToken = header.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new Error('ADMIN_TOKEN is not configured');
  }

  if (!requestToken || requestToken !== token) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}
