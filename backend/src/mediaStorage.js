import path from 'path';
import crypto from 'crypto';
import { getSupabaseClient, MEDIA_BUCKET } from './supabaseClient.js';

function safeExt(originalName = '') {
  const ext = path.extname(originalName).toLowerCase();
  return ext && ext.length <= 10 ? ext : '.jpg';
}

export async function uploadMedia(file) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  if (!file) {
    throw new Error('File is required');
  }

  const ext = safeExt(file.originalname);
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const storagePath = `uploads/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Supabase media upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return {
    path: storagePath,
    url: data.publicUrl,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  };
}
