import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getSupabaseClient } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const dataFile = path.join(dataDir, 'leads.json');

export async function appendLead(lead) {
  const savedLead = {
    id: crypto.randomUUID(),
    ...lead
  };

  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        id: savedLead.id,
        object: savedLead.object,
        area: savedLead.area,
        frequency: savedLead.frequency,
        details: savedLead.details,
        contact: savedLead.contact,
        source: savedLead.source,
        payload: savedLead,
        created_at: savedLead.createdAt
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Supabase lead save failed: ${error.message}`);
    }

    return {
      ...savedLead,
      supabaseId: data.id
    };
  }

  await fs.mkdir(dataDir, { recursive: true });
  const existing = await readLeads();
  existing.push(savedLead);
  await fs.writeFile(dataFile, JSON.stringify(existing, null, 2), 'utf-8');

  return savedLead;
}

async function readLeads() {
  try {
    const content = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}
