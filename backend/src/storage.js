import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const dataFile = path.join(dataDir, 'leads.json');

export async function appendLead(lead) {
  await fs.mkdir(dataDir, { recursive: true });

  const savedLead = {
    id: crypto.randomUUID(),
    ...lead
  };

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
