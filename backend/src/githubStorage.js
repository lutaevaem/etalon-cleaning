const GITHUB_API_URL = 'https://api.github.com';

export function isGithubStorageConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

function getConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO || 'lutaevaem/etalon-cleaning',
    branch: process.env.GITHUB_BRANCH || 'main'
  };
}

function getHeaders() {
  const { token } = getConfig();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

function encodeBase64(value) {
  return Buffer.from(value).toString('base64');
}

function decodeBase64(value) {
  return Buffer.from(value, 'base64').toString('utf-8');
}

async function requestGithub(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `GitHub request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function getFile(filePath) {
  const { repo, branch } = getConfig();
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`;
  return requestGithub(url);
}

export async function readGithubJson(filePath) {
  if (!isGithubStorageConfigured()) {
    return null;
  }

  const file = await getFile(filePath);

  if (!file?.content) {
    return null;
  }

  return JSON.parse(decodeBase64(file.content));
}

export async function writeGithubJson(filePath, data, message = 'Update site content') {
  if (!isGithubStorageConfigured()) {
    return null;
  }

  const { repo, branch } = getConfig();
  const existingFile = await getFile(filePath);
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`;

  const payload = {
    message,
    branch,
    content: encodeBase64(`${JSON.stringify(data, null, 2)}\n`)
  };

  if (existingFile?.sha) {
    payload.sha = existingFile.sha;
  }

  await requestGithub(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return data;
}

export async function writeGithubFile(filePath, buffer, message = 'Upload media file') {
  if (!isGithubStorageConfigured()) {
    return null;
  }

  const { repo, branch } = getConfig();
  const existingFile = await getFile(filePath);
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`;

  const payload = {
    message,
    branch,
    content: Buffer.from(buffer).toString('base64')
  };

  if (existingFile?.sha) {
    payload.sha = existingFile.sha;
  }

  await requestGithub(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return {
    path: filePath,
    url: `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`
  };
}
