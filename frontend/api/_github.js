const GITHUB_API_URL = 'https://api.github.com';

export function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO || 'lutaevaem/etalon-cleaning',
    branch: process.env.GITHUB_BRANCH || 'main'
  };
}

function decodeBasicAuth(header = '') {
  if (!header.toLowerCase().startsWith('basic ')) {
    return null;
  }

  const encoded = header.replace(/^Basic\s+/i, '').trim();
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1)
  };
}

function decodeBearerCredentials(header = '') {
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const value = header.replace(/^Bearer\s+/i, '').trim();

  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

export function requireAdmin(req) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const legacyToken = process.env.ADMIN_TOKEN;
  const header = req.headers.authorization || '';

  if (username && password) {
    const credentials = decodeBasicAuth(header) || decodeBearerCredentials(header);

    if (credentials?.username === username && credentials?.password === password) {
      return;
    }

    const error = new Error('Неверный логин или пароль');
    error.statusCode = 401;
    throw error;
  }

  if (!legacyToken) {
    const error = new Error('ADMIN_USERNAME and ADMIN_PASSWORD are not configured in Vercel');
    error.statusCode = 500;
    throw error;
  }

  const requestToken = header.replace(/^Bearer\s+/i, '').trim();

  if (!requestToken || requestToken !== legacyToken) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}

function requireGithubToken() {
  const { token } = getGithubConfig();

  if (!token) {
    const error = new Error('GITHUB_TOKEN is not configured in Vercel');
    error.statusCode = 500;
    throw error;
  }
}

function getHeaders(extra = {}) {
  const { token } = getGithubConfig();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra
  };
}

function encodeBase64(value) {
  return Buffer.from(value).toString('base64');
}

function decodeBase64(value) {
  return Buffer.from(value, 'base64').toString('utf-8');
}

function encodePath(filePath) {
  return encodeURIComponent(filePath).replace(/%2F/g, '/');
}

async function requestGithub(url, options = {}) {
  requireGithubToken();

  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers || {})
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `GitHub request failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

async function getFile(filePath) {
  const { repo, branch } = getGithubConfig();
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`;
  return requestGithub(url);
}

export async function readGithubJson(filePath, fallback = null) {
  const file = await getFile(filePath);

  if (!file?.content) {
    return fallback;
  }

  return JSON.parse(decodeBase64(file.content));
}

export async function writeGithubJson(filePath, data, message) {
  const { repo, branch } = getGithubConfig();
  const existingFile = await getFile(filePath);
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodePath(filePath)}`;

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

export async function writeGithubFile(filePath, buffer, message) {
  const { repo, branch } = getGithubConfig();
  const existingFile = await getFile(filePath);
  const url = `${GITHUB_API_URL}/repos/${repo}/contents/${encodePath(filePath)}`;

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

export function sendJson(res, statusCode, data) {
  res.status(statusCode).json(data);
}

export function sendError(res, error, fallbackMessage = 'Request failed') {
  res.status(error.statusCode || 400).json({
    ok: false,
    message: error.message || fallbackMessage
  });
}
