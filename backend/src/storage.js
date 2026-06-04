import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { readGithubJson, writeGithubJson, isGithubStorageConfigured } from './githubStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
const dataFile = path.join(dataDir, 'leads.json');
const githubLeadsPath = process.env.GITHUB_LEADS_PATH || 'content/leads.json';

export async function appendLead(lead) {
  const savedLead = {
    id: crypto.randomUUID(),
    ...lead
  };

  if (isGithubStorageConfigured()) {
    const existing = await readGithubJson(githubLeadsPath) || [];
    existing.push(savedLead);
    await writeGithubJson(githubLeadsPath, existing, 'Add lead from site form');
    return savedLead;
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
