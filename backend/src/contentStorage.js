import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabaseClient, SITE_CONTENT_KEY } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const contentFile = path.join(dataDir, 'site-content.json');

export async function readSiteContent() {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('site_content')
      .select('content, updated_at')
      .eq('key', SITE_CONTENT_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Supabase content read failed:', error.message);
    }

    if (data?.content) {
      return {
        ...data.content,
        updatedAt: data.updated_at
      };
    }
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

  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('site_content')
      .upsert({
        key: SITE_CONTENT_KEY,
        content: savedContent,
        updated_at: savedContent.updatedAt
      }, { onConflict: 'key' })
      .select('content, updated_at')
      .single();

    if (error) {
      throw new Error(`Supabase content save failed: ${error.message}`);
    }

    return {
      ...data.content,
      updatedAt: data.updated_at
    };
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
